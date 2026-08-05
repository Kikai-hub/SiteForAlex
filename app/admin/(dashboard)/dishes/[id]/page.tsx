import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DishEditForm } from "@/components/admin/DishEditForm";
import { VariantEditor } from "@/components/admin/VariantEditor";
import { MediaUploader } from "@/components/admin/MediaUploader";

export default async function EditDishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [dish, categories] = await Promise.all([
    prisma.dish.findUnique({
      where: { id },
      include: {
        variants: { orderBy: { sortOrder: "asc" } },
        media: { orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  if (!dish) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-display text-2xl font-semibold text-char">{dish.name}</h1>
      <DishEditForm dish={dish} categories={categories} />
      <VariantEditor dishId={dish.id} variants={dish.variants} />
      <MediaUploader dishId={dish.id} media={dish.media} />
    </div>
  );
}
