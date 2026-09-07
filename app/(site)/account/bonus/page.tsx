import { getCurrentCustomer } from "@/lib/auth/customer";
import { prisma } from "@/lib/prisma";

const TYPE_LABELS: Record<string, string> = {
  EARN: "Начисление",
  REDEEM: "Списание",
  REFUND: "Возврат (заказ отменён)",
  ADJUSTMENT: "Корректировка",
};

export default async function AccountBonusPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  const wallet = await prisma.bonusWallet.findUnique({
    where: { phone: customer.phone },
    include: { transactions: { orderBy: { createdAt: "desc" }, take: 50 } },
  });

  return (
    <div>
      <div className="rounded-2xl bg-flatbread-2 p-5">
        <p className="text-sm text-char/50">Баланс баллов</p>
        <p className="mt-1 font-display text-3xl font-semibold text-char">{wallet?.balance ?? 0} ₽</p>
        <p className="mt-1 text-xs text-char/50">
          1 балл = 1 ₽ скидки. Баллы начисляются после доставки/получения заказа и списываются как скидка
          при следующей покупке (не за все блюда — зависит от настроек ресторана).
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl bg-flatbread-2">
        {!wallet || wallet.transactions.length === 0 ? (
          <p className="p-5 text-sm text-char/50">Пока нет истории начислений и списаний.</p>
        ) : (
          <ul className="divide-y divide-char/5">
            {wallet.transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-char">{TYPE_LABELS[t.type] ?? t.type}</p>
                  <p className="text-xs text-char/50">{new Date(t.createdAt).toLocaleString("ru-RU")}</p>
                </div>
                <span className={`font-semibold ${t.amount >= 0 ? "text-herb" : "text-red-600"}`}>
                  {t.amount >= 0 ? "+" : ""}
                  {t.amount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
