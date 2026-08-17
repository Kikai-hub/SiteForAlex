# Adana Pizza — production image.
#
# better-sqlite3 is a native addon, so it's compiled once in `deps` (the only
# stage with build tools) and its already-built node_modules is reused by both
# later stages — nothing gets recompiled, and the runtime image never needs a
# C/C++ toolchain installed.

FROM node:24-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
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
# the image only carries what `next start` needs at runtime.
FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

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

# Bind mounts (see docker-compose.yml) land here as root-owned directories —
# pre-create them so the app user can actually write to them.
RUN mkdir -p /app/data /app/public/uploads/dishes \
    && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000

CMD ["npm", "start"]
