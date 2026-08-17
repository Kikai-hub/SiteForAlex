"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store/cart";
import { Button } from "@/components/ui/Button";

export function ReorderButton({ orderId }: { orderId: number }) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState<string[] | null>(null);

  async function handleReorder() {
    setLoading(true);
    setUnavailable(null);
    try {
      const res = await fetch(`/api/account/orders/${orderId}/reorder`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) return;
      for (const item of data.available) {
        addItem(
          {
            dishId: item.dishId,
            dishVariantId: item.dishVariantId,
            name: item.name,
            variantLabel: item.variantLabel,
            priceMinor: item.priceMinor,
            imageUrl: item.imageUrl,
            extras: item.extras,
          },
          item.quantity
        );
      }
      if (data.unavailable.length > 0) {
        setUnavailable(data.unavailable);
      } else {
        router.push("/cart");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button variant="secondary" onClick={handleReorder} disabled={loading}>
        {loading ? "Добавляем…" : "Повторить заказ"}
      </Button>
      {unavailable && unavailable.length > 0 && (
        <p className="mt-2 text-sm text-char/60">
          Больше недоступны: {unavailable.join(", ")}. Остальное добавлено в{" "}
          <button onClick={() => router.push("/cart")} className="font-semibold text-ember hover:underline">
            корзину
          </button>
          .
        </p>
      )}
    </div>
  );
}
