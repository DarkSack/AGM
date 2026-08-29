import type { Locale } from "@/config/site";

/**
 * Anclas de la pagina unica. El orden es el del recorrido narrativo:
 * quien es AGM, que hace, que ha proyectado, como trabaja y como contactarlo.
 */
export const NAV_SECTIONS = [
  { id: "sobre-agm", key: "about" },
  { id: "servicios", key: "services" },
  { id: "proyectos", key: "projects" },
  { id: "metodo", key: "method" },
  { id: "contacto", key: "contact" },
] as const;

export type NavSection = (typeof NAV_SECTIONS)[number];

/** Raiz del sitio para un idioma dado (`/` en espanol, `/en` en ingles). */
export function localeHome(locale: Locale): string {
  return locale === "es" ? "/" : `/${locale}`;
}

/**
 * En la portada basta el ancla, que el navegador resuelve con scroll suave y
 * sin JavaScript. Desde cualquier otra pagina hay que volver a la portada
 * conservando el idioma.
 */
export function sectionHref(id: string, locale: Locale, isHome: boolean): string {
  if (isHome) return `#${id}`;
  const home = localeHome(locale);
  return `${home === "/" ? "" : home}/#${id}`;
}
