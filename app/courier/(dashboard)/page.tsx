import { prisma } from "@/lib/prisma";
import { getCurrentCourier } from "@/lib/auth/courier";
import { formatMinor } from "@/lib/money";
import { formatPhoneForDisplay } from "@/lib/phone";
import { ClaimOrderButton } from "@/components/courier/ClaimOrderButton";
import { DeliveredButton } from "@/components/courier/DeliveredButton";

function OrderDetails({
  order,
}: {
  order: {
    id: number;
    guestPhone: string;
    addressCity: string | null;
    addressStreet: string | null;
    addressHouse: string | null;
    addressApartment: string | null;
    addressEntrance: string | null;
    addressFloor: string | null;
    addressComment: string | null;
    paymentMethod: "CASH" | "CARD" | "ONLINE";
    paymentStatus: "PENDING" | "WAITING_FOR_CAPTURE" | "SUCCEEDED" | "CANCELED" | "REFUNDED";
    totalMinor: number;
    notes: string | null;
    items: { id: string; nameSnapshot: string; variantLabelSnapshot: string; quantity: number }[];
  };
}) {
  return (
    <div className="rounded-2xl bg-flatbread-2 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-char">Заказ №{order.id}</h3>
        <span className="text-sm text-char/50">{formatPhoneForDisplay(order.guestPhone)}</span>
      </div>

      <p className="mt-2 text-char/80">
        {order.addressCity}, {order.addressStreet} {order.addressHouse}
        {order.addressApartment ? `, кв. ${order.addressApartment}` : ""}
        {order.addressEntrance ? `, подъезд ${order.addressEntrance}` : ""}
        {order.addressFloor ? `, этаж ${order.addressFloor}` : ""}
        {order.addressComment ? ` (${order.addressComment})` : ""}
      </p>
      <p className="mt-1 text-sm font-medium text-char/60">
        {order.paymentMethod === "ONLINE" ? (
          order.paymentStatus === "SUCCEEDED" ? (
            <span className="font-semibold text-herb">Уже оплачено онлайн — деньги не собирать</span>
          ) : (
            <span className="font-semibold text-ember">Онлайн-оплата не завершена</span>
          )
        ) : (
          <>
            Оплата: {order.paymentMethod === "CASH" ? "наличными" : "картой"} при получении
            {order.paymentMethod === "CASH" && (
              <span className="ml-1 font-semibold text-char">— {formatMinor(order.totalMinor)}</span>
            )}
          </>
        )}
      </p>

      {order.notes && (
        <p className="mt-2 rounded-lg bg-flatbread p-2 text-sm text-char/70">
          Комментарий: {order.notes}
        </p>
      )}

      <ul className="mt-3 space-y-1 border-t border-char/10 pt-3 text-sm text-char/70">
        {order.items.map((item) => (
          <li key={item.id}>
            {item.nameSnapshot} ({item.variantLabelSnapshot}) × {item.quantity}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function CourierDashboardPage() {
  const courier = await getCurrentCourier();
  if (!courier) return null;

  const [available, mine] = await Promise.all([
    prisma.order.findMany({
      where: {
        fulfillmentType: "DELIVERY",
        courierId: null,
        status: { notIn: ["CANCELLED", "DELIVERED"] },
      },
      include: { items: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.order.findMany({
      where: { courierId: courier.id, status: "OUT_FOR_DELIVERY" },
      include: { items: true },
      orderBy: { assignedAt: "asc" },
    }),
  ]);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-display text-xl font-semibold text-char">Мои заказы</h2>
        {mine.length === 0 && (
          <p className="mt-2 text-char/50">Нет заказов в работе — возьмите новый ниже.</p>
        )}
        <div className="mt-3 space-y-4">
          {mine.map((order) => (
            <div key={order.id} className="space-y-3">
              <OrderDetails order={order} />
              <DeliveredButton orderId={order.id} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold text-char">Новые заказы</h2>
        {available.length === 0 && <p className="mt-2 text-char/50">Пока нет свободных заказов.</p>}
        <div className="mt-3 space-y-4">
          {available.map((order) => (
            <div key={order.id} className="space-y-3">
              <OrderDetails order={order} />
              <ClaimOrderButton orderId={order.id} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
