import { defineRouting } from "next-intl/routing";
import { DEFAULT_LOCALE, LOCALES } from "@/config/site";

/**
 * `localePrefix: "as-needed"` sirve el espanol (idioma por defecto) en la raiz
 * del dominio y el ingles bajo `/en`. Evita un redirect en la URL mas
 * importante del sitio y mantiene el canonical limpio.
 *
 * Las rutas se traducen para que cada idioma tenga URLs propias y legibles,
 * que es lo que espera Google en un sitio multiidioma.
 */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "as-needed",
  pathnames: {
    "/": "/",
    "/proyectos/[slug]": {
      es: "/proyectos/[slug]",
      en: "/projects/[slug]",
    },
    "/aviso-de-privacidad": {
      es: "/aviso-de-privacidad",
      en: "/privacy-policy",
    },
  },
});

export type AppPathnames = keyof typeof routing.pathnames;
