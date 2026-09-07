import { z } from "zod";

export const bonusSettingsSchema = z.object({
  earnPercent: z.coerce.number().int().min(0, "Не может быть отрицательным").max(100, "Не больше 100"),
  maxRedeemPercent: z.coerce.number().int().min(0, "Не может быть отрицательным").max(100, "Не больше 100"),
});
