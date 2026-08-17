"use client";

import { useActionState, useState, useTransition } from "react";
import {
  moderateComment,
  deleteComment,
  replyToComment,
  deleteReply,
  type ActionState,
} from "@/app/admin/(dashboard)/comments/actions";
import { StarRating } from "@/components/ui/StarRating";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea, FieldError } from "@/components/ui/Input";

const STATUS_LABEL = { PENDING: "На модерации", APPROVED: "Одобрен", REJECTED: "Отклонён" } as const;
const STATUS_TONE = { PENDING: "saffron", APPROVED: "herb", REJECTED: "neutral" } as const;

const initialState: ActionState = {};

export function CommentRow({
  comment,
}: {
  comment: {
    id: string;
    dishId: string;
    dishName: string;
    customerName: string;
    body: string | null;
    rating: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    adminReply: string | null;
    createdAt: Date;
  };
}) {
  const [pending, startTransition] = useTransition();
  const [replying, setReplying] = useState(false);
  const boundReply = replyToComment.bind(null, comment.id);
  const [replyState, replyAction, replyPending] = useActionState(boundReply, initialState);

  return (
    <div className="rounded-2xl bg-flatbread-2 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-char">
            {comment.customerName} <span className="font-normal text-char/40">· {comment.dishName}</span>
          </p>
          <p className="text-xs text-char/40">{new Date(comment.createdAt).toLocaleString("ru-RU")}</p>
        </div>
        <Badge tone={STATUS_TONE[comment.status]}>{STATUS_LABEL[comment.status]}</Badge>
      </div>

      <div className="mt-2">
        <StarRating value={comment.rating} size="sm" />
      </div>
      {comment.body && <p className="mt-2 text-sm text-char/80">{comment.body}</p>}

      {comment.adminReply && (
        <div className="mt-3 rounded-xl bg-char/5 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-char/50">Ваш ответ</p>
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => deleteReply(comment.id))}
              className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
            >
              Удалить ответ
            </button>
          </div>
          <p className="mt-1 text-sm text-char/80">{comment.adminReply}</p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {comment.status !== "APPROVED" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => moderateComment(comment.id, "APPROVED"))}
            className="rounded-full bg-herb/15 px-3 py-1.5 text-xs font-semibold text-herb hover:bg-herb/25 disabled:opacity-50"
          >
            Одобрить
          </button>
        )}
        {comment.status !== "REJECTED" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => moderateComment(comment.id, "REJECTED"))}
            className="rounded-full bg-char/10 px-3 py-1.5 text-xs font-semibold text-char hover:bg-char/15 disabled:opacity-50"
          >
            Отклонить
          </button>
        )}
        {!comment.adminReply && (
          <button
            type="button"
            onClick={() => setReplying((v) => !v)}
            className="rounded-full bg-char/10 px-3 py-1.5 text-xs font-semibold text-char hover:bg-char/15"
          >
            {replying ? "Отмена" : "Ответить"}
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm("Удалить комментарий безвозвратно?")) startTransition(() => deleteComment(comment.id));
          }}
          className="ml-auto text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
        >
          Удалить
        </button>
      </div>

      {replying && !comment.adminReply && (
        <form action={replyAction} className="mt-3 space-y-2">
          <Textarea name="adminReply" rows={2} placeholder="Ответ клиенту…" required />
          <FieldError>{replyState.error}</FieldError>
          <Button type="submit" size="sm" disabled={replyPending}>
            {replyPending ? "…" : "Отправить ответ"}
          </Button>
        </form>
      )}
    </div>
  );
}
