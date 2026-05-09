import { readFile } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';
import { existsSync } from 'fs';

export async function GET() {
  const dbPath = join(process.cwd(), 'prisma/data/dev.db');
  
  if (!existsSync(dbPath)) {
    return new NextResponse('Backup file not found', { status: 404 });
  }

  try {
    const fileBuffer = await readFile(dbPath);
    const fileName = `backup-serviceapp-${new Date().toISOString().split('T')[0]}.db`;

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/x-sqlite3',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Backup error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
