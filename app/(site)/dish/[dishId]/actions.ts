"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth/customer";
import { commentSchema } from "@/lib/validation/comment";
import { isRateLimited } from "@/lib/rateLimit";

export type ActionState = { error?: string; ok?: boolean };
const OK: ActionState = { ok: true };

export async function createComment(
  dishId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  let customer;
  try {
    customer = await requireCustomer();
  } catch {
    return { error: "Войдите в аккаунт, чтобы оставить комментарий" };
  }

  if (isRateLimited(`comment:${customer.id}`, 5, 10 * 60 * 1000)) {
    return { error: "Слишком много комментариев — попробуйте позже" };
  }

  const dish = await prisma.dish.findUnique({ where: { id: dishId }, select: { id: true } });
  if (!dish) {
    return { error: "Блюдо не найдено" };
  }

  const parsed = commentSchema.safeParse({
    rating: formData.get("rating"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  await prisma.comment.create({
    data: {
      dishId,
      customerId: customer.id,
      rating: parsed.data.rating,
      body: parsed.data.body || null,
    },
  });

  revalidatePath(`/dish/${dishId}`);
  return OK;
}
