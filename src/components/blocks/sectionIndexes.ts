import type { ContentBlock } from "@/types/content";

/** Secciones que llevan numeral editorial ("01", "02"...). */
const NUMBERED_TYPES: ReadonlySet<ContentBlock["type"]> = new Set([
  "about",
  "services",
  "projects",
  "method",
  "values",
  "contact",
]);

/**
 * Numeral de cada seccion segun su posicion real en la pagina.
 *
 * Antes cada componente llevaba su numero escrito a mano, asi que al reordenar
 * u ocultar bloques desde el panel la portada podia leerse 01, 03, 02, 06.
 */
export function sectionIndexes(blocks: ContentBlock[]): Map<string, string> {
  const indexes = new Map<string, string>();
  let counter = 0;
  for (const block of blocks) {
    if (!block.enabled || !NUMBERED_TYPES.has(block.type)) continue;
    counter += 1;
    indexes.set(block.id, String(counter).padStart(2, "0"));
  }
  return indexes;
}
