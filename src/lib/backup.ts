import { prisma } from './prisma';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';

async function logBackupActivity(message: string, type: 'SUCCESS' | 'WARNING' | 'INFO') {
  try {
    await prisma.activityLog.create({
      data: {
        type,
        message,
      }
    });
  } catch (err) {
    console.error('Failed to log backup activity:', err);
  }
}

export async function runBackupJob() {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings) return;

  const backupDir = path.join(process.cwd(), 'prisma/data/backups');
  
  try {
    // 1. Create directory if not exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // 2. Initialize ZIP
    const zip = new AdmZip();

    // 3. Add DB file
    const dbPath = path.join(process.cwd(), 'prisma/data/dev.db');
    if (fs.existsSync(dbPath)) {
      zip.addLocalFile(dbPath, 'db');
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

    // 7. Optional NAS backup path
    if (settings.nasBackupPath && settings.nasBackupPath.trim() !== '') {
      try {
        if (!fs.existsSync(settings.nasBackupPath)) {
          fs.mkdirSync(settings.nasBackupPath, { recursive: true });
        }
        const nasFilePath = path.join(settings.nasBackupPath, backupFileName);
        fs.copyFileSync(backupFilePath, nasFilePath);
      } catch (nasError: any) {
        console.error('Failed to copy backup to NAS path:', nasError);
        await logBackupActivity(`Biztonsági mentés másolása a NAS-ra sikertelen: ${nasError.message}`, 'WARNING');
      }
    }

    // 8. Clean up old backups (keep last 5 local backups)
    try {
      const files = fs.readdirSync(backupDir);
      const backupFiles = files
        .filter(f => f.startsWith('backup-') && f.endsWith('.zip'))
        .map(f => ({
          name: f,
          path: path.join(backupDir, f),
          ctime: fs.statSync(path.join(backupDir, f)).ctimeMs
        }))
        .sort((a, b) => b.ctime - a.ctime); // newest first

      if (backupFiles.length > 5) {
        for (let i = 5; i < backupFiles.length; i++) {
          fs.unlinkSync(backupFiles[i].path);
        }
      }
    } catch (cleanError) {
      console.error('Failed to clean up old backups:', cleanError);
    }

    // 9. Update settings
    await prisma.settings.update({
      where: { id: 1 },
      data: {
        lastBackupTime: new Date(),
        backupStatus: 'success',
        backupError: null,
      }
    });

    await logBackupActivity('Automatikus biztonsági mentés sikeresen lefutott.', 'SUCCESS');
  } catch (error: any) {
    console.error('Backup job failed:', error);
    await prisma.settings.update({
      where: { id: 1 },
      data: {
        backupStatus: 'failed',
        backupError: error.message || 'Ismeretlen hiba',
      }
    });
    await logBackupActivity(`Automatikus biztonsági mentés sikertelen: ${error.message}`, 'WARNING');
  }
}

export async function restoreBackup(zipPath: string) {
  try {
    const zip = new AdmZip(zipPath);

    // 1. Verify zip contents
    const entries = zip.getEntries();
    const hasDb = entries.some(e => e.entryName === 'db/dev.db');
    if (!hasDb) {
      throw new Error('Érvénytelen mentési fájl: A dev.db nem található a ZIP-ben.');
    }

    const dbPath = path.join(process.cwd(), 'prisma/data/dev.db');
    const uploadsDir = path.join(process.cwd(), 'public/uploads');
    const archivesDir = path.join(process.cwd(), 'public/archives');

    // Extract database
    const dbEntry = entries.find(e => e.entryName === 'db/dev.db');
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
  } catch (error: any) {
    console.error('Restore failed:', error);
    await logBackupActivity(`Rendszer visszaállítás sikertelen: ${error.message}`, 'WARNING');
    throw error;
  }
}
