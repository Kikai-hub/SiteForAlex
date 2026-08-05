import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth/customer";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let customer;
  try {
    customer = await requireCustomer();
  } catch {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.customerId !== customer.id) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  const variantIds = order.items
    .map((i) => i.dishVariantId)
    .filter((id): id is string => id != null);
  const variants = await prisma.dishVariant.findMany({
    where: { id: { in: variantIds } },
    include: { dish: { include: { media: { orderBy: [{ isPrimary: "desc" }], take: 1 } } } },
  });
  const variantMap = new Map(variants.map((v) => [v.id, v]));

  const available: {
    dishId: string;
    dishVariantId: string;
    name: string;
    variantLabel: string;
    priceMinor: number;
    imageUrl: string | null;
    quantity: number;
  }[] = [];
  const unavailable: string[] = [];

  for (const item of order.items) {
    const variant = item.dishVariantId ? variantMap.get(item.dishVariantId) : undefined;
    if (variant && variant.isActive && variant.dish.isActive) {
      available.push({
        dishId: variant.dishId,
        dishVariantId: variant.id,
        name: variant.dish.name,
        variantLabel: variant.label,
        priceMinor: variant.priceMinor,
        imageUrl: variant.dish.media[0]?.url ?? null,
        quantity: item.quantity,
      });
    } else {
      unavailable.push(item.nameSnapshot);
    }
  }

  return NextResponse.json({ available, unavailable });
}
