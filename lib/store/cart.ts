import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItemExtra {
  dishExtraId: string;
  name: string;
  /** Display-only snapshot — see the note on CartItem.priceMinor below. */
  priceMinor: number;
  quantity: number;
}

export interface CartItem {
  /** Identifies a cart line: the same variant with a different extras selection is a
   *  separate line, so this is derived from dishVariantId + the sorted extras, not just
   *  dishVariantId. Stable for a given selection, which lets addItem merge duplicates. */
  lineId: string;
  dishVariantId: string;
  dishId: string;
  name: string;
  variantLabel: string;
  /** Display-only snapshot of the price at the time it was added to the cart.
   *  The server always re-fetches the live price at checkout — this value is
   *  never trusted for the actual charge. */
  priceMinor: number;
  imageUrl: string | null;
  quantity: number;
  extras: CartItemExtra[];
}

function buildLineId(dishVariantId: string, extras: CartItemExtra[]): string {
  const extrasKey = extras
    .map((e) => `${e.dishExtraId}x${e.quantity}`)
    .sort()
    .join(",");
  return `${dishVariantId}::${extrasKey}`;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity" | "lineId">, quantity?: number) => void;
  removeItem: (lineId: string) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item, quantity = 1) =>
        set((state) => {
          const lineId = buildLineId(item.dishVariantId, item.extras);
          const existing = state.items.find((i) => i.lineId === lineId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.lineId === lineId ? { ...i, quantity: i.quantity + quantity } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, lineId, quantity }] };
        }),
      removeItem: (lineId) =>
        set((state) => ({
          items: state.items.filter((i) => i.lineId !== lineId),
        })),
      setQuantity: (lineId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.lineId !== lineId)
              : state.items.map((i) => (i.lineId === lineId ? { ...i, quantity } : i)),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "adana-cart",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function cartLineExtrasMinor(item: Pick<CartItem, "extras">): number {
  return item.extras.reduce((sum, e) => sum + e.priceMinor * e.quantity, 0);
}

export function cartLineUnitPriceMinor(item: Pick<CartItem, "priceMinor" | "extras">): number {
  return item.priceMinor + cartLineExtrasMinor(item);
}

export function cartSubtotalMinor(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + cartLineUnitPriceMinor(i) * i.quantity, 0);
}

export function cartItemCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}
