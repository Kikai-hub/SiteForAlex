import { z } from "zod";
import { normalizePhone } from "@/lib/phone";

const phoneSchema = z
  .string()
  .trim()
  .min(1, "Укажите номер телефона")
  .transform((val, ctx) => {
    const normalized = normalizePhone(val);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "Некорректный номер телефона" });
      return z.NEVER;
    }
    return normalized;
  });

const passwordSchema = z
  .string()
  .min(6, "Пароль должен содержать не менее 6 символов")
  .max(72, "Пароль слишком длинный");

export const customerRegisterSchema = z.object({
  phone: phoneSchema,
  password: passwordSchema,
  name: z.string().trim().min(1).max(100).optional().or(z.literal("")),
});

export const customerLoginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "Введите пароль"),
});

export const adminLoginSchema = z.object({
  username: z.string().trim().min(1, "Введите логин"),
  password: z.string().min(1, "Введите пароль"),
});
