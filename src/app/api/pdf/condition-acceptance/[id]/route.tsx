import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { ConditionAcceptanceDocument } from '@/lib/pdfTemplates';
import { getSettings } from '@/lib/actions';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workOrderId = z.string().cuid().parse(id);

    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        photos: { orderBy: { createdAt: 'desc' } },
        conditionVideos: { orderBy: { createdAt: 'desc' } },
      }
    });

    if (!workOrder) {
      return new NextResponse('Munkalap nem található', { status: 404 });
    }

    if (!workOrder.conditionAcceptedAt) {
      return new NextResponse('Ez az állapotnyilatkozat még nincs aláírva az ügyfél által.', { status: 400 });
    }

    const settings = await getSettings();

    // Pre-process logo
    let logoBase64: string | null = null;
    if (settings.logoPath) {
      const logoDiskPath = path.join(process.cwd(), 'public', settings.logoPath);
      try {
        if (fs.existsSync(logoDiskPath)) {
          const extension = settings.logoPath.split('.').pop()?.toLowerCase();
          const buffer = fs.readFileSync(logoDiskPath);
          if (extension === 'webp') {
            const pngBuffer = await sharp(logoDiskPath).png().toBuffer();
            logoBase64 = `data:image/png;base64,${pngBuffer.toString('base64')}`;
          } else {
            const mimeType = extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : 'image/png';
            logoBase64 = `data:${mimeType};base64,${buffer.toString('base64')}`;
          }
        }
      } catch (err) {
        console.error('Failed to load logo for PDF:', err);
      }
    }

    // Determine which media to use (must prefer snapshot for historical accuracy)
    let snapshotMedia: { videos: any[]; photos: any[] } | null = null;
    if (workOrder.conditionAcceptanceMediaSnapshot) {
      try {
        snapshotMedia = JSON.parse(workOrder.conditionAcceptanceMediaSnapshot);
      } catch (e) {
        console.error('Failed to parse media snapshot:', e);
      }
    }

    const photosToProcess = snapshotMedia ? snapshotMedia.photos : workOrder.photos;
    const videosToProcess = snapshotMedia ? snapshotMedia.videos : workOrder.conditionVideos;

    // Pre-process photos (convert WebP to JPEG on-the-fly)
    const photosWithBase64 = await Promise.all(
      photosToProcess.map(async (photo: any) => {
        const photoDiskPath = path.join(process.cwd(), 'public', photo.filePath);
        try {
          if (fs.existsSync(photoDiskPath)) {
            const buffer = await sharp(photoDiskPath).jpeg({ quality: 85 }).toBuffer();
            return {
              ...photo,
              base64Src: `data:image/jpeg;base64,${buffer.toString('base64')}`,
            };
          }
        } catch (err) {
          console.error(`Failed to convert WebP photo to JPEG for PDF: ${photo.filePath}`, err);
        }
        return { ...photo, base64Src: null };
      })
    );

    // Pre-process condition video thumbnails
    const videosWithBase64 = await Promise.all(
      videosToProcess.map(async (video: any) => {
        let base64Src: string | null = null;
        if (video.thumbnailPath) {
          const thumbDiskPath = path.join(process.cwd(), 'public', video.thumbnailPath);
          try {
            if (fs.existsSync(thumbDiskPath)) {
              const buffer = await sharp(thumbDiskPath).jpeg({ quality: 85 }).toBuffer();
              base64Src = `data:image/jpeg;base64,${buffer.toString('base64')}`;
            }
          } catch (err) {
            console.error(`Failed to convert WebP thumbnail to JPEG for PDF: ${video.thumbnailPath}`, err);
          }
        }
        return {
          ...video,
          thumbnailBase64: base64Src,
        };
      })
    );

    const workOrderForPdf = {
      ...workOrder,
      photos: photosWithBase64,
      conditionVideos: videosWithBase64,
    };

    const settingsForPdf = {
      ...settings,
      logoPath: logoBase64,
    };

    const buffer = await renderToBuffer(
      <ConditionAcceptanceDocument workOrder={workOrderForPdf} settings={settingsForPdf} />
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="allapot-nyilatkozat-${workOrder.id.slice(-6).toUpperCase()}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Condition Acceptance PDF generation error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
