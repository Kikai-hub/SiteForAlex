"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore, cartSubtotalMinor, cartLineUnitPriceMinor } from "@/lib/store/cart";
import { useHasMounted } from "@/lib/useHasMounted";
import { formatMinor } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { Stamp } from "@/components/ui/Stamp";

export default function CartPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const mounted = useHasMounted();

  if (!mounted) return null;

  const subtotal = cartSubtotalMinor(items);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-display text-3xl font-semibold text-char">Корзина</h1>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl bg-flatbread-2 p-10 text-center">
          <p className="text-char/60">Корзина пока пуста — самое время выбрать пиццу.</p>
          <Link href="/menu" className="mt-4 inline-block">
            <Button>Перейти в меню</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-3">
            {items.map((item) => (
              <div key={item.lineId} className="flex items-center gap-4 rounded-2xl bg-flatbread-2 p-4">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" className="h-16 w-16 rounded-xl object-cover" />
                ) : (
                  <Stamp tone="flatbread" className="h-16 w-16 shrink-0 text-lg font-display font-semibold">
                    {item.name.slice(0, 1)}
                  </Stamp>
                )}
                <div className="flex-1">
                  <p className="font-display font-semibold text-char">{item.name}</p>
                  <p className="text-sm text-char/50">{item.variantLabel}</p>
                  {item.extras.length > 0 && (
                    <p className="mt-0.5 text-xs text-char/40">
                      {item.extras.map((e) => `${e.name}${e.quantity > 1 ? ` ×${e.quantity}` : ""}`).join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(item.lineId, item.quantity - 1)}
                    className="h-8 w-8 rounded-full bg-char/10 text-char hover:bg-char/15"
                    aria-label="Уменьшить количество"
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-medium">{item.quantity}</span>
                  <button
                    onClick={() => setQuantity(item.lineId, item.quantity + 1)}
                    className="h-8 w-8 rounded-full bg-char/10 text-char hover:bg-char/15"
                    aria-label="Увеличить количество"
                  >
                    +
                  </button>
                </div>
                <div className="w-24 text-right font-semibold text-char">
                  {formatMinor(cartLineUnitPriceMinor(item) * item.quantity)}
                </div>
                <button
                  onClick={() => removeItem(item.lineId)}
                  className="text-char/30 hover:text-red-600"
                  aria-label="Удалить"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between rounded-2xl bg-char p-5 text-flatbread">
            <span className="text-lg">Итого</span>
            <span className="font-sans text-2xl font-bold">{formatMinor(subtotal)}</span>
          </div>

          <div className="mt-5 flex justify-end">
            <Button size="lg" onClick={() => router.push("/checkout")}>
              Оформить заказ
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
