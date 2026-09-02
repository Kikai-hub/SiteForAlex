import { test, expect } from "@playwright/test";
import { randomRuPhoneDigits, addFirstDishToCart } from "./helpers";

test("add to cart from the menu updates the cart badge and cart page", async ({ page }) => {
  await addFirstDishToCart(page);

  const cartLink = page.getByRole("link", { name: "Корзина" });
  await expect(cartLink).toContainText("1");

  await cartLink.click();
  await expect(page).toHaveURL(/\/cart/);
  await expect(page.getByText("Оформить заказ")).toBeVisible();
});

test("guest can complete a pickup/cash order end to end", async ({ page }) => {
  await addFirstDishToCart(page);
  await page.goto("/checkout");

  // Pickup avoids needing the address-autocomplete flow, which depends on
  // an external API key not guaranteed to be configured in every environment.
  await page.getByRole("button", { name: "Самовывоз" }).click();
  await page.getByRole("button", { name: "Наличными" }).click();

  await page.locator("#name").fill("Playwright Test");
  await page.locator("#phone").fill(randomRuPhoneDigits());
  await page.getByLabel(/персональных данных/).check();

  await page.getByRole("button", { name: "Подтвердить заказ" }).click();

  await expect(page).toHaveURL(/\/checkout\/success\//, { timeout: 15000 });
  await expect(page.getByRole("heading", { name: /заказ.*(оформлен|принят)/i })).toBeVisible();
});

test("checkout is blocked without personal data consent", async ({ page }) => {
  await addFirstDishToCart(page);
  await page.goto("/checkout");

  await page.getByRole("button", { name: "Самовывоз" }).click();
  await page.locator("#name").fill("No Consent");
  await page.locator("#phone").fill(randomRuPhoneDigits());
  // Consent checkbox intentionally left unchecked.

  await page.getByRole("button", { name: "Подтвердить заказ" }).click();

  // Native `required` on the checkbox blocks form submission client-side —
  // the URL must not advance to a success page.
  await expect(page).not.toHaveURL(/\/checkout\/success\//);
});
