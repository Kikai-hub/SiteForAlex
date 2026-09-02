import { defineConfig, devices } from "@playwright/test";

/**
 * Runs against an already-running stack (see DEPLOY.md / docker-compose.yml)
 * rather than starting its own dev server — these are smoke tests for a real
 * deployment (local Docker stack or a staging host), not component tests.
 * Point BASE_URL at whatever's actually up before running `npm run test:e2e`.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
