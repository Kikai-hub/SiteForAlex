#!/bin/sh
# Runs as root before the app starts. `uploads_data` is a named Docker volume
# mounted over /app/public/uploads — Docker only applies the image's ownership
# to it the first time an EMPTY volume is populated, so any volume created (or
# left) with the wrong owner (e.g. by an older image, or a container that ran
# as root) silently stays root-owned forever, even after `Dockerfile` is fixed
# to chown it at build time. Fixing it here, on every start, makes it
# self-healing instead of a one-off manual chown on the server.
set -e

if [ "$(id -u)" = "0" ]; then
  mkdir -p /app/public/uploads/dishes /app/public/uploads/hero-slides
  chown -R nextjs:nodejs /app/public/uploads
  exec gosu nextjs "$@"
fi

exec "$@"
