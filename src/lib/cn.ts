type ClassValue = string | number | false | null | undefined;

/**
 * Une clases descartando los valores falsy.
 *
 * No necesitamos `clsx` ni `tailwind-merge`: no hay clases en conflicto porque
 * las variantes se resuelven antes de concatenar.
 */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
