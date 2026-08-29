import type { ContentBlock } from "@/types/content";

/**
 * Composicion por defecto de la pagina publica.
 *
 * El panel reordena, activa o desactiva estos bloques y puede anadir otros del
 * catalogo cerrado definido en `BLOCK_TYPES`. Cada tipo tiene un componente
 * propio: no hay ninguna via para inyectar HTML o JavaScript desde el CMS.
 */
export const defaultBlocks: ContentBlock[] = [
  { id: "blk-hero", type: "hero", position: 1, enabled: true, data: {} },
  { id: "blk-about", type: "about", position: 2, enabled: true, data: {} },
  { id: "blk-services", type: "services", position: 3, enabled: true, data: {} },
  { id: "blk-projects", type: "projects", position: 4, enabled: true, data: {} },
  { id: "blk-method", type: "method", position: 5, enabled: true, data: {} },
  { id: "blk-values", type: "values", position: 6, enabled: true, data: {} },
  { id: "blk-contact", type: "contact", position: 7, enabled: true, data: {} },
];
