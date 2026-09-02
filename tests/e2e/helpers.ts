import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/** A fresh-looking Russian mobile number per call, so registration tests
 *  never collide with each other or with real seeded data. */
export function randomRuPhoneDigits(): string {
  const rest = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join("");
  return `9${rest}`; // 10 digits total, e.g. "9123456789"
}

/** Goes to /menu and adds the first dish to the cart, confirming via the
 *  "Добавлено ✓" button that appears that the click actually landed —
 *  checked as a *separate* locator rather than re-reading the clicked
 *  button's own text. `getByRole(..., { name: "В корзину" }).first()` is a
 *  live query, re-evaluated on every access: the instant the clicked
 *  button's accessible name flips to "Добавлено ✓" it drops out of that
 *  match set, so `.first()` silently starts pointing at the *next*,
 *  never-clicked "В корзину" button — asserting on that stale reference
 *  always sees the pre-click text, forever. */
export async function addFirstDishToCart(page: Page) {
  await page.goto("/menu");
  await page.getByRole("button", { name: "В корзину" }).first().click();
  await expect(page.getByRole("button", { name: "Добавлено ✓" })).toBeVisible();
}
