import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, chmod } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/prisma';
import { existsSync } from 'fs';
import convert from 'heic-convert';
import { publishUpdate } from '@/lib/realtime';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const workOrderId = formData.get('workOrderId') as string;

    if (!file || !workOrderId) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    let buffer = Buffer.from(await file.arrayBuffer());
    let fileName = `${workOrderId}-${Math.random().toString(36).substring(2, 10)}`;
    let extension = file.name.split('.').pop()?.toLowerCase() || 'png';

    // Handle iPhone HEIC format
    if (extension === 'heic' || extension === 'heif') {
      console.log('Converting HEIC to JPEG...');
      const outputBuffer = await convert({
        buffer: buffer,
        format: 'JPEG',
        quality: 0.8
      });
      buffer = Buffer.from(outputBuffer);
      extension = 'jpg';
      console.log('Conversion successful.');
    }

    const finalFileName = `${fileName}.${extension}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const fullPath = join(uploadDir, finalFileName);

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    await writeFile(fullPath, buffer);
    // Ensure Linux read permissions immediately
    try { await chmod(fullPath, 0o666); } catch (e) {}

    const photo = await prisma.photo.create({
      data: {
        workOrderId,
        filePath: `/uploads/${finalFileName}`,
      },
    });

    // Trigger real-time update
    await publishUpdate(`order-${workOrderId}`);

    return NextResponse.json({ success: true, photo });
  } catch (error) {
    console.error('Upload/Conversion error:', error);
    return NextResponse.json({ error: 'Failed to process upload' }, { status: 500 });
  }
}
