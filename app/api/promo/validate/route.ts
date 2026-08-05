import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/auth/customer";
import { validatePromoCode } from "@/lib/promo";
import { promoValidateSchema } from "@/lib/validation/promo";
import { normalizePhone } from "@/lib/phone";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = promoValidateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }

  const session = await getCustomerSession();
  const guestPhone = parsed.data.guestPhone ? normalizePhone(parsed.data.guestPhone) : null;

  const result = await validatePromoCode({
    code: parsed.data.code,
    subtotalMinor: parsed.data.subtotalMinor,
    customerId: session?.sub ?? null,
    guestPhone,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }
  return NextResponse.json(result);
}
