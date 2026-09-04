import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { saveHeroSlideImage, deleteHeroSlideImageFile, UploadError } from "@/lib/uploads";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Требуется вход в админ-панель" }, { status: 401 });
  }

  const { id: slideId } = await params;
  const slide = await prisma.heroSlide.findUnique({ where: { id: slideId } });
  if (!slide) return NextResponse.json({ error: "Слайд не найден" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не найден в запросе" }, { status: 400 });
  }

  try {
    const saved = await saveHeroSlideImage(slideId, file);
    const previousImageUrl = slide.imageUrl;
    const updated = await prisma.heroSlide.update({
      where: { id: slideId },
      data: { imageUrl: saved.url },
    });
    await deleteHeroSlideImageFile(previousImageUrl);

    revalidatePath(`/admin/slides/${slideId}`);
    revalidatePath("/");
    revalidateTag("hero-slides", { expire: 0 });
    return NextResponse.json({ slide: updated });
  } catch (e) {
    if (e instanceof UploadError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
