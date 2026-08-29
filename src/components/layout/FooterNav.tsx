"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/config/site";
import { usePathname } from "@/i18n/navigation";
import { NAV_SECTIONS, sectionHref } from "./navigation";

/**
 * Enlaces de seccion del pie.
 *
 * Es cliente unicamente para saber si estamos en la portada: dentro de ella el
 * enlace debe ser un ancla (`#servicios`) para que el navegador haga scroll
 * suave, y desde una ficha de proyecto tiene que volver a la portada. Un `<a>`
 * absoluto en ambos casos provocaria una recarga completa dentro de la propia
 * portada.
 */
export function FooterNav() {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <ul className="mt-5 flex flex-col gap-3">
      {NAV_SECTIONS.map(({ id, key }) => (
        <li key={id}>
          <a
            href={sectionHref(id, locale, isHome)}
            className="font-sans text-sm text-fg-muted transition-colors hover:text-fg"
          >
            {t(key)}
          </a>
        </li>
      ))}
    </ul>
  );
}
