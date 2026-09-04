import { prisma } from "@/lib/prisma";
import { HeroSlideForm } from "@/components/admin/HeroSlideForm";

export default async function NewHeroSlidePage() {
  const dishes = await prisma.dish.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-char">Новый слайд</h1>
      <p className="mt-1 text-sm text-char/60">
        После создания вы сможете загрузить изображение баннера.
      </p>
      <div className="mt-6">
        <HeroSlideForm dishes={dishes} />
      </div>
    </div>
  );
}
