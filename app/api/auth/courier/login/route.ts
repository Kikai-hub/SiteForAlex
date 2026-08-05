import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createCourierSession } from "@/lib/auth/courier";
import { courierLoginSchema } from "@/lib/validation/auth";

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
  const courier = await prisma.courier.findUnique({ where: { username } });
  if (!courier || !(await verifyPassword(password, courier.passwordHash))) {
    return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
  }

  await createCourierSession(courier.id);
  return NextResponse.json({ ok: true });
}
