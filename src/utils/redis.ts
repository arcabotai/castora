import Redis from 'ioredis';

type RedisLike = {
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<unknown>;
  del(...keys: string[]): Promise<unknown>;
};

const noopRedis: RedisLike = {
  async get() {
    return null;
  },
  async setex() {
    return null;
  },
  async del() {
    return null;
  },
};

let redisClient: Redis | null = null;

export function getRedis(): RedisLike {
  if (!process.env.REDIS_URL) {
    return noopRedis;
  }

  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });

    redisClient.on('error', (error) => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Redis unavailable; continuing without cache:', error.message);
      }
    });
  }

  return redisClient;
}

export const redis = getRedis();
