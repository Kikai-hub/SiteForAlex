import Link from "next/link";
import { getCurrentCustomer } from "@/lib/auth/customer";
import { prisma } from "@/lib/prisma";

export default async function AccountPage() {
  const customer = await getCurrentCustomer();
  const orderCount = customer
    ? await prisma.order.count({ where: { customerId: customer.id } })
    : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Link href="/account/orders" className="rounded-2xl bg-flatbread-2 p-5 hover:-translate-y-0.5 transition-transform">
        <p className="text-sm text-char/50">Заказы</p>
        <p className="mt-1 font-display text-2xl font-semibold text-char">{orderCount}</p>
      </Link>
      <Link href="/account/addresses" className="rounded-2xl bg-flatbread-2 p-5 hover:-translate-y-0.5 transition-transform">
        <p className="text-sm text-char/50">Адреса доставки</p>
        <p className="mt-1 font-display text-lg font-semibold text-char">Управлять →</p>
      </Link>
    </div>
  );
}
