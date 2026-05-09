import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const pathParts = await params;
  const filePath = pathParts.path.join('/');
  
  // Security: only allow access to specific folders
  if (!filePath.startsWith('uploads/') && !filePath.startsWith('archives/')) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const fullPath = join(process.cwd(), 'public', filePath);

  if (!existsSync(fullPath)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  try {
    const fileBuffer = await readFile(fullPath);
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    let contentType = 'application/octet-stream';
    if (extension === 'jpg' || extension === 'jpeg') contentType = 'image/jpeg';
    else if (extension === 'png') contentType = 'image/png';
    else if (extension === 'pdf') contentType = 'application/pdf';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store, must-revalidate', // Force fresh data
      },
    });
  } catch (error) {
    console.error('Media serving error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
