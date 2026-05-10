import { NextRequest } from 'next/server';
import Redis from 'ioredis';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  console.log('SSE: New connection request received');
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const sub = new Redis(redisUrl);

  const cleanup = () => {
    console.log('SSE: Cleaning up connection');
    sub.disconnect();
    try { writer.close(); } catch (e) {}
  };

  sub.subscribe('updates', (err: Error | null | undefined) => {
    if (err) {
      console.error('SSE: Redis subscribe error:', err);
      cleanup();
    } else {
      console.log('SSE: Subscribed to Redis updates');
    }
  });

  sub.on('message', (channel: string, message: string) => {
    if (channel === 'updates') {
      try {
        console.log('SSE: Sending message to client');
        writer.write(encoder.encode(`data: ${message}\n\n`));
      } catch (e) {
        console.error('SSE: Error writing to stream:', e);
        cleanup();
      }
    }
  });

  const heartbeat = setInterval(() => {
    try {
      writer.write(encoder.encode(': heartbeat\n\n'));
    } catch (e) {
      clearInterval(heartbeat);
      cleanup();
    }
  }, 15000);

  req.signal.addEventListener('abort', () => {
    console.log('SSE: Request aborted by client');
    clearInterval(heartbeat);
    cleanup();
  });

  console.log('SSE: Connection established and streaming');
  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
    },
  });
}
