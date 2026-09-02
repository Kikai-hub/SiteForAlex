"use server";

import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { adminReplySchema } from "@/lib/validation/comment";

export type ActionState = { error?: string; ok?: boolean };
const OK: ActionState = { ok: true };

async function revalidateComment(dishId: string) {
  revalidatePath("/admin/comments");
  revalidatePath(`/dish/${dishId}`);
  updateTag("comments");
}

export async function moderateComment(commentId: string, status: "APPROVED" | "REJECTED") {
  await requireAdmin();
  const comment = await prisma.comment.update({ where: { id: commentId }, data: { status } });
  await revalidateComment(comment.dishId);
}

export async function deleteComment(commentId: string) {
  await requireAdmin();
  const comment = await prisma.comment.delete({ where: { id: commentId } });
  await revalidateComment(comment.dishId);
}

export async function replyToComment(
  commentId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = adminReplySchema.safeParse({ adminReply: formData.get("adminReply") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const comment = await prisma.comment.update({
    where: { id: commentId },
    data: { adminReply: parsed.data.adminReply, adminReplyAt: new Date() },
  });
  await revalidateComment(comment.dishId);
  return OK;
}

export async function deleteReply(commentId: string) {
  await requireAdmin();
  const comment = await prisma.comment.update({
    where: { id: commentId },
    data: { adminReply: null, adminReplyAt: null },
  });
  await revalidateComment(comment.dishId);
}
