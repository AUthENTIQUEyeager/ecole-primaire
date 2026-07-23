import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

/**
 * Cache-aside helper for expensive aggregations (financial totals, stats).
 * Used sparingly to stay within the Upstash free-tier command budget.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>
): Promise<T> {
  const hit = await redis.get<T>(key)
  if (hit !== null && hit !== undefined) return hit
  const value = await compute()
  await redis.set(key, value, { ex: ttlSeconds })
  return value
}

export async function invalidate(...keys: string[]) {
  if (keys.length) await redis.del(...keys)
}
