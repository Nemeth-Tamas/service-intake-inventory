import { prisma } from './prisma';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';
import os from 'os';

const MAX_ROTATING_BACKUPS = 7;

const globalForBackup = globalThis as unknown as {
  isBackupRunning?: boolean;
};

async function logBackupActivity(message: string, type: 'SUCCESS' | 'WARNING' | 'INFO') {
  try {
    await prisma.activityLog.create({
      data: {
        type,
        message,
      },
    });
  } catch (err) {
    console.error('Failed to log backup activity:', err);
  }
}

/**
 * Creates a crash-consistent snapshot of the live SQLite database using VACUUM INTO.
 * Falls back to a direct file copy only if VACUUM INTO is unavailable.
 */
export async function createSafeDbSnapshot(): Promise<string | null> {
  const dbPath = path.join(process.cwd(), 'prisma/data/dev.db');
  if (!fs.existsSync(dbPath)) {
    return null;
  }

  const tempPath = path.join(
    os.tmpdir(),
    `serviceapp-db-snapshot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.db`
  );

  try {
    const escapedPath = tempPath.replace(/'/g, "''");
    await prisma.$executeRawUnsafe(`VACUUM INTO '${escapedPath}'`);
    if (fs.existsSync(tempPath)) {
      return tempPath;
    }
  } catch (err) {
    console.warn('SQLite VACUUM INTO failed, falling back to file copy:', err);
  }

  fs.copyFileSync(dbPath, tempPath);
  return tempPath;
}

function rotateBackupsInDir(dir: string, maxKeep: number = MAX_ROTATING_BACKUPS) {
  try {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    const backupFiles = files
      .filter((f) => f.startsWith('backup-') && f.endsWith('.zip'))
      .map((f) => {
        const fullPath = path.join(dir, f);
        const stat = fs.statSync(fullPath);
        return {
          name: f,
          path: fullPath,
          mtimeMs: stat.mtimeMs,
        };
      })
      .sort((a, b) => b.mtimeMs - a.mtimeMs); // newest first

    if (backupFiles.length > maxKeep) {
      for (let i = maxKeep; i < backupFiles.length; i++) {
        fs.unlinkSync(backupFiles[i].path);
      }
    }
  } catch (cleanError) {
    console.error(`Failed to rotate old backups in ${dir}:`, cleanError);
  }
}

export async function runBackupJob() {
  if (globalForBackup.isBackupRunning) {
    console.log('Backup job already in progress, skipping duplicate trigger.');
    return;
  }

  globalForBackup.isBackupRunning = true;
  let snapshotPath: string | null = null;

  try {
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    if (!settings) return;

    const backupDir = path.join(process.cwd(), 'prisma/data/backups');

    // 1. Create directory if not exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // 2. Initialize ZIP
    const zip = new AdmZip();

    // 3. Add consistent SQLite DB snapshot
    snapshotPath = await createSafeDbSnapshot();
    if (snapshotPath && fs.existsSync(snapshotPath)) {
      zip.addLocalFile(snapshotPath, 'db', 'dev.db');
    }

    // 4. Add Uploads folder
    const uploadsDir = path.join(process.cwd(), 'public/uploads');
    if (fs.existsSync(uploadsDir)) {
      zip.addLocalFolder(uploadsDir, 'uploads');
    }

    // 5. Add Archives folder
    const archivesDir = path.join(process.cwd(), 'public/archives');
    if (fs.existsSync(archivesDir)) {
      zip.addLocalFolder(archivesDir, 'archives');
    }

    // 6. Write the ZIP file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.zip`;
    const backupFilePath = path.join(backupDir, backupFileName);

    zip.writeZip(backupFilePath);

    // 7. Optional NAS backup path + rotation
    if (settings.nasBackupPath && settings.nasBackupPath.trim() !== '') {
      try {
        const nasDir = settings.nasBackupPath.trim();
        if (!fs.existsSync(nasDir)) {
          fs.mkdirSync(nasDir, { recursive: true });
        }
        const nasFilePath = path.join(nasDir, backupFileName);
        fs.copyFileSync(backupFilePath, nasFilePath);
        rotateBackupsInDir(nasDir, MAX_ROTATING_BACKUPS);
      } catch (nasError: unknown) {
        const message = nasError instanceof Error ? nasError.message : 'Ismeretlen hiba';
        console.error('Failed to copy backup to NAS path:', nasError);
        await logBackupActivity(`Biztonsági mentés másolása a NAS-ra sikertelen: ${message}`, 'WARNING');
      }
    }

    // 8. Rotate old local backups (keep last 7)
    rotateBackupsInDir(backupDir, MAX_ROTATING_BACKUPS);

    // 9. Update settings
    await prisma.settings.update({
      where: { id: 1 },
      data: {
        lastBackupTime: new Date(),
        backupStatus: 'success',
        backupError: null,
      },
    });

    await logBackupActivity(
      `Automatikus biztonsági mentés sikeresen lefutott (${backupFileName}, utolsó ${MAX_ROTATING_BACKUPS} mentés megőrizve).`,
      'SUCCESS'
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ismeretlen hiba';
    console.error('Backup job failed:', error);
    try {
      await prisma.settings.update({
        where: { id: 1 },
        data: {
          backupStatus: 'failed',
          backupError: message,
        },
      });
    } catch (updateErr) {
      console.error('Failed to update backup error status:', updateErr);
    }
    await logBackupActivity(`Automatikus biztonsági mentés sikertelen: ${message}`, 'WARNING');
  } finally {
    if (snapshotPath && fs.existsSync(snapshotPath)) {
      try {
        fs.unlinkSync(snapshotPath);
      } catch {
        // ignore temp cleanup failure
      }
    }
    globalForBackup.isBackupRunning = false;
  }
}

export async function checkAndRunScheduledBackup() {
  if (globalForBackup.isBackupRunning) return;

  try {
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    if (!settings || settings.backupInterval === 'none') return;

    const now = Date.now();
    const last = settings.lastBackupTime ? new Date(settings.lastBackupTime).getTime() : 0;
    const diffHours = (now - last) / (1000 * 60 * 60);
    const limitHours = settings.backupInterval === 'daily' ? 24 : 168;

    if (diffHours >= limitHours) {
      await runBackupJob();
    }
  } catch (err) {
    console.error('Scheduled backup check failed:', err);
  }
}

export async function restoreBackup(zipPath: string) {
  try {
    const zip = new AdmZip(zipPath);

    // 1. Verify zip contents
    const entries = zip.getEntries();
    const hasDb = entries.some((e) => e.entryName === 'db/dev.db');
    if (!hasDb) {
      throw new Error('Érvénytelen mentési fájl: A dev.db nem található a ZIP-ben.');
    }

    const dbPath = path.join(process.cwd(), 'prisma/data/dev.db');
    const uploadsDir = path.join(process.cwd(), 'public/uploads');
    const archivesDir = path.join(process.cwd(), 'public/archives');

    // Extract database
    const dbEntry = entries.find((e) => e.entryName === 'db/dev.db');
    if (dbEntry) {
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, `${dbPath}.before-restore`);
      }
      fs.writeFileSync(dbPath, dbEntry.getData());
    }

    // Extract uploads
    zip.extractEntryTo('uploads/', path.dirname(uploadsDir), true, true);

    // Extract archives
    zip.extractEntryTo('archives/', path.dirname(archivesDir), true, true);

    await logBackupActivity('Rendszer sikeresen visszaállítva egy korábbi mentésből.', 'SUCCESS');
    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ismeretlen hiba';
    console.error('Restore failed:', error);
    await logBackupActivity(`Rendszer visszaállítás sikertelen: ${message}`, 'WARNING');
    throw error;
  }
}
