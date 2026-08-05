import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
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
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (dishVariantId: string) => void;
  setQuantity: (dishVariantId: string, quantity: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.dishVariantId === item.dishVariantId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.dishVariantId === item.dishVariantId
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity }] };
        }),
      removeItem: (dishVariantId) =>
        set((state) => ({
          items: state.items.filter((i) => i.dishVariantId !== dishVariantId),
        })),
      setQuantity: (dishVariantId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.dishVariantId !== dishVariantId)
              : state.items.map((i) =>
                  i.dishVariantId === dishVariantId ? { ...i, quantity } : i
                ),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "adana-cart",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function cartSubtotalMinor(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.priceMinor * i.quantity, 0);
}

export function cartItemCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}
