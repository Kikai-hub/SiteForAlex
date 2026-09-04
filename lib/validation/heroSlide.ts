import { z } from "zod";

export const heroSlideSchema = z.object({
  title: z.string().trim().min(1, "Укажите заголовок").max(150),
  subtitle: z.string().trim().max(150).optional().or(z.literal("")),
  description: z.string().trim().max(400).optional().or(z.literal("")),
  badgeText: z.string().trim().max(60).optional().or(z.literal("")),
  priceLabel: z.string().trim().max(40).optional().or(z.literal("")),
  ctaLabel: z.string().trim().min(1, "Укажите текст кнопки").max(40),
  ctaHref: z.string().trim().max(300).optional().or(z.literal("")),
  dishId: z.string().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.coerce.boolean().default(true),
});
