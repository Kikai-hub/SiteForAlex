import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

const MAX_SIZE_BYTES: Record<"PHOTO" | "VIDEO", number> = {
  PHOTO: 15 * 1024 * 1024,
  VIDEO: 100 * 1024 * 1024,
};

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads", "dishes");
const HERO_SLIDE_UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads", "hero-slides");

/** The slide card renders at very different shapes per breakpoint (~2.5:1 on
 *  desktop, ~0.8:1 on phones — see HeroSlider's object-cover comment), so a
 *  single uploaded photo has to be landscape and close to 3:2 to survive both
 *  crops without losing the dish. Matches the guidance text in
 *  HeroSlideImageUploader — keep the two in sync. */
const HERO_SLIDE_MIN_WIDTH = 1800;
const HERO_SLIDE_MIN_HEIGHT = 1200;
const HERO_SLIDE_ASPECT_MIN = 1.35; // ~4:3
const HERO_SLIDE_ASPECT_MAX = 1.65; // ~5:3

export class UploadError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

interface DetectedFile {
  ext: string;
  kind: "PHOTO" | "VIDEO";
}

/**
 * Identifies the real file format from its magic bytes. The client-supplied
 * File.type is attacker-controlled (it's just a FormData field) and must never
 * be trusted to decide the stored extension/kind — only the actual bytes can.
 */
function detectFileSignature(buffer: Buffer): DetectedFile | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: "jpg", kind: "PHOTO" };
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { ext: "png", kind: "PHOTO" };
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return { ext: "webp", kind: "PHOTO" };
  }
  if (buffer.length >= 12 && buffer.toString("ascii", 4, 8) === "ftyp") {
    return { ext: "mp4", kind: "VIDEO" };
  }
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return { ext: "webm", kind: "VIDEO" };
  }
  return null;
}

export async function saveDishMedia(dishId: string, file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());

  const detected = detectFileSignature(buffer);
  if (!detected) {
    throw new UploadError(
      "Неподдерживаемый формат файла. Разрешены: JPEG, PNG, WEBP, MP4, WEBM."
    );
  }
  if (buffer.length > MAX_SIZE_BYTES[detected.kind]) {
    const limitMb = MAX_SIZE_BYTES[detected.kind] / (1024 * 1024);
    throw new UploadError(`Файл слишком большой (максимум ${limitMb} МБ).`, 413);
  }

  const dir = path.join(UPLOAD_ROOT, dishId);
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}.${detected.ext}`;
  const filePath = path.join(dir, filename);
  await writeFile(filePath, buffer);

  return {
    url: `/uploads/dishes/${dishId}/${filename}`,
    type: detected.kind,
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

/** Hero slide banners are photos only (no video) — the slider autoplays,
 *  which doesn't make sense for a video background. */
export async function saveHeroSlideImage(slideId: string, file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());

  const detected = detectFileSignature(buffer);
  if (!detected || detected.kind !== "PHOTO") {
    throw new UploadError("Неподдерживаемый формат файла. Разрешены: JPEG, PNG, WEBP.");
  }
  if (buffer.length > MAX_SIZE_BYTES.PHOTO) {
    const limitMb = MAX_SIZE_BYTES.PHOTO / (1024 * 1024);
    throw new UploadError(`Файл слишком большой (максимум ${limitMb} МБ).`, 413);
  }

  let width: number | undefined;
  let height: number | undefined;
  try {
    ({ width, height } = await sharp(buffer).metadata());
  } catch {
    throw new UploadError("Не удалось прочитать изображение — файл повреждён или это не фото.");
  }
  if (!width || !height) {
    throw new UploadError("Не удалось прочитать размеры изображения.");
  }
  if (width < HERO_SLIDE_MIN_WIDTH || height < HERO_SLIDE_MIN_HEIGHT) {
    throw new UploadError(
      `Изображение слишком маленькое (${width}×${height}). Минимум ${HERO_SLIDE_MIN_WIDTH}×${HERO_SLIDE_MIN_HEIGHT} — рекомендуем именно это разрешение.`
    );
  }
  const aspect = width / height;
  if (aspect < HERO_SLIDE_ASPECT_MIN || aspect > HERO_SLIDE_ASPECT_MAX) {
    throw new UploadError(
      `Неподходящие пропорции (${width}×${height}). Нужно альбомное фото с пропорцией около 3:2, например 1800×1200.`
    );
  }

  const dir = path.join(HERO_SLIDE_UPLOAD_ROOT, slideId);
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}.${detected.ext}`;
  const filePath = path.join(dir, filename);
  await writeFile(filePath, buffer);

  return { url: `/uploads/hero-slides/${slideId}/${filename}` };
}

export async function deleteHeroSlideImageFile(url: string | null) {
  if (!url || !url.startsWith("/uploads/hero-slides/")) return;
  const filePath = path.join(process.cwd(), "public", url);
  try {
    await unlink(filePath);
  } catch {
    // file already missing — nothing to clean up
  }
}
