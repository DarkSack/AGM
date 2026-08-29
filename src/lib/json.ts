import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/config/site";
import type { Localized } from "@/types/content";

/**
 * Coerciones defensivas para los campos `jsonb`.
 *
 * PostgREST devuelve `unknown` para jsonb y el contenido lo escribe una persona
 * desde el panel, asi que no se puede asumir la forma. Estas funciones evitan
 * `as any` y garantizan que un registro corrupto degrade a un valor vacio en
 * lugar de reventar el render de la pagina.
 */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function asNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function asStringArray(value: unknown): string[] {
  return asArray(value).filter((item): item is string => typeof item === "string");
}

/** Normaliza a `{ es, en }` rellenando los huecos con el idioma por defecto. */
export function asLocalized(value: unknown, fallback = ""): Localized {
  if (!isRecord(value)) {
    return { es: fallback, en: fallback };
  }
  const base = asString(value[DEFAULT_LOCALE], fallback);
  const result = {} as Localized;
  for (const locale of LOCALES) {
    result[locale] = asString(value[locale], base);
  }
  return result;
}

export function asNullableLocalized(value: unknown): Localized | null {
  if (!isRecord(value)) return null;
  const localized = asLocalized(value);
  return LOCALES.some((locale) => localized[locale].length > 0) ? localized : null;
}

/** Version parcial: solo conserva los idiomas realmente escritos. */
export function asPartialLocalized(value: unknown): Partial<Localized> {
  if (!isRecord(value)) return {};
  const result: Partial<Localized> = {};
  for (const locale of LOCALES) {
    const text = value[locale];
    if (typeof text === "string" && text.trim().length > 0) {
      result[locale] = text;
    }
  }
  return result;
}

export function asLocalizedStringArrays(value: unknown): Record<Locale, string[]> {
  const result = {} as Record<Locale, string[]>;
  for (const locale of LOCALES) {
    result[locale] = isRecord(value) ? asStringArray(value[locale]) : [];
  }
  return result;
}

/** Comprueba que un valor pertenece a una lista cerrada, sin castear. */
export function asEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}
