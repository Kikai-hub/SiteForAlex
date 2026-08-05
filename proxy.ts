import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  matcher: ["/admin/:path*", "/account/:path*", "/courier/:path*"],
};
