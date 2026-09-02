import { describe, it, expect } from "vitest";
import { toMinor, formatMinor } from "@/lib/money";

describe("toMinor", () => {
  it("converts rubles to kopecks", () => {
    expect(toMinor(469)).toBe(46900);
    expect(toMinor(469.5)).toBe(46950);
  });

  it("rounds to avoid float rounding artifacts", () => {
    // 0.1 + 0.2 style float drift must not leak into stored prices
    expect(toMinor(19.99)).toBe(1999);
  });
});

describe("formatMinor", () => {
  it("formats a whole-ruble amount with no decimals", () => {
    expect(formatMinor(46900)).toBe("469 ₽");
  });

  it("formats a fractional-ruble amount with two decimals", () => {
    expect(formatMinor(46950)).toBe("469,50 ₽");
  });

  it("formats zero", () => {
    expect(formatMinor(0)).toBe("0 ₽");
  });
});
