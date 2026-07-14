import { getRedis, TASK_QUEUE_KEY } from '../config/redis.js';

// Simple, dependency-light queue: RPUSH task ids, worker BLPOPs them.
// This keeps the contract between Node and the Python worker to one shared
// primitive (a Redis list) instead of a framework-specific job format.
export async function enqueueTask(taskId) {
  const redis = getRedis();
  await redis.rpush(TASK_QUEUE_KEY, String(taskId));
}
