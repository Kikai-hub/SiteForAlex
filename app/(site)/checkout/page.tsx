import { getCurrentCustomer } from "@/lib/auth/customer";
import { prisma } from "@/lib/prisma";
import { getWalletBalance } from "@/lib/bonus";
import { CheckoutForm } from "@/components/site/CheckoutForm";

export default async function CheckoutPage() {
  const customer = await getCurrentCustomer();
  const [addresses, bonusBalance] = await Promise.all([
    customer
      ? prisma.address.findMany({
          where: { customerId: customer.id },
          orderBy: { isDefault: "desc" },
        })
      : Promise.resolve([]),
    customer ? getWalletBalance(customer.phone) : Promise.resolve(0),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="font-display text-3xl font-semibold text-char">Оформление заказа</h1>
      <div className="mt-6">
        <CheckoutForm
          customer={customer ? { name: customer.name, phone: customer.phone } : null}
          addresses={addresses}
          bonusBalance={bonusBalance}
          onlinePaymentEnabled={Boolean(process.env.YOOKASSA_SHOP_ID && process.env.YOOKASSA_SECRET_KEY)}
        />
      </div>
    </div>
  );
}
