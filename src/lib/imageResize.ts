/**
 * Preparacion de fotos en el navegador antes de subirlas.
 *
 * Una foto de movil pesa 4–8 MB y mide 4000 px o mas. Se sirve siempre a traves
 * de `next/image`, que en el plan gratuito de Vercel tiene cuota de
 * transformaciones, y ocupa almacenamiento en Supabase. Reducirla aqui a 2400 px
 * en WebP deja un archivo de unos cientos de KB sin perdida visible en pantalla,
 * y la subida es varias veces mas rapida con datos moviles.
 */

/** Lado mayor maximo. Cubre pantallas retina de 1200 px de ancho. */
export const MAX_IMAGE_EDGE = 2400;

/** Por debajo de esto no merece la pena recomprimir un archivo ya ligero. */
const SMALL_ENOUGH_BYTES = 600 * 1024;

const WEBP_QUALITY = 0.85;

/** Dimensiones escaladas para caber en `max` sin deformar ni ampliar. */
export function fitWithin(
  width: number,
  height: number,
  max: number = MAX_IMAGE_EDGE,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= max || longest === 0) return { width, height };
  const scale = max / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** Si una imagen de estas dimensiones y peso se sube tal cual. */
export function shouldKeepOriginal(
  type: string,
  bytes: number,
  width: number,
  height: number,
): boolean {
  // AVIF ya es mas eficiente que WebP y el canvas no sabe codificarlo.
  if (type === "image/avif") return true;
  return Math.max(width, height) <= MAX_IMAGE_EDGE && bytes <= SMALL_ENOUGH_BYTES;
}

export interface PreparedImage {
  file: File;
  width: number;
  height: number;
  /** Si se redujo o recomprimio respecto al original. */
  resized: boolean;
}

/**
 * Devuelve la version a subir. Ante cualquier fallo del navegador (formato que
 * no sabe decodificar, falta de memoria) sube el original: reducir es una
 * mejora, nunca un requisito para poder subir.
 */
export async function prepareImageForUpload(file: File): Promise<PreparedImage> {
  let bitmap: ImageBitmap;
  try {
    // `from-image` respeta la orientacion EXIF: sin ella, las fotos verticales
    // de movil se subian tumbadas al redibujarlas.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return { file, width: 0, height: 0, resized: false };
  }

  try {
    const { width, height } = bitmap;
    if (shouldKeepOriginal(file.type, file.size, width, height)) {
      return { file, width, height, resized: false };
    }

    const target = fitWithin(width, height);
    const canvas = document.createElement("canvas");
    canvas.width = target.width;
    canvas.height = target.height;
    const context = canvas.getContext("2d");
    if (!context) return { file, width, height, resized: false };

    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, target.width, target.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY),
    );

    // Safari antiguo devuelve PNG si no sabe WebP; y a veces el resultado pesa
    // mas que el original. En ambos casos se sube el original.
    if (!blob || blob.type !== "image/webp" || blob.size >= file.size) {
      return { file, width, height, resized: false };
    }

    const name = file.name.replace(/\.[^.]+$/, "") || "imagen";
    return {
      file: new File([blob], `${name}.webp`, { type: "image/webp" }),
      width: target.width,
      height: target.height,
      resized: true,
    };
  } finally {
    bitmap.close();
  }
}
