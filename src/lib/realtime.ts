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
  if (!client) {
    console.error('SSE: Cannot publish, Redis client not initialized.');
    return;
  }

  try {
    const message = JSON.stringify({ event, payload });
    console.log(`SSE: Publishing event "${event}" to Redis updates channel`);
    
    // Only attempt to publish if the client thinks it's connected
    // Use the raw client if ready, or try to connect
    await client.publish('updates', message);
    console.log('SSE: Successfully published to Redis');
  } catch (e) {
    console.error('SSE: Redis publish error:', e);
  }
}
