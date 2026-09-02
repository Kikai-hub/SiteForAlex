import { test, expect } from "@playwright/test";

test("homepage loads with hero and category teasers", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Смотреть меню" })).toBeVisible();
});

test("menu page lists dishes with prices", async ({ page }) => {
  const res = await page.goto("/menu");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Меню" })).toBeVisible();
  // At least one dish card with an "add to cart" affordance should render —
  // covers the getMenuCategories cache path actually returning real data.
  await expect(page.getByText("В корзину").first()).toBeVisible();
});

test("dish detail page renders from a menu link", async ({ page }) => {
  await page.goto("/menu");
  const firstDishLink = page.locator('a[href^="/dish/"]').first();
  const href = await firstDishLink.getAttribute("href");
  await firstDishLink.click();
  await expect(page).toHaveURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("privacy policy page is reachable from the footer", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Политика конфиденциальности" }).click();
  await expect(page).toHaveURL(/\/privacy/);
  await expect(page.getByRole("heading", { level: 1, name: /персональных данных/i })).toBeVisible();
});

test("health endpoint reports ok", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe("ok");
});
