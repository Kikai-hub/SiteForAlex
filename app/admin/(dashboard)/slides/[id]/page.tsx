import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { HeroSlideForm } from "@/components/admin/HeroSlideForm";
import { HeroSlideImageUploader } from "@/components/admin/HeroSlideImageUploader";
import { DeleteHeroSlideButton } from "@/components/admin/DeleteHeroSlideButton";

export default async function EditHeroSlidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [slide, dishes] = await Promise.all([
    prisma.heroSlide.findUnique({ where: { id } }),
    prisma.dish.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!slide) notFound();

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-char">{slide.title}</h1>
        <DeleteHeroSlideButton id={slide.id} title={slide.title} />
      </div>
      <HeroSlideForm slide={slide} dishes={dishes} />
      <HeroSlideImageUploader slideId={slide.id} imageUrl={slide.imageUrl} />
    </div>
  );
}
