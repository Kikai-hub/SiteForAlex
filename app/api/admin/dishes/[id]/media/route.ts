import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { saveDishMedia, UploadError } from "@/lib/uploads";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Требуется вход в админ-панель" }, { status: 401 });
  }

  const { id: dishId } = await params;
  const dish = await prisma.dish.findUnique({ where: { id: dishId } });
  if (!dish) return NextResponse.json({ error: "Блюдо не найдено" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не найден в запросе" }, { status: 400 });
  }

  try {
    const saved = await saveDishMedia(dishId, file);
    const existingCount = await prisma.mediaAsset.count({ where: { dishId } });
    const media = await prisma.mediaAsset.create({
      data: {
        dishId,
        type: saved.type,
        url: saved.url,
        isPrimary: existingCount === 0,
      },
    });
    revalidatePath(`/admin/dishes/${dishId}`);
    revalidatePath("/menu");
    return NextResponse.json({ media });
  } catch (e) {
    if (e instanceof UploadError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
