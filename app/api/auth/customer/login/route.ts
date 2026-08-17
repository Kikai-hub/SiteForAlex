import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createCustomerSession } from "@/lib/auth/customer";
import { customerLoginSchema } from "@/lib/validation/auth";
import { isRateLimited } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = customerLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 }
    );
  }

  const { phone, password } = parsed.data;

  // See app/api/auth/admin/login/route.ts — keyed on the account, not the
  // (spoofable) client IP that proxy.ts's limiter relies on.
  if (isRateLimited(`login-id:customer:${phone}`, 10, 5 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Слишком много попыток — попробуйте позже" },
      { status: 429 }
    );
  }

  const customer = await prisma.customer.findUnique({ where: { phone } });
  if (!customer || !(await verifyPassword(password, customer.passwordHash))) {
    return NextResponse.json({ error: "Неверный телефон или пароль" }, { status: 401 });
  }

  await createCustomerSession(customer.id);
  return NextResponse.json({ ok: true });
}
