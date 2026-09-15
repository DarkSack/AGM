import { STORAGE_BUCKET } from "@/lib/supabase/config";

/**
 * Ruta dentro del bucket a partir de la URL publica de un archivo.
 *
 * Se deriva de la URL y no del `id` de la imagen porque el `id` solo coincide
 * con la ruta en lo que sube el `ImageUploader`: el contenido de muestra y los
 * bloques usan otros identificadores. Lo que no sea una URL publica de nuestro
 * bucket (un SVG local, una URL externa) devuelve null y nunca se borra.
 */
export function storagePathFromUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    return null;
  }
  const index = pathname.indexOf(marker);
  if (index === -1) return null;
  const path = decodeURIComponent(pathname.slice(index + marker.length));
  return path.length > 0 ? path : null;
}

/**
 * Todas las rutas del bucket que aparecen en un texto cualquiera.
 *
 * Se aplica al JSON serializado de proyectos, bloques y ajustes: asi no hace
 * falta conocer en que campo guarda cada uno sus imagenes, y un campo nuevo con
 * una imagen queda protegido de la limpieza sin tocar este codigo.
 */
export function storagePathsIn(text: string): Set<string> {
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const paths = new Set<string>();
  let from = text.indexOf(marker);
  while (from !== -1) {
    const start = from + marker.length;
    const end = text.slice(start).search(/["'?#\s\\)]/);
    const raw = end === -1 ? text.slice(start) : text.slice(start, start + end);
    if (raw) {
      try {
        paths.add(decodeURIComponent(raw));
      } catch {
        paths.add(raw);
      }
    }
    from = text.indexOf(marker, start);
  }
  return paths;
}

/**
 * Archivos que estaban en `before` y ya no aparecen en `after`.
 *
 * Es lo que se puede borrar del bucket despues de guardar: una imagen que
 * sigue referenciada, aunque haya cambiado de posicion, no se toca.
 */
export function removedStoragePaths(
  before: readonly string[],
  after: readonly string[],
): string[] {
  const kept = new Set(
    after.map(storagePathFromUrl).filter((path): path is string => path !== null),
  );
  const removed = new Set<string>();
  for (const url of before) {
    const path = storagePathFromUrl(url);
    if (path && !kept.has(path)) removed.add(path);
  }
  return [...removed];
}
