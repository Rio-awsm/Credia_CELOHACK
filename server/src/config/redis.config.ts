import { QueueOptions } from 'bull';

// Parse Upstash Redis URL if provided
export function parseRedisUrl(url?: string) {
  if (!url) {
    console.warn('⚠️  REDIS_URL not provided, using local Redis');
    return null;
  }

  try {
    const parsed = new URL(url);
    return {
      redis: {
        host: parsed.hostname,
        port: parseInt(parsed.port) || 6379,
        password: parsed.password,
        username: parsed.username || 'default',
        tls: parsed.protocol === 'rediss:' ? {
          rejectUnauthorized: false, // For Upstash
        } : undefined,
        enableOfflineQueue: true, // Changed to true
        maxRetriesPerRequest: null, // Important for Bull
        connectTimeout: 10000,
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        reconnectOnError(err) {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            return true;
          }
          return false;
        },
      },
    };
  } catch (error) {
    console.error('❌ Failed to parse Redis URL:', error);
    return null;
  }
}

// Use REDIS_URL from environment or fall back to local (for development)
const REDIS_URL = "rediss://default:AVftAAIncDIyMjNiZDFmNDQ1ZjI0YmQ3YTllZDUwZmQ5YTE4ZWZlNXAyMjI1MDk@dear-rattler-22509.upstash.io:6379";

const parsedConfig = parseRedisUrl(REDIS_URL);

export const redisConfig = parsedConfig || {
  redis: {
    host: process.env.REDIS_HOST || 'dear-rattler-22509.upstash.io',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    enableOfflineQueue: true,
    maxRetriesPerRequest: null, // Important for Bull
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  },
};

// Queue options with retry and timeout
export const queueOptions: QueueOptions = {
  redis: redisConfig.redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    timeout: 30000,
    removeOnComplete: 100,
    removeOnFail: 500,
  },
};

// Connection test helper
export async function testRedisConnection() {
  const Redis = require('ioredis');
  const client = new Redis(redisConfig.redis);

  return new Promise((resolve, reject) => {
    client.on('connect', () => {
      console.log('✅ Redis connected successfully');
      client.quit();
      resolve(true);
    });

    client.on('error', (err: Error) => {
      console.error('❌ Redis connection error:', err.message);
      client.quit();
      reject(err);
    });

    setTimeout(() => {
      client.quit();
      reject(new Error('Redis connection timeout'));
    }, 10000);
  });
}