"use client";

import { useState, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useCartStore, cartSubtotalMinor } from "@/lib/store/cart";
import { useHasMounted } from "@/lib/useHasMounted";
import { formatMinor } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { AddressAutocomplete } from "@/components/site/AddressAutocomplete";

interface SavedAddress {
  id: string;
  label: string | null;
  city: string;
  street: string;
  house: string;
  apartment: string | null;
  isDefault: boolean;
}

export function CheckoutForm({
  customer,
  addresses,
}: {
  customer: { name: string | null; phone: string } | null;
  addresses: SavedAddress[];
}) {
  const router = useRouter();
  const cityRef = useRef<HTMLInputElement>(null);
  const houseRef = useRef<HTMLInputElement>(null);
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const mounted = useHasMounted();

  const [fulfillmentType, setFulfillmentType] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD">("CASH");
  const [addressId, setAddressId] = useState(addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? "");
  const [useNewAddress, setUseNewAddress] = useState(addresses.length === 0);
  const [promoCode, setPromoCode] = useState("");
  const [promoResult, setPromoResult] = useState<{ discountMinor: number; code: string } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [checkingPromo, setCheckingPromo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!mounted) return null;

  const subtotal = cartSubtotalMinor(items);
  const discount = promoResult?.discountMinor ?? 0;
  const total = Math.max(subtotal - discount, 0);

  async function checkPromo() {
    if (!promoCode.trim()) return;
    setCheckingPromo(true);
    setPromoError(null);
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoCode,
          subtotalMinor: subtotal,
          guestPhone: customer?.phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPromoError(data.error ?? "Промокод недействителен");
        setPromoResult(null);
        return;
      }
      setPromoResult(data);
    } finally {
      setCheckingPromo(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const payload = {
      items: items.map((i) => ({ dishVariantId: i.dishVariantId, quantity: i.quantity })),
      fulfillmentType,
      paymentMethod,
      guestName: formData.get("name"),
      guestPhone: formData.get("phone"),
      addressId: fulfillmentType === "DELIVERY" && !useNewAddress ? addressId : null,
      address:
        fulfillmentType === "DELIVERY" && useNewAddress
          ? {
              city: formData.get("city") || "Москва",
              street: formData.get("street"),
              house: formData.get("house"),
              apartment: formData.get("apartment"),
              entrance: formData.get("entrance"),
              floor: formData.get("floor"),
              comment: formData.get("comment"),
            }
          : null,
      promoCode: promoResult?.code ?? null,
      notes: formData.get("notes"),
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Не удалось оформить заказ");
        return;
      }
      clear();
      router.push(`/checkout/success/${data.orderId}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return <p className="text-char/60">Корзина пуста — нечего оформлять.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 md:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        <div className="rounded-2xl bg-flatbread-2 p-5">
          <h2 className="font-display text-lg font-semibold text-char">Получение</h2>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setFulfillmentType("DELIVERY")}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                fulfillmentType === "DELIVERY" ? "bg-ember text-flatbread-2" : "bg-char/10 text-char/70"
              }`}
            >
              Доставка
            </button>
            <button
              type="button"
              onClick={() => setFulfillmentType("PICKUP")}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                fulfillmentType === "PICKUP" ? "bg-ember text-flatbread-2" : "bg-char/10 text-char/70"
              }`}
            >
              Самовывоз
            </button>
          </div>

          {fulfillmentType === "DELIVERY" && (
            <div className="mt-4 space-y-3">
              {addresses.length > 0 && !useNewAddress && (
                <div>
                  <Label htmlFor="addressId">Адрес доставки</Label>
                  <Select id="addressId" value={addressId} onChange={(e) => setAddressId(e.target.value)}>
                    {addresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label ? `${a.label}: ` : ""}
                        {a.street} {a.house}
                        {a.apartment ? `, кв. ${a.apartment}` : ""}
                      </option>
                    ))}
                  </Select>
                  <button
                    type="button"
                    onClick={() => setUseNewAddress(true)}
                    className="mt-2 text-sm font-medium text-ember hover:underline"
                  >
                    + Новый адрес
                  </button>
                </div>
              )}

              {useNewAddress && (
                <div className="space-y-3">
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setUseNewAddress(false)}
                      className="text-sm font-medium text-ember hover:underline"
                    >
                      ← Выбрать сохранённый адрес
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <Input ref={cityRef} name="city" placeholder="Город" defaultValue="Москва" />
                    <AddressAutocomplete
                      name="street"
                      required
                      cityInputRef={cityRef}
                      houseInputRef={houseRef}
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <Input ref={houseRef} name="house" placeholder="Дом" required />
                    <Input name="apartment" placeholder="Кв." />
                    <Input name="entrance" placeholder="Подъезд" />
                    <Input name="floor" placeholder="Этаж" />
                  </div>
                  <Input name="comment" placeholder="Комментарий курьеру (необязательно)" />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-flatbread-2 p-5">
          <h2 className="font-display text-lg font-semibold text-char">Контакты</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="name">Имя</Label>
              <Input id="name" name="name" required defaultValue={customer?.name ?? ""} />
            </div>
            <div>
              <Label htmlFor="phone">Телефон</Label>
              <PhoneInput id="phone" name="phone" required defaultValue={customer?.phone ?? ""} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-flatbread-2 p-5">
          <h2 className="font-display text-lg font-semibold text-char">Оплата</h2>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("CASH")}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                paymentMethod === "CASH" ? "bg-ember text-flatbread-2" : "bg-char/10 text-char/70"
              }`}
            >
              Наличными
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("CARD")}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                paymentMethod === "CARD" ? "bg-ember text-flatbread-2" : "bg-char/10 text-char/70"
              }`}
            >
              Картой курьеру
            </button>
          </div>
          <p className="mt-2 text-xs text-char/50">Оплата производится при получении заказа.</p>
        </div>

        <div className="rounded-2xl bg-flatbread-2 p-5">
          <Label htmlFor="notes">Комментарий к заказу (необязательно)</Label>
          <Textarea id="notes" name="notes" rows={2} />
        </div>
      </div>

      <div className="h-fit rounded-2xl bg-flatbread-2 p-5">
        <h2 className="font-display text-lg font-semibold text-char">Ваш заказ</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {items.map((i) => (
            <li key={i.dishVariantId} className="flex justify-between text-char/70">
              <span>
                {i.name} ({i.variantLabel}) × {i.quantity}
              </span>
              <span>{formatMinor(i.priceMinor * i.quantity)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex gap-2">
          <Input
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder="Промокод"
            className="flex-1"
          />
          <Button type="button" variant="secondary" onClick={checkPromo} disabled={checkingPromo}>
            {checkingPromo ? "…" : "Применить"}
          </Button>
        </div>
        {promoError && <FieldError>{promoError}</FieldError>}
        {promoResult && (
          <p className="mt-1 text-sm font-medium text-herb">
            Промокод {promoResult.code} применён: −{formatMinor(promoResult.discountMinor)}
          </p>
        )}

        <div className="mt-4 space-y-1 border-t border-char/10 pt-4 text-sm">
          <div className="flex justify-between text-char/70">
            <span>Сумма</span>
            <span>{formatMinor(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-herb">
              <span>Скидка</span>
              <span>−{formatMinor(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-semibold text-char">
            <span>Итого</span>
            <span>{formatMinor(total)}</span>
          </div>
        </div>

        <FieldError>{error}</FieldError>
        <Button type="submit" size="lg" className="mt-4 w-full" disabled={submitting}>
          {submitting ? "Оформляем…" : "Подтвердить заказ"}
        </Button>
      </div>
    </form>
  );
}
