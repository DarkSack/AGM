/**
 * Genera un slug legible a partir de un titulo.
 *
 * Descompone en NFD y elimina el rango de diacriticos combinantes
 * (U+0300–U+036F), de modo que "Reforma Nórdica" da "reforma-nordica" y no
 * "reforma-n-rdica".
 *
 * El resultado cumple el CHECK de la tabla `projects`, que solo admite
 * minusculas, digitos y guiones.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function isValidSlug(value: string): boolean {
  return value.length >= 2 && value.length <= 96 && SLUG_PATTERN.test(value);
}
