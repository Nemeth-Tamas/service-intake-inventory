import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Singleton for Redis connection
const globalForRedis = global as unknown as { redis: Redis };
export const redis = globalForRedis.redis || new Redis(redisUrl);
if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

export async function publishUpdate(event: string, payload: any = {}) {
  try {
    await redis.publish('updates', JSON.stringify({ event, payload }));
  } catch (e) {
    console.error('Redis publish error:', e);
  }
}
