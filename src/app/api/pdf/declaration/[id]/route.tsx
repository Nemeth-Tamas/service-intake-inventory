import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { DeclarationDocument } from '@/lib/pdfTemplates';
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
    });

    if (!workOrder) {
      return new NextResponse('Munkalap nem található', { status: 404 });
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

    const settingsForPdf = {
      ...settings,
      logoPath: logoBase64,
    };

    const buffer = await renderToBuffer(
      <DeclarationDocument workOrder={workOrder} settings={settingsForPdf} />
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="nyilatkozat-${workOrder.id.slice(-6).toUpperCase()}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Declaration PDF generation error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
