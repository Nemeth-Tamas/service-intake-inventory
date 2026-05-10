import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Singleton for Redis connection
const globalForRedis = global as unknown as { redis: Redis | null };

let hasLoggedError = false;

function getRedis() {
  if (globalForRedis.redis) return globalForRedis.redis;
  
  try {
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 200, 1000);
      },
    });

    client.on('error', (err) => {
      if (!hasLoggedError) {
        console.warn('Redis is unavailable, real-time features disabled.');
        hasLoggedError = true;
      }
    });

    globalForRedis.redis = client;
    return client;
  } catch (e) {
    return null;
  }
}

export const redis = getRedis();

export async function publishUpdate(event: string, payload: any = {}) {
  const client = getRedis();
  if (!client) return;

  try {
    // Only attempt to publish if the client thinks it's connected
    if (client.status === 'ready') {
      await client.publish('updates', JSON.stringify({ event, payload }));
    }
  } catch (e) {
    // Fail silently, app should remain functional
  }
}
