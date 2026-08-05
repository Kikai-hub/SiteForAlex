import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createCustomerSession } from "@/lib/auth/customer";
import { customerRegisterSchema } from "@/lib/validation/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = customerRegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 }
    );
  }

  const { phone, password, name } = parsed.data;

  const existing = await prisma.customer.findUnique({ where: { phone } });
  if (existing) {
    return NextResponse.json(
      { error: "Клиент с таким номером телефона уже зарегистрирован" },
      { status: 409 }
    );
  }

  const customer = await prisma.customer.create({
    data: {
      phone,
      passwordHash: await hashPassword(password),
      name: name || null,
    },
  });

  await createCustomerSession(customer.id);
  return NextResponse.json({ ok: true });
}
