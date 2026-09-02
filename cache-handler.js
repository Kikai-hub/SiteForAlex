// Custom Next.js cache handler (see next.config.ts's `cacheHandler` option).
//
// Why this exists: under PM2 cluster mode (see ecosystem.config.js) the app
// runs as several separate OS processes. Next's default cache handler keeps
// cache entries in memory + on disk *per process* — calling revalidateTag()
// in the worker that handles an admin edit does NOT tell the other workers,
// which keep serving stale menu/promo data until their own TTL expires (see
// https://nextjs.org/docs/app/guides/self-hosting#multi-instance-cache-coordination).
// Backing the handler with Redis, which every worker (and every server, if
// this ever runs on more than one host) reads and writes, makes an
// invalidation visible everywhere immediately, with no polling needed.
//
// Plain CommonJS, not TypeScript — Next.js loads cache handlers directly with
// `require()` outside its normal compiled-app pipeline, so this can't import
// lib/redis.ts (path aliases aren't resolved here) and keeps its own
// connection instead.

const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 2,
});

const KEY_PREFIX = "nextcache:entry:";
const TAG_PREFIX = "nextcache:tag:";
// Safety net so an entry whose tag is never revalidated (e.g. a cache key
// that stops being requested after a deploy) doesn't live in Redis forever.
const ENTRY_TTL_SECONDS = 60 * 60 * 24;

module.exports = class RedisCacheHandler {
  constructor(options) {
    this.options = options;
  }

  // Next does not wrap cache-handler calls in try/catch — an exception here
  // propagates straight into page rendering as a 500. Since this handler
  // backs every unstable_cache call on the site (home, menu, dish detail,
  // promo lookup — see lib/cache/menu.ts and lib/promo.ts), a Redis blip
  // must degrade to "treat as uncached" instead of taking the whole site
  // down with it.
  async get(key) {
    try {
      const raw = await redis.get(KEY_PREFIX + key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.error("[cache-handler] get failed, treating as cache miss:", err);
      return null;
    }
  }

  async set(key, data, ctx) {
    try {
      const tags = ctx?.tags ?? [];
      const entry = JSON.stringify({ value: data, lastModified: Date.now(), tags });

      const pipeline = redis.pipeline();
      pipeline.set(KEY_PREFIX + key, entry, "EX", ENTRY_TTL_SECONDS);
      for (const tag of tags) {
        pipeline.sadd(TAG_PREFIX + tag, key);
        pipeline.expire(TAG_PREFIX + tag, ENTRY_TTL_SECONDS);
      }
      await pipeline.exec();
    } catch (err) {
      // Not fatal: the next request just misses the cache again and
      // regenerates from Postgres instead of reusing this entry.
      console.error("[cache-handler] set failed, entry not cached:", err);
    }
  }

  async revalidateTag(tags) {
    try {
      const list = Array.isArray(tags) ? tags : [tags];
      for (const tag of list) {
        const keys = await redis.smembers(TAG_PREFIX + tag);
        if (keys.length > 0) {
          await redis.del(...keys.map((k) => KEY_PREFIX + k));
        }
        await redis.del(TAG_PREFIX + tag);
      }
    } catch (err) {
      // Not fatal: affected entries stay stale until their TTL instead of
      // being invalidated immediately.
      console.error("[cache-handler] revalidateTag failed:", err);
    }
  }

  resetRequestCache() {}
};
