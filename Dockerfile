# Adana Pizza — production image.
#
# Postgres (pg) and Redis (ioredis) drivers are both pure JS, so this image
# never needs a C/C++ toolchain — unlike the SQLite setup this replaced.

FROM node:22-bookworm-slim AS deps
WORKDIR /app
# Prisma's engine needs libssl at runtime — without it, it silently guesses
# an OpenSSL version instead of detecting the real one.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

# `builder` keeps full node_modules (incl. devDependencies) — needed to run
# `next build` and, later, to run `prisma migrate deploy`/seed via the
# "migrate" compose service, which reuses this stage directly.
FROM deps AS builder
WORKDIR /app
COPY . .
RUN npx prisma generate
RUN npm run build

# `runner` is what actually serves traffic — devDependencies are pruned so
# the image only carries what PM2 (running server.js in cluster mode, see
# ecosystem.config.js) needs at runtime.
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# PM2 writes its runtime state (pid files, logs) under $PM2_HOME — the
# `nextjs` user below is a --system account with no home directory, so this
# points PM2 at a directory we create and own explicitly instead.
ENV PM2_HOME=/app/.pm2

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
RUN npm prune --omit=dev

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/app/generated ./app/generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/ecosystem.config.js ./ecosystem.config.js
COPY --from=builder /app/cache-handler.js ./cache-handler.js
COPY --from=builder /app/server.js ./server.js

# Bind mounts (see docker-compose.yml) land here as root-owned directories —
# pre-create them so the app user can actually write to them.
RUN mkdir -p /app/public/uploads/dishes "$PM2_HOME" \
    && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000

# pm2-runtime (not `pm2 start`) keeps PM2 in the foreground as PID 1 and
# forwards container signals correctly — `pm2 start` daemonizes and would
# leave `docker stop` with nothing in the foreground to signal.
CMD ["npx", "pm2-runtime", "ecosystem.config.js"]
