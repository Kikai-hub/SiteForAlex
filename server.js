// Minimal custom server (see Next.js docs: guides/custom-server) used only so
// PM2 cluster mode has a plain Node entry point to fork. Going through the
// `next start` CLI binary directly under `pm2-runtime ... --exec-mode cluster`
// mis-parses argv on every worker ("No such directory exists as the project
// root: <path to ecosystem.config.js>") — this sidesteps that by calling the
// same programmatic API `next start` itself uses under the hood.
const { createServer } = require("node:http");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(port, () => {
    console.log(`> Server listening on port ${port} (pid ${process.pid})`);
  });
});
