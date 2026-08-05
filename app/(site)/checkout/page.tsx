import { getCurrentCustomer } from "@/lib/auth/customer";
import { prisma } from "@/lib/prisma";
import { CheckoutForm } from "@/components/site/CheckoutForm";

export default async function CheckoutPage() {
  const customer = await getCurrentCustomer();
  const addresses = customer
    ? await prisma.address.findMany({
        where: { customerId: customer.id },
        orderBy: { isDefault: "desc" },
      })
    : [];

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="font-display text-3xl font-semibold text-char">Оформление заказа</h1>
      <div className="mt-6">
        <CheckoutForm
          customer={customer ? { name: customer.name, phone: customer.phone } : null}
          addresses={addresses}
          onlinePaymentEnabled={Boolean(process.env.YOOKASSA_SHOP_ID && process.env.YOOKASSA_SECRET_KEY)}
        />
      </div>
    </div>
  );
}
