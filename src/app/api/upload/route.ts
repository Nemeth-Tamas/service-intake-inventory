import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const workOrderId = formData.get('workOrderId') as string;

  if (!file || !workOrderId) {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const fileName = `${Date.now()}-${file.name}`;
  const path = join(process.cwd(), 'public/uploads', fileName);
  await writeFile(path, buffer);

  const photo = await prisma.photo.create({
    data: {
      workOrderId,
      filePath: `/uploads/${fileName}`,
    },
  });

  return NextResponse.json({ success: true, photo });
}
