import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const ALLOWED_TYPES: Record<string, { ext: string; kind: "PHOTO" | "VIDEO" }> = {
  "image/jpeg": { ext: "jpg", kind: "PHOTO" },
  "image/png": { ext: "png", kind: "PHOTO" },
  "image/webp": { ext: "webp", kind: "PHOTO" },
  "video/mp4": { ext: "mp4", kind: "VIDEO" },
  "video/webm": { ext: "webm", kind: "VIDEO" },
};

const MAX_SIZE_BYTES: Record<"PHOTO" | "VIDEO", number> = {
  PHOTO: 15 * 1024 * 1024,
  VIDEO: 100 * 1024 * 1024,
};

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads", "dishes");

export class UploadError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function saveDishMedia(dishId: string, file: File) {
  const meta = ALLOWED_TYPES[file.type];
  if (!meta) {
    throw new UploadError(
      "Неподдерживаемый формат файла. Разрешены: JPEG, PNG, WEBP, MP4, WEBM."
    );
  }
  if (file.size > MAX_SIZE_BYTES[meta.kind]) {
    const limitMb = MAX_SIZE_BYTES[meta.kind] / (1024 * 1024);
    throw new UploadError(`Файл слишком большой (максимум ${limitMb} МБ).`, 413);
  }

  const dir = path.join(UPLOAD_ROOT, dishId);
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}.${meta.ext}`;
  const filePath = path.join(dir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return {
    url: `/uploads/dishes/${dishId}/${filename}`,
    type: meta.kind,
  };
}

export async function deleteDishMediaFile(url: string) {
  if (!url.startsWith("/uploads/dishes/")) return;
  const filePath = path.join(process.cwd(), "public", url);
  try {
    await unlink(filePath);
  } catch {
    // file already missing — nothing to clean up
  }
}
