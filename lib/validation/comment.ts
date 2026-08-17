import { z } from "zod";

export const commentSchema = z.object({
  rating: z.coerce.number().int().min(1, "Поставьте оценку").max(5, "Оценка от 1 до 5"),
  body: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const adminReplySchema = z.object({
  adminReply: z.string().trim().min(1, "Введите текст ответа").max(2000),
});
