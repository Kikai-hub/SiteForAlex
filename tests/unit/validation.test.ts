import { describe, it, expect } from "vitest";
import { customerRegisterSchema } from "@/lib/validation/auth";
import { personalDataConsentSchema } from "@/lib/validation/consent";
import { createOrderSchema } from "@/lib/validation/order";

describe("personalDataConsentSchema", () => {
  it("accepts true", () => {
    expect(personalDataConsentSchema.safeParse(true).success).toBe(true);
  });

  it("rejects false", () => {
    expect(personalDataConsentSchema.safeParse(false).success).toBe(false);
  });

  it("rejects missing/undefined", () => {
    expect(personalDataConsentSchema.safeParse(undefined).success).toBe(false);
  });
});

describe("customerRegisterSchema", () => {
  const base = {
    phone: "+79991234567",
    password: "password123",
    name: "Иван",
  };

  it("accepts a valid registration with consent", () => {
    const result = customerRegisterSchema.safeParse({ ...base, personalDataConsent: true });
    expect(result.success).toBe(true);
  });

  it("rejects registration without personal data consent", () => {
    const result = customerRegisterSchema.safeParse({ ...base, personalDataConsent: false });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 6 characters", () => {
    const result = customerRegisterSchema.safeParse({
      ...base,
      password: "12345",
      personalDataConsent: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid phone number", () => {
    const result = customerRegisterSchema.safeParse({
      ...base,
      phone: "not-a-phone",
      personalDataConsent: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("createOrderSchema", () => {
  const validOrder = {
    items: [{ dishVariantId: "variant-1", quantity: 1, extras: [] }],
    fulfillmentType: "PICKUP" as const,
    paymentMethod: "CASH" as const,
    guestName: "Иван",
    guestPhone: "+79991234567",
    personalDataConsent: true,
  };

  it("accepts a valid pickup/cash order with consent", () => {
    expect(createOrderSchema.safeParse(validOrder).success).toBe(true);
  });

  it("rejects an order without personal data consent", () => {
    const result = createOrderSchema.safeParse({ ...validOrder, personalDataConsent: false });
    expect(result.success).toBe(false);
  });

  it("rejects an order with an empty cart", () => {
    const result = createOrderSchema.safeParse({ ...validOrder, items: [] });
    expect(result.success).toBe(false);
  });

  it("rejects a missing guest name", () => {
    const result = createOrderSchema.safeParse({ ...validOrder, guestName: "" });
    expect(result.success).toBe(false);
  });
});
