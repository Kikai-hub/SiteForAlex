import { describe, it, expect } from "vitest";
import { safeRedirectPath } from "@/lib/safe-redirect";

describe("safeRedirectPath", () => {
  it("allows a plain relative path", () => {
    expect(safeRedirectPath("/account/orders", "/")).toBe("/account/orders");
  });

  it("falls back when target is null", () => {
    expect(safeRedirectPath(null, "/login")).toBe("/login");
  });

  it("falls back when target doesn't start with /", () => {
    expect(safeRedirectPath("account", "/login")).toBe("/login");
  });

  it("blocks an absolute external URL", () => {
    expect(safeRedirectPath("https://evil.example", "/login")).toBe("/login");
  });

  it("blocks a protocol-relative external URL", () => {
    expect(safeRedirectPath("//evil.example", "/login")).toBe("/login");
  });

  it("blocks a scheme-relative payload that starts with a single /", () => {
    // A naive `startsWith("//")` check misses this — the WHATWG URL parser
    // normalizes it to the same cross-origin target a browser would follow.
    expect(safeRedirectPath("/\\evil.example", "/login")).toBe("/login");
  });

  it("blocks a target with an embedded control character used to smuggle a scheme", () => {
    expect(safeRedirectPath("/\t/evil.example", "/login")).toBe("/login");
  });
});
