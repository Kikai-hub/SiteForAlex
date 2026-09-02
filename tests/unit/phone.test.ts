import { describe, it, expect } from "vitest";
import { normalizePhone, formatPhoneForDisplay, maskPhoneInput } from "@/lib/phone";

describe("normalizePhone", () => {
  it("normalizes an 11-digit number starting with 8", () => {
    expect(normalizePhone("8 993 259-01-43")).toBe("+79932590143");
  });

  it("normalizes an 11-digit number starting with 7", () => {
    expect(normalizePhone("+7(993)2590143")).toBe("+79932590143");
  });

  it("normalizes a bare 10-digit national number", () => {
    expect(normalizePhone("9932590143")).toBe("+79932590143");
  });

  it("rejects too few digits", () => {
    expect(normalizePhone("12345")).toBeNull();
  });

  it("rejects too many digits", () => {
    expect(normalizePhone("+7999123456789")).toBeNull();
  });

  it("rejects non-Russian country codes (11 digits not starting 7/8)", () => {
    expect(normalizePhone("12345678901")).toBeNull();
  });

  it("rejects empty input", () => {
    expect(normalizePhone("")).toBeNull();
  });
});

describe("formatPhoneForDisplay", () => {
  it("formats a normalized number for display", () => {
    expect(formatPhoneForDisplay("+79932590143")).toBe("+7 (993) 259-01-43");
  });

  it("returns the input unchanged if it doesn't match the expected shape", () => {
    expect(formatPhoneForDisplay("not-a-phone")).toBe("not-a-phone");
  });
});

describe("maskPhoneInput", () => {
  it("returns empty string for empty input", () => {
    expect(maskPhoneInput("")).toBe("");
  });

  it("strips a leading 7 or 8 as the country code, not a local digit", () => {
    expect(maskPhoneInput("89991234567")).toBe(maskPhoneInput("79991234567"));
  });

  it("progressively masks digits as they're typed", () => {
    expect(maskPhoneInput("999")).toBe("+7 (999)");
    expect(maskPhoneInput("9991")).toBe("+7 (999) 1");
    expect(maskPhoneInput("99912345")).toBe("+7 (999) 123-45");
    expect(maskPhoneInput("9991234567")).toBe("+7 (999) 123-45-67");
  });

  it("ignores digits beyond the 10th", () => {
    expect(maskPhoneInput("99912345670000")).toBe(maskPhoneInput("9991234567"));
  });
});
