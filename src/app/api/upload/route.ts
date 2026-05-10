import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, chmod } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/prisma';
import { existsSync } from 'fs';
import convert from 'heic-convert';
import sharp from 'sharp';
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
    const extension = file.name.split('.').pop()?.toLowerCase() || 'png';

    // Handle iPhone HEIC format first (sharp doesn't support HEIC by default in many environments)
    if (extension === 'heic' || extension === 'heif') {
      const outputBuffer = await convert({
        buffer: buffer,
        format: 'JPEG',
        quality: 0.9
      });
      buffer = Buffer.from(outputBuffer);
    }

    // Modern WebP optimization using sharp
    const optimizedBuffer = await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const finalFileName = `${workOrderId}-${Math.random().toString(36).substring(2, 10)}.webp`;
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const fullPath = join(uploadDir, finalFileName);

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    await writeFile(fullPath, optimizedBuffer);
    // Ensure Linux read permissions
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
    console.error('Upload/Optimization error:', error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}
