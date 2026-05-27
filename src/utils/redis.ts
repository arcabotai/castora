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

function logRedisError(error: unknown) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('Redis unavailable; continuing without cache:', error instanceof Error ? error.message : error);
  }
}

function getRedisClient(): Redis | null {
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 1000,
    });

    redisClient.on('error', logRedisError);
  }

  return redisClient;
}

async function withRedis<T>(operation: (client: Redis) => Promise<T>, fallback: T): Promise<T> {
  const client = getRedisClient();

  if (!client) {
    return fallback;
  }

  try {
    return await operation(client);
  } catch (error) {
    logRedisError(error);
    return fallback;
  }
}

export function getRedis(): RedisLike {
  const client = getRedisClient();

  if (!client) {
    return noopRedis;
  }

  return {
    get(key: string) {
      return withRedis((redis) => redis.get(key), null);
    },
    setex(key: string, seconds: number, value: string) {
      return withRedis((redis) => redis.setex(key, seconds, value), null);
    },
    del(...keys: string[]) {
      return withRedis((redis) => redis.del(...keys), null);
    },
  };
}

export const redis = getRedis();
