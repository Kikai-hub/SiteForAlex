"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/store/cart";
import { Button, ButtonProps } from "@/components/ui/Button";

export function AddToCartButton({
  dishId,
  dishVariantId,
  name,
  variantLabel,
  priceMinor,
  imageUrl,
  size = "md",
  className,
}: {
  dishId: string;
  dishVariantId: string;
  name: string;
  variantLabel: string;
  priceMinor: number;
  imageUrl: string | null;
} & Pick<ButtonProps, "size" | "className">) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  function handleClick() {
    addItem({ dishId, dishVariantId, name, variantLabel, priceMinor, imageUrl, extras: [] });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  return (
    <Button type="button" size={size} className={className} onClick={handleClick}>
      {added ? "Добавлено ✓" : "В корзину"}
    </Button>
  );
}
