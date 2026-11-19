import { NextRequest } from 'next/server';
import Redis from 'ioredis';

export const dynamic = 'force-dynamic';

type MessageListener = (message: string) => void;

const globalForSse = globalThis as unknown as {
  sseSubscriber?: Redis;
  sseListeners?: Set<MessageListener>;
};

function getListeners(): Set<MessageListener> {
  if (!globalForSse.sseListeners) {
    globalForSse.sseListeners = new Set();
  }
  return globalForSse.sseListeners;
}

function ensureSharedSubscriber() {
  if (globalForSse.sseSubscriber) {
    return globalForSse.sseSubscriber;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const sub = new Redis(redisUrl, {
    retryStrategy: (times) => Math.min(times * 500, 5000),
  });

  sub.on('error', (err) => {
    console.warn('SSE: Shared Redis subscriber error:', err.message);
  });

  sub.subscribe('updates', (err) => {
    if (err) {
      console.error('SSE: Failed to subscribe to Redis updates:', err);
    } else {
      console.log('SSE: Shared subscriber listening on Redis updates channel');
    }
  });

  sub.on('message', (channel: string, message: string) => {
    if (channel !== 'updates') return;
    for (const listener of getListeners()) {
      listener(message);
    }
  });

  globalForSse.sseSubscriber = sub;
  return sub;
}

export async function GET(req: NextRequest) {
  ensureSharedSubscriber();

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();
  const listeners = getListeners();

  let closed = false;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const cleanup = () => {
    if (closed) return;
    closed = true;
    if (heartbeat) {
      clearInterval(heartbeat);
      heartbeat = null;
    }
    listeners.delete(onMessage);
    writer.close().catch(() => {});
  };

  const onMessage: MessageListener = (message: string) => {
    if (closed) return;
    writer.write(encoder.encode(`data: ${message}\n\n`)).catch(() => {
      cleanup();
    });
  };

  listeners.add(onMessage);

  heartbeat = setInterval(() => {
    if (closed) return;
    writer.write(encoder.encode(': heartbeat\n\n')).catch(() => {
      cleanup();
    });
  }, 15000);

  req.signal.addEventListener('abort', () => {
    cleanup();
  });

  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
    },
  });
}
