import Link from "next/link";
import { getDishReviews } from "@/lib/cache/menu";
import { getCurrentCustomer } from "@/lib/auth/customer";
import { StarRating } from "@/components/ui/StarRating";
import { CommentForm } from "@/components/site/CommentForm";

function formatDate(date: Date): string {
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export async function DishReviews({ dishId }: { dishId: string }) {
  const [customer, { comments, aggregate }] = await Promise.all([
    getCurrentCustomer(),
    getDishReviews(dishId),
  ]);

  const isLoggedIn = Boolean(customer);
  const avgRating = aggregate._avg.rating ?? 0;
  const count = aggregate._count;

  return (
    <section className="mt-14">
      <div className="flex items-center gap-3">
        <h2 className="font-display text-2xl font-semibold text-char">Отзывы</h2>
        {count > 0 && (
          <div className="flex items-center gap-2">
            <StarRating value={avgRating} />
            <span className="text-sm text-char/50">
              {avgRating.toFixed(1)} · {count} {count === 1 ? "отзыв" : "отзывов"}
            </span>
          </div>
        )}
      </div>

      <div className="mt-5">
        {isLoggedIn ? (
          <CommentForm dishId={dishId} />
        ) : (
          <p className="rounded-2xl bg-flatbread-2 p-5 text-sm text-char/60">
            <Link href="/login" className="font-semibold text-ember hover:underline">
              Войдите
            </Link>{" "}
            в аккаунт, чтобы оставить отзыв.
          </p>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {comments.length === 0 && <p className="text-sm text-char/50">Пока нет отзывов — будьте первым.</p>}
        {comments.map((c) => (
          <div key={c.id} className="rounded-2xl bg-flatbread-2 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-char">{c.customer.name || "Гость"}</p>
              <span className="text-xs text-char/40">{formatDate(c.createdAt)}</span>
            </div>
            <div className="mt-1">
              <StarRating value={c.rating} size="sm" />
            </div>
            {isLoggedIn ? (
              c.body && <p className="mt-2 text-sm text-char/80">{c.body}</p>
            ) : (
              <p className="mt-2 text-sm text-char/40 italic">
                Текст отзыва виден только зарегистрированным пользователям.
              </p>
            )}
            {c.adminReply && (
              <div className="mt-3 rounded-xl bg-char/5 p-3">
                <p className="text-xs font-semibold text-char/50">Ответ администратора</p>
                <p className="mt-1 text-sm text-char/80">{c.adminReply}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
