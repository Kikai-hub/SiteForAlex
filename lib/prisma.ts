import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Total connections this app is allowed to hold against Postgres, split
// evenly across every PM2 worker (see ecosystem.config.js, which sets
// WEB_CONCURRENCY to the actual resolved worker count — not PM2's own "max").
// Keeping the *total* fixed regardless of core count is what stops
// (workers × pool size) from exceeding Postgres's max_connections (raised to
// 200 in docker-compose.yml — 150 leaves headroom for the migrate service,
// psql, etc). Override DATABASE_POOL_SIZE directly to skip this math.
const DATABASE_CONNECTION_BUDGET = 150;

function resolvePoolSize(): number {
  if (process.env.DATABASE_POOL_SIZE) return Number(process.env.DATABASE_POOL_SIZE);
  const workers = Number(process.env.WEB_CONCURRENCY) || 1;
  return Math.max(2, Math.floor(DATABASE_CONNECTION_BUDGET / workers));
}

function createClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: resolvePoolSize(),
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
