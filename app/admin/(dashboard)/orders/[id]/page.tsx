import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatMinor } from "@/lib/money";
import { formatPhoneForDisplay } from "@/lib/phone";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) notFound();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, customer: true, promoCode: true },
  });
  if (!order) notFound();

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-char">Заказ #{order.id}</h1>
        <OrderStatusSelect orderId={order.id} status={order.status} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-flatbread-2 p-5">
          <h2 className="text-sm font-semibold text-char/50">Клиент</h2>
          <p className="mt-1 font-medium">{order.guestName}</p>
          <p className="text-char/70">{formatPhoneForDisplay(order.guestPhone)}</p>
          {order.customer && <p className="mt-1 text-xs text-char/40">Зарегистрированный клиент</p>}
        </div>

        <div className="rounded-2xl bg-flatbread-2 p-5">
          <h2 className="text-sm font-semibold text-char/50">
            {order.fulfillmentType === "DELIVERY" ? "Доставка" : "Самовывоз"}
          </h2>
          {order.fulfillmentType === "DELIVERY" ? (
            <p className="mt-1 text-char/80">
              {order.addressCity}, {order.addressStreet} {order.addressHouse}
              {order.addressApartment ? `, кв. ${order.addressApartment}` : ""}
              {order.addressEntrance ? `, подъезд ${order.addressEntrance}` : ""}
              {order.addressFloor ? `, этаж ${order.addressFloor}` : ""}
              {order.addressComment ? ` (${order.addressComment})` : ""}
            </p>
          ) : (
            <p className="mt-1 text-char/80">Самовывоз из пиццерии</p>
          )}
          <p className="mt-2 text-sm text-char/60">
            {order.paymentMethod === "ONLINE"
              ? order.paymentStatus === "SUCCEEDED"
                ? "Оплата: онлайн — оплачено"
                : "Оплата: онлайн — ожидает оплаты"
              : `Оплата: ${order.paymentMethod === "CASH" ? "наличными" : "картой"} при получении`}
          </p>
        </div>
      </div>

      {order.notes && (
        <div className="mt-4 rounded-2xl bg-flatbread-2 p-5">
          <h2 className="text-sm font-semibold text-char/50">Комментарий к заказу</h2>
          <p className="mt-1 text-char/80">{order.notes}</p>
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-2xl bg-flatbread-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-char/10 text-left text-char/50">
              <th className="px-4 py-3 font-medium">Блюдо</th>
              <th className="px-4 py-3 font-medium">Кол-во</th>
              <th className="px-4 py-3 font-medium">Цена</th>
              <th className="px-4 py-3 font-medium">Сумма</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-char/5 last:border-0">
                <td className="px-4 py-3">
                  {item.nameSnapshot} <span className="text-char/50">· {item.variantLabelSnapshot}</span>
                </td>
                <td className="px-4 py-3">{item.quantity}</td>
                <td className="px-4 py-3">{formatMinor(item.unitPriceMinor)}</td>
                <td className="px-4 py-3 font-medium">{formatMinor(item.lineTotalMinor)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-1 border-t border-char/10 p-4 text-sm">
          <div className="flex justify-between text-char/70">
            <span>Промежуточный итог</span>
            <span>{formatMinor(order.subtotalMinor)}</span>
          </div>
          {order.discountMinor > 0 && (
            <div className="flex justify-between text-herb">
              <span>Скидка{order.promoCodeSnapshot ? ` (${order.promoCodeSnapshot})` : ""}</span>
              <span>−{formatMinor(order.discountMinor)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold text-char">
            <span>Итого</span>
            <span>{formatMinor(order.totalMinor)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
