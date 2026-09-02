import { redis } from "@/lib/redis";

/**
 * Fixed-window limiter backed by Redis (not process memory) so the limit is
 * shared across all PM2 cluster workers instead of being multiplied by
 * however many of them are running. INCR + PEXPIRE is the standard Redis
 * rate-limit idiom — not perfectly atomic across the two commands, but the
 * only failure mode is a key that outlives its window after a crash between
 * them, which is harmless for a security control like this one.
 *
 * Fails open (not limited) if Redis itself is unreachable: this guards login
 * brute-forcing and a paid third-party API quota, and an outage taking down
 * login/registration entirely would be worse than briefly losing that guard.
 */
export async function isRateLimited(key: string, limit: number, windowMs: number): Promise<boolean> {
  const redisKey = `ratelimit:${key}`;
  try {
    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.pexpire(redisKey, windowMs);
    }
    return count > limit;
  } catch (err) {
    console.error("[rateLimit] Redis unavailable, allowing request through:", err);
    return false;
  }
}
