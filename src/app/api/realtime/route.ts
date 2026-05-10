import { NextRequest } from 'next/server';
import { redis } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Create a listener on the Redis 'updates' channel
  // We need a fresh connection for every stream
  const Redis = require('ioredis');
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const sub = new Redis(redisUrl);

  const cleanup = () => {
    sub.disconnect();
    try { writer.close(); } catch (e) {}
  };

  sub.subscribe('updates', (err) => {
    if (err) {
      console.error('SSE Redis subscribe error:', err);
      cleanup();
    }
  });

  sub.on('message', (channel, message) => {
    if (channel === 'updates') {
      try {
        writer.write(encoder.encode(`data: ${message}\n\n`));
      } catch (e) {
        cleanup();
      }
    }
  });

  // Keep-alive heartbeats every 15 seconds to prevent proxy timeouts
  const heartbeat = setInterval(() => {
    try {
      writer.write(encoder.encode(': heartbeat\n\n'));
    } catch (e) {
      clearInterval(heartbeat);
      cleanup();
    }
  }, 15000);

  req.signal.addEventListener('abort', () => {
    clearInterval(heartbeat);
    cleanup();
  });

  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
