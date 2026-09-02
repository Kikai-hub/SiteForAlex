import { test, expect } from "@playwright/test";
import { randomRuPhoneDigits } from "./helpers";

test("customer can register, is redirected to their account, and can log back in after logging out", async ({
  page,
}) => {
  const phoneDigits = randomRuPhoneDigits();
  const password = "e2e-test-password";

  await page.goto("/register");
  await page.locator("#name").fill("E2E Customer");
  await page.locator("#phone").fill(phoneDigits);
  await page.locator("#password").fill(password);
  await page.getByLabel(/персональных данных/).check();
  await page.getByRole("button", { name: "Зарегистрироваться" }).click();

  await expect(page).toHaveURL(/\/account/);

  await page.getByRole("button", { name: "Выйти" }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/login");
  await page.locator("#phone").fill(phoneDigits);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/account/);
});

test("registration is blocked without personal data consent", async ({ page }) => {
  await page.goto("/register");
  await page.locator("#name").fill("No Consent");
  await page.locator("#phone").fill(randomRuPhoneDigits());
  await page.locator("#password").fill("e2e-test-password");
  // Consent checkbox intentionally left unchecked.
  await page.getByRole("button", { name: "Зарегистрироваться" }).click();

  await expect(page).not.toHaveURL(/\/account/);
});

test("admin login is rate-limited after repeated failed attempts", async ({ request }) => {
  const attempts = 15;
  const results: number[] = [];

  for (let i = 0; i < attempts; i++) {
    const res = await request.post("/api/auth/admin/login", {
      data: { username: "e2e-nonexistent-admin", password: "wrong-password" },
    });
    results.push(res.status());
  }

  // The exact attempt number that flips to 429 depends on whatever quota this
  // IP has already used in the current window (see lib/rateLimit.ts) — what
  // matters is that the limiter engages at all instead of allowing unlimited
  // guesses against a login endpoint.
  expect(results).toContain(429);
});
