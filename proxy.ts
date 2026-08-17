import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";
import { isRateLimited } from "@/lib/rateLimit";

const LOGIN_PATHS = new Set([
  "/api/auth/admin/login",
  "/api/auth/courier/login",
  "/api/auth/customer/login",
]);

// X-Forwarded-For is entirely attacker-controlled unless something in front
// of this app is trusted to set it — set to the number of reverse proxy hops
// in front of the app (docker-compose sets this to 1 for the Caddy setup in
// Caddyfile, which also strips any client-sent value before appending its
// own). Left at 0 (direct exposure, no proxy), the header is never trusted.
const TRUSTED_PROXY_HOPS = Number(process.env.TRUSTED_PROXY_HOPS ?? "0");

function clientIp(request: NextRequest): string {
  if (TRUSTED_PROXY_HOPS > 0) {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
      const hops = forwarded.split(",").map((h) => h.trim());
      // The trusted proxy nearest to us appends last, so the value it added
      // sits `TRUSTED_PROXY_HOPS` from the right — everything to the left of
      // that is whatever the client (or an untrusted intermediary) claimed.
      const value = hops[hops.length - TRUSTED_PROXY_HOPS];
      if (value) return value;
    }
  }
  return "unknown";
}

function tooManyRequests() {
  return NextResponse.json(
    { error: "Слишком много запросов — попробуйте позже" },
    { status: 429 }
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = clientIp(request);

  // Brute-force protection: password guessing against admin/courier/customer
  // login has no other defense (no lockout, no CAPTCHA) — cap attempts per IP.
  if (request.method === "POST" && LOGIN_PATHS.has(pathname)) {
    if (isRateLimited(`login:${pathname}:${ip}`, 10, 5 * 60 * 1000)) {
      return tooManyRequests();
    }
  }
  if (request.method === "POST" && pathname === "/api/auth/customer/register") {
    if (isRateLimited(`register:${ip}`, 5, 60 * 60 * 1000)) {
      return tooManyRequests();
    }
  }

  // /api/address/* proxies to a paid, unauthenticated Yandex Geosuggest API —
  // without a cap here, anyone can run up the API bill or exhaust its quota.
  if (pathname === "/api/address/suggest" || pathname === "/api/address/resolve") {
    if (isRateLimited(`address:${ip}`, 60, 60 * 1000)) {
      return tooManyRequests();
    }
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get(SESSION_COOKIE.admin)?.value;
    const session = await verifySession(token, "admin");
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/account")) {
    const token = request.cookies.get(SESSION_COOKIE.customer)?.value;
    const session = await verifySession(token, "customer");
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/courier") && pathname !== "/courier/login") {
    const token = request.cookies.get(SESSION_COOKIE.courier)?.value;
    const session = await verifySession(token, "courier");
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = "/courier/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/account/:path*",
    "/courier/:path*",
    "/api/auth/:path*",
    "/api/address/:path*",
  ],
};
