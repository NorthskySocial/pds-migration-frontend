/* Redis utility functions for getting/setting/deleting keys with TTL support.
 * Note that this is only supported on Kubernetes for now!
 */

import Redis from "ioredis";

let _client: Redis | null = null;

export function getRedisClient(): Redis {
  if (_client) return _client;

  _client = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
  });

  return _client;
}

export async function redisGet(key: string): Promise<string | null> {
  const client = getRedisClient();

  try {
    return await client.get(key);
  } catch (err) {
    throw err;
  }
}

export async function redisSet(
  key: string,
  ttlSeconds: number,
  value: string
): Promise<void> {
  const client = getRedisClient();

  await client.set(key, value, "EX", ttlSeconds);
}

export async function redisDel(key: string): Promise<void> {
  const client = getRedisClient();

  await client.del(key);
}
