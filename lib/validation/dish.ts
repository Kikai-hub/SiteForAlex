import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Укажите название").max(80),
  slug: z
    .string()
    .trim()
    .min(1, "Укажите slug")
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Только латиница, цифры и дефис"),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.coerce.boolean().default(true),
});

export const dishSchema = z.object({
  categoryId: z.string().min(1, "Выберите категорию"),
  name: z.string().trim().min(1, "Укажите название").max(150),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  caloriesPer100g: z.coerce
    .number("Укажите калорийность")
    .int()
    .positive("Калорийность должна быть больше 0"),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.coerce.boolean().default(true),
});

export const dishVariantSchema = z.object({
  label: z.string().trim().min(1, "Укажите размер/вариант").max(60),
  priceRubles: z.coerce.number().positive("Цена должна быть больше 0"),
  weightGrams: z.coerce.number().int().positive().optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.coerce.boolean().default(true),
});
