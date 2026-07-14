import Redis from 'ioredis';

let client;

export function getRedis() {
  if (!client) {
    client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      maxRetriesPerRequest: null,
      retryStrategy: (times) => Math.min(times * 200, 3000),
    });
    client.on('connect', () => console.log('[redis] connected'));
    client.on('error', (err) => console.error('[redis] error', err.message));
  }
  return client;
}

export const TASK_QUEUE_KEY = 'ai_tasks:queue';
