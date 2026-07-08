import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const filePath = path.join('/');
  
  // Security: only allow access to specific folders
  if (!filePath.startsWith('uploads/') && !filePath.startsWith('archives/')) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const fullPath = join(process.cwd(), 'public', filePath);

  if (!existsSync(fullPath)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  try {
    const fileStat = await stat(fullPath);
    const fileSize = fileStat.size;
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    let contentType = 'application/octet-stream';
    if (extension === 'jpg' || extension === 'jpeg') contentType = 'image/jpeg';
    else if (extension === 'png') contentType = 'image/png';
    else if (extension === 'webp') contentType = 'image/webp';
    else if (extension === 'pdf') contentType = 'application/pdf';
    else if (extension === 'mp4') contentType = 'video/mp4';
    else if (extension === 'webm') contentType = 'video/webm';

    const searchParams = request.nextUrl.searchParams;
    const download = searchParams.get('download') === 'true';
    const range = request.headers.get('range');

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'no-store, must-revalidate',
      'Accept-Ranges': 'bytes',
    };

    if (download) {
      const fileName = filePath.split('/').pop() || 'download';
      headers['Content-Disposition'] = `attachment; filename="${encodeURIComponent(fileName)}"`;
    }

    if (range && (extension === 'mp4' || extension === 'webm')) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        return new NextResponse('Requested Range Not Satisfiable', {
          status: 416,
          headers: {
            'Content-Range': `bytes */${fileSize}`,
          },
        });
      }

      const chunksize = (end - start) + 1;
      const fileBuffer = await readFile(fullPath);
      const slicedBuffer = fileBuffer.subarray(start, end + 1);

      headers['Content-Range'] = `bytes ${start}-${end}/${fileSize}`;
      headers['Content-Length'] = String(chunksize);

      return new NextResponse(slicedBuffer, {
        status: 206,
        headers,
      });
    }

    const fileBuffer = await readFile(fullPath);
    headers['Content-Length'] = String(fileSize);
    return new NextResponse(fileBuffer, { headers });
  } catch (error) {
    console.error('Media serving error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
