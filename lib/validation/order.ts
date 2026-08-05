import { z } from "zod";

export const cartItemSchema = z.object({
  dishVariantId: z.string().min(1),
  quantity: z.coerce.number().int().positive().max(50),
});

export const createOrderSchema = z.object({
  items: z.array(cartItemSchema).min(1, "Корзина пуста"),
  fulfillmentType: z.enum(["DELIVERY", "PICKUP"]),
  paymentMethod: z.enum(["CASH", "CARD", "ONLINE"]),
  guestName: z.string().trim().min(1, "Укажите имя").max(100),
  guestPhone: z.string().trim().min(1, "Укажите телефон"),
  addressId: z.string().optional().nullable(),
  address: z
    .object({
      city: z.string().trim().max(80).optional(),
      street: z.string().trim().max(150).optional(),
      house: z.string().trim().max(20).optional(),
      apartment: z.string().trim().max(20).optional(),
      entrance: z.string().trim().max(10).optional(),
      floor: z.string().trim().max(10).optional(),
      comment: z.string().trim().max(300).optional(),
    })
    .optional()
    .nullable(),
  promoCode: z.string().trim().optional().nullable(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});
