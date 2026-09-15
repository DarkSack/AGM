import type { Locale } from "@/config/site";
import { t as pick, type SiteSettings } from "@/types/content";

/**
 * Texto del aviso de privacidad en el idioma pedido, o null si el despacho aun
 * no lo ha escrito. Si solo existe en espanol se usa ese: un aviso legal en el
 * otro idioma es preferible a ninguno.
 *
 * Lo usan la pagina (para decidir entre aviso real y provisional) y el sitemap
 * (para incluirla solo cuando es real).
 */
export function privacyText(settings: SiteSettings, locale: Locale): string | null {
  const text = pick(settings.privacy.body, locale).trim();
  return text.length > 0 ? text : null;
}

/** Apartados del aviso: en el panel se separan con una linea en blanco. */
export function privacySections(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((section) => section.trim())
    .filter(Boolean);
}
