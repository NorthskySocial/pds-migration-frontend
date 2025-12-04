/* Redis utility functions for getting/setting/deleting keys with TTL support.
 * Note that this is only supported on Kubernetes for now!
 */

import Redis from "ioredis";

const _client: Redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
  });;

export async function redisGet(key: string): Promise<string | null> {
  return await _client.get(key);
}

export async function redisSet(
  key: string,
  ttlSeconds: number,
  value: string
): Promise<void> {
  await _client.set(key, value, "EX", ttlSeconds);
}

export async function redisDel(key: string): Promise<void> {
  await _client.del(key);
}
