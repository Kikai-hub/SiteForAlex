import { z } from "zod";

export const addressSchema = z.object({
  label: z.string().trim().max(40).optional().or(z.literal("")),
  city: z.string().trim().min(1).max(80).default("Москва"),
  street: z.string().trim().min(1, "Укажите улицу").max(150),
  house: z.string().trim().min(1, "Укажите дом").max(20),
  apartment: z.string().trim().max(20).optional().or(z.literal("")),
  entrance: z.string().trim().max(10).optional().or(z.literal("")),
  floor: z.string().trim().max(10).optional().or(z.literal("")),
  comment: z.string().trim().max(300).optional().or(z.literal("")),
  isDefault: z.coerce.boolean().default(false),
});
