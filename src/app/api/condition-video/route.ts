import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, chmod, unlink, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { prisma } from '@/lib/prisma';
import { publishUpdate } from '@/lib/realtime';
import { z } from 'zod';
import { ConditionVideoUploadSchema } from '@/lib/validation';
import { checkFmpegsInstalled, optimizeVideo, generateThumbnail, getVideoMetadata } from '@/lib/video';
import { calculateSha256 } from '@/lib/hash';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Nincs bejelentkezve.' }, { status: 401 });
    }

    const formData = await request.formData();
    const rawFile = formData.get('file');
    const rawWorkOrderId = formData.get('workOrderId');

    // Validate request fields
    const parsed = ConditionVideoUploadSchema.parse({ file: rawFile, workOrderId: rawWorkOrderId });
    const { file, workOrderId } = parsed;

    // Check if work order exists
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId }
    });
    if (!workOrder) {
      return NextResponse.json({ error: 'A megadott munkalap nem található.' }, { status: 404 });
    }

    // Verify ffmpeg & ffprobe availability
    const ffmpegInstalled = await checkFmpegsInstalled();
    if (!ffmpegInstalled) {
      return NextResponse.json(
        { error: 'Az ffmpeg/ffprobe nincs telepítve a szerveren. Kérjük, telepítse a videó optimalizáláshoz.' },
        { status: 500 }
      );
    }

    // Prepare paths
    const randomId = Math.random().toString(36).substring(2, 10);
    const finalSuffix = `${workOrderId}-${randomId}`;
    
    const videosDir = join(process.cwd(), 'public', 'uploads', 'videos');
    const thumbnailsDir = join(process.cwd(), 'public', 'uploads', 'video-thumbnails');

    if (!existsSync(videosDir)) {
      await mkdir(videosDir, { recursive: true });
    }
    if (!existsSync(thumbnailsDir)) {
      await mkdir(thumbnailsDir, { recursive: true });
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const tempRawPath = join(videosDir, `temp-${finalSuffix}.${fileExtension}`);
    const optimizedVideoPath = join(videosDir, `${finalSuffix}.mp4`);
    const thumbnailPath = join(thumbnailsDir, `${finalSuffix}.webp`);

    // Write raw video to temp file
    const rawBuffer = Buffer.from(await file.arrayBuffer());
    await writeFile(tempRawPath, rawBuffer);

    try {
      // Optimize video
      await optimizeVideo(tempRawPath, optimizedVideoPath);
      try { await chmod(optimizedVideoPath, 0o666); } catch (e) {}

      // Get metadata from optimized video
      const metadata = await getVideoMetadata(optimizedVideoPath);

      // Generate thumbnail
      await generateThumbnail(optimizedVideoPath, thumbnailPath);
      try { await chmod(thumbnailPath, 0o666); } catch (e) {}

      // Get optimized video stats (size)
      const videoStat = await stat(optimizedVideoPath);
      const sizeBytes = videoStat.size;

      // Calculate SHA-256 hashes
      const videoSha256 = await calculateSha256(optimizedVideoPath);
      let thumbnailSha256: string | null = null;
      try {
        thumbnailSha256 = await calculateSha256(thumbnailPath);
      } catch (hashError) {
        console.error('Failed to calculate thumbnail hash:', hashError);
      }

      // Store in database
      const conditionVideo = await prisma.conditionVideo.create({
        data: {
          workOrderId,
          filePath: `/uploads/videos/${finalSuffix}.mp4`,
          thumbnailPath: `/uploads/video-thumbnails/${finalSuffix}.webp`,
          originalFileName: file.name,
          durationSeconds: metadata.durationSeconds,
          sizeBytes,
          codec: metadata.codec,
          width: metadata.width,
          height: metadata.height,
          sha256: videoSha256,
          thumbnailSha256,
        }
      });

      // Write System Note
      const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
      await prisma.note.create({
        data: {
          workOrderId,
          text: `[RENDSZER] Átvételi állapot videó hozzáadva: ${file.name} (Méret: ${sizeMB} MB, Időtartam: ${metadata.durationSeconds || '?'} mp, Felbontás: ${metadata.width || '?'}x${metadata.height || '?'})`
        }
      });

      // Write ActivityLog
      await prisma.activityLog.create({
        data: {
          type: 'SYSTEM',
          message: `Átvételi állapot videó feltöltve a(z) #${workOrderId.slice(-6).toUpperCase()} munkalaphoz. (Média ID: ${conditionVideo.id})`,
          entityId: workOrderId
        }
      });

      // Trigger realtime update
      await publishUpdate(`order-${workOrderId}`);
      await publishUpdate('dashboard');

      return NextResponse.json({ success: true, video: conditionVideo });

    } finally {
      // Clean up temp raw upload file
      if (existsSync(tempRawPath)) {
        await unlink(tempRawPath).catch((err) => {
          console.error('Failed to delete temp video file:', err);
        });
      }
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error('Condition video upload error:', error);
    return NextResponse.json({ error: 'Nem sikerült feldolgozni a videót: ' + (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
