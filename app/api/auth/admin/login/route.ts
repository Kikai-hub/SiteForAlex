import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createAdminSession } from "@/lib/auth/admin";
import { adminLoginSchema } from "@/lib/validation/auth";
import { isRateLimited } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 }
    );
  }

  const { username, password } = parsed.data;

  // proxy.ts also caps attempts per client IP, but that's only as trustworthy
  // as X-Forwarded-For — this second limiter is keyed on the account being
  // guessed instead, so brute-forcing one username stays capped no matter how
  // many source IPs (real or spoofed) the attempts come from.
  if (await isRateLimited(`login-id:admin:${username}`, 10, 5 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Слишком много попыток — попробуйте позже" },
      { status: 429 }
    );
  }

  const admin = await prisma.adminUser.findUnique({ where: { username } });
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
  }

  await createAdminSession(admin.id);
  return NextResponse.json({ ok: true });
}
