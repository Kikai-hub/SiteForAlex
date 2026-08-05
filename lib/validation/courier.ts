import { z } from "zod";

export const courierCreateSchema = z.object({
  name: z.string().trim().min(1, "Укажите имя курьера").max(100),
  username: z
    .string()
    .trim()
    .min(3, "Минимум 3 символа")
    .max(30)
    .regex(/^[a-zA-Z0-9_.-]+$/, "Только латиница, цифры, - . _"),
  password: z
    .string()
    .min(6, "Пароль должен содержать не менее 6 символов")
    .max(72, "Пароль слишком длинный"),
});
