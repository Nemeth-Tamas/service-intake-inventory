import { NextRequest, NextResponse } from 'next/server';
import { stat } from 'fs/promises';
import { createReadStream, existsSync } from 'fs';
import { resolve, sep } from 'path';
import { Readable } from 'stream';

const PUBLIC_DIR = resolve(process.cwd(), 'public');
const ALLOWED_ROOTS = [
  resolve(PUBLIC_DIR, 'uploads'),
  resolve(PUBLIC_DIR, 'archives'),
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const filePath = path.join('/');
  const fullPath = resolve(PUBLIC_DIR, filePath);

  // Security: strictly ensure resolved path stays inside public/uploads or public/archives
  const isAllowed = ALLOWED_ROOTS.some(
    (root) => fullPath.startsWith(root + sep)
  );
  if (!isAllowed) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  if (!existsSync(fullPath)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  try {
    const fileStat = await stat(fullPath);
    if (!fileStat.isFile()) {
      return new NextResponse('Forbidden', { status: 403 });
    }

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
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (
        isNaN(start) ||
        isNaN(end) ||
        start < 0 ||
        end < start ||
        start >= fileSize ||
        end >= fileSize
      ) {
        return new NextResponse('Requested Range Not Satisfiable', {
          status: 416,
          headers: {
            'Content-Range': `bytes */${fileSize}`,
          },
        });
      }

      const chunkSize = end - start + 1;
      const nodeStream = createReadStream(fullPath, { start, end });
      const webStream = Readable.toWeb(nodeStream) as ReadableStream;

      headers['Content-Range'] = `bytes ${start}-${end}/${fileSize}`;
      headers['Content-Length'] = String(chunkSize);

      return new NextResponse(webStream, {
        status: 206,
        headers,
      });
    }

    const nodeStream = createReadStream(fullPath);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;
    headers['Content-Length'] = String(fileSize);

    return new NextResponse(webStream, { headers });
  } catch (error) {
    console.error('Media serving error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
