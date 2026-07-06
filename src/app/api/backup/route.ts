import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';

export async function GET() {
  try {
    const zip = new AdmZip();

    // Add DB
    const dbPath = path.join(process.cwd(), 'prisma/data/dev.db');
    if (fs.existsSync(dbPath)) {
      zip.addLocalFile(dbPath, 'db');
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
  }
}
