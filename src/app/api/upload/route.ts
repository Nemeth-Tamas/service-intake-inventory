import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/prisma';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const workOrderId = formData.get('workOrderId') as string;

  if (!file || !workOrderId) {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Generate a random ID for the image
  const randomId = Math.random().toString(36).substring(2, 10);
  const extension = file.name.split('.').pop() || 'png';
  const fileName = `${workOrderId}-${randomId}.${extension}`;
  const uploadDir = join(process.cwd(), 'public', 'uploads');
  const path = join(uploadDir, fileName);

  try {
    // Ensure directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    await writeFile(path, buffer);

    const photo = await prisma.photo.create({
      data: {
        workOrderId,
        filePath: `/uploads/${fileName}`,
      },
    });

    return NextResponse.json({ success: true, photo });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
  }
}
