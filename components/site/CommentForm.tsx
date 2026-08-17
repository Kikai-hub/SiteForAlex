"use client";

import { useActionState, useRef } from "react";
import { createComment, type ActionState } from "@/app/(site)/dish/[dishId]/actions";
import { StarRatingInput } from "@/components/site/StarRatingInput";
import { Button } from "@/components/ui/Button";
import { Textarea, FieldError } from "@/components/ui/Input";

const initialState: ActionState = {};

export function CommentForm({ dishId }: { dishId: string }) {
  const boundAction = createComment.bind(null, dishId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  if (state.ok) {
    return (
      <p className="rounded-xl bg-herb/10 p-4 text-sm font-medium text-herb">
        Спасибо! Ваш отзыв отправлен на модерацию и появится после проверки администратором.
      </p>
    );
  }

  return (
    <form
      ref={formRef}
      action={(formData) => {
        formAction(formData);
      }}
      className="space-y-3 rounded-2xl bg-flatbread-2 p-5"
    >
      <p className="text-sm font-semibold text-char/60">Ваша оценка</p>
      <StarRatingInput />
      <Textarea name="body" rows={3} placeholder="Поделитесь впечатлением о блюде (необязательно)" />
      <FieldError>{state.error}</FieldError>
      <Button type="submit" disabled={pending}>
        {pending ? "Отправляем…" : "Оставить отзыв"}
      </Button>
    </form>
  );
}
