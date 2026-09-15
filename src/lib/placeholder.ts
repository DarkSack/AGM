/**
 * Marcadores de posicion del contenido.
 *
 * El contenido por defecto (y lo que se sembro en la base de datos a partir de
 * el) marca los datos pendientes entre corchetes: `[AÑO]`, `[CIUDAD]`,
 * `[Nombre del Arquitecto]`. Sirven para que el despacho sepa que falta en el
 * panel, pero nunca deben verse en el sitio publico.
 */
const PLACEHOLDER_PATTERN = /\[[^\]]+\]/;

export function isPlaceholder(value: string | null | undefined): boolean {
  return PLACEHOLDER_PATTERN.test(value ?? "");
}

/** Texto utilizable en el sitio: ni vacio ni con marcadores pendientes. */
export function publicText(value: string | null | undefined): string | null {
  const text = value?.trim();
  if (!text || isPlaceholder(text)) return null;
  return text;
}
