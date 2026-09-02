import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createCourierSession } from "@/lib/auth/courier";
import { courierLoginSchema } from "@/lib/validation/auth";
import { isRateLimited } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = courierLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 }
    );
  }

  const { username, password } = parsed.data;

  // See app/api/auth/admin/login/route.ts — keyed on the account, not the
  // (spoofable) client IP that proxy.ts's limiter relies on.
  if (await isRateLimited(`login-id:courier:${username}`, 10, 5 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Слишком много попыток — попробуйте позже" },
      { status: 429 }
    );
  }

  const courier = await prisma.courier.findUnique({ where: { username } });
  if (!courier || !(await verifyPassword(password, courier.passwordHash))) {
    return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
  }

  await createCourierSession(courier.id);
  return NextResponse.json({ ok: true });
}
