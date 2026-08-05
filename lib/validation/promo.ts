import { z } from "zod";

export const promoCodeSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Минимум 3 символа")
      .max(30)
      .regex(/^[A-Za-zА-Яа-я0-9_-]+$/, "Только буквы, цифры, - и _")
      .transform((v) => v.toUpperCase()),
    type: z.enum(["PERCENT", "FIXED"]),
    value: z.coerce.number().positive("Значение должно быть больше 0"),
    minOrderAmountRubles: z.coerce.number().nonnegative().optional().nullable(),
    maxUsesTotal: z.coerce.number().int().positive().optional().nullable(),
    maxUsesPerCustomer: z.coerce.number().int().positive().optional().nullable(),
    startsAt: z.string().optional().nullable(),
    expiresAt: z.string().optional().nullable(),
    isActive: z.coerce.boolean().default(true),
  })
  .refine((data) => data.type !== "PERCENT" || data.value <= 100, {
    message: "Процентная скидка не может быть больше 100",
    path: ["value"],
  });

export const promoValidateSchema = z.object({
  code: z.string().trim().min(1),
  subtotalMinor: z.coerce.number().int().nonnegative(),
  customerId: z.string().optional().nullable(),
  guestPhone: z.string().optional().nullable(),
});
