interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * In-memory fixed-window limiter. State lives in process memory, which only
 * works because this app runs as a single persistent Node process (VPS/Docker
 * per README) — it would silently stop limiting anything if ever deployed
 * across multiple serverless instances.
 */
const buckets = new Map<string, Bucket>();

let callsSinceSweep = 0;

function sweep(now: number) {
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

/** Returns true if `key` has exceeded `limit` requests within the current `windowMs` window. */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  callsSinceSweep += 1;
  if (callsSinceSweep >= 500) {
    callsSinceSweep = 0;
    sweep(now);
  }

  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  bucket.count += 1;
  return bucket.count > limit;
}
