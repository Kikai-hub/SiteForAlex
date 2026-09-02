// PM2 cluster config — spreads the app (server.js) across every CPU core
// instead of running it as a single Node process. Run with `pm2-runtime` in
// Docker (see Dockerfile) so PM2 stays in the foreground as PID 1 and
// forwards signals correctly for container start/stop; `pm2 start` would
// daemonize instead.
const os = require("node:os");

// Resolved here (not left as PM2's own "max") so the *same* number can be
// handed to every worker as WEB_CONCURRENCY — lib/prisma.ts divides its
// total Postgres connection budget by this to size each worker's pool, so
// (workers × pool size) stays under Postgres's max_connections no matter how
// many cores this specific host has. Override with a specific number (e.g.
// WEB_CONCURRENCY=2) on a host shared with other services.
const instances = process.env.WEB_CONCURRENCY ? Number(process.env.WEB_CONCURRENCY) : os.cpus().length;

module.exports = {
  apps: [
    {
      name: "adana-pizza",
      script: "server.js",
      instances,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        WEB_CONCURRENCY: String(instances),
      },
    },
  ],
};
