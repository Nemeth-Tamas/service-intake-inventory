import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { auth } from '@/auth';
import { createSafeDbSnapshot } from '@/lib/backup';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  let snapshotPath: string | null = null;
  try {
    const zip = new AdmZip();

    // Add consistent SQLite DB snapshot
    snapshotPath = await createSafeDbSnapshot();
    if (snapshotPath && fs.existsSync(snapshotPath)) {
      zip.addLocalFile(snapshotPath, 'db', 'dev.db');
    }

    // Add Uploads
    const uploadsDir = path.join(process.cwd(), 'public/uploads');
    if (fs.existsSync(uploadsDir)) {
      zip.addLocalFolder(uploadsDir, 'uploads');
    }

    // Add Archives
    const archivesDir = path.join(process.cwd(), 'public/archives');
    if (fs.existsSync(archivesDir)) {
      zip.addLocalFolder(archivesDir, 'archives');
    }

    const buffer = zip.toBuffer();
    const fileName = `backup-serviceapp-${new Date().toISOString().split('T')[0]}.zip`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Backup ZIP download error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  } finally {
    if (snapshotPath && fs.existsSync(snapshotPath)) {
      try {
        fs.unlinkSync(snapshotPath);
      } catch {
        // ignore temp cleanup failure
      }
    }
  }
}
