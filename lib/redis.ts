import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createClient() {
  return new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    // Keep retrying instead of hanging indefinitely — callers (lib/rateLimit.ts,
    // cache-handler.js) each decide how to degrade if a command still fails.
    maxRetriesPerRequest: 2,
  });
}

export const redis = globalForRedis.redis ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
