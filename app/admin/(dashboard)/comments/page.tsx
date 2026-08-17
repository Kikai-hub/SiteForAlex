import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CommentRow } from "@/components/admin/CommentRow";

const TABS = [
  { value: "PENDING", label: "На модерации" },
  { value: "APPROVED", label: "Одобренные" },
  { value: "REJECTED", label: "Отклонённые" },
  { value: "ALL", label: "Все" },
] as const;

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: rawStatus } = await searchParams;
  const status = TABS.some((t) => t.value === rawStatus) ? rawStatus! : "PENDING";

  const [comments, pendingCount] = await Promise.all([
    prisma.comment.findMany({
      where: status === "ALL" ? {} : { status: status as "PENDING" | "APPROVED" | "REJECTED" },
      include: { dish: { select: { name: true } }, customer: { select: { name: true, phone: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.comment.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-char">Комментарии</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value === "PENDING" ? "/admin/comments" : `/admin/comments?status=${tab.value}`}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              status === tab.value ? "bg-ember text-flatbread-2" : "bg-char/10 text-char/70 hover:bg-char/15"
            }`}
          >
            {tab.label}
            {tab.value === "PENDING" && pendingCount > 0 && ` (${pendingCount})`}
          </Link>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        {comments.length === 0 && <p className="text-sm text-char/50">Здесь пока пусто.</p>}
        {comments.map((c) => (
          <CommentRow
            key={c.id}
            comment={{
              id: c.id,
              dishId: c.dishId,
              dishName: c.dish.name,
              customerName: c.customer.name || c.customer.phone,
              body: c.body,
              rating: c.rating,
              status: c.status,
              adminReply: c.adminReply,
              createdAt: c.createdAt,
            }}
          />
        ))}
      </div>
    </div>
  );
}
