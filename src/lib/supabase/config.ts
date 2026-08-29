/**
 * Supabase es opcional en tiempo de ejecucion.
 *
 * Si el proyecto todavia no tiene credenciales, el sitio publico se sirve con
 * el contenido de `src/content` y el panel muestra un aviso de configuracion
 * en lugar de romperse. Eso permite desarrollar, revisar y desplegar la parte
 * publica antes de dar de alta el backend.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || null;
export const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || null;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/** Bucket publico de lectura donde viven las imagenes de los proyectos. */
export const STORAGE_BUCKET = "media";

/** Limite de subida aplicado en cliente y revalidado en el servidor. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export function isAllowedImageType(value: string): value is AllowedImageType {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(value);
}
