"use client";

import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { LOCALES, type Locale } from "@/config/site";
import { usePathname, useRouter } from "@/i18n/navigation";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import { cn } from "@/lib/cn";

/**
 * Cambia de idioma conservando la ruta actual.
 *
 * Es una navegacion del router, no una recarga: el estado de la pagina y la
 * posicion de scroll se mantienen. `replace` evita que el historial se llene
 * de entradas cada vez que alguien alterna ES/EN.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("language");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale) return;
    track(ANALYTICS_EVENTS.languageChange, { value: next, locale });
    startTransition(() => {
      // `pathname` es la union de todas las rutas y `params` sus parametros,
      // pero TypeScript no puede correlacionar ambos valores en tiempo de
      // compilacion. En ejecucion siempre coinciden, porque los dos salen de
      // la ruta que se esta mostrando. Es la unica asercion del componente y
      // esta acotada a esta llamada.
      const href = { pathname, params } as Parameters<typeof router.replace>[0];
      router.replace(href, { locale: next, scroll: false });
    });
  }

  return (
    <div
      className={cn("flex items-center", className)}
      role="group"
      aria-label={t("label")}
    >
      {LOCALES.map((code, index) => {
        const isActive = code === locale;
        return (
          <span key={code} className="flex items-center">
            {index > 0 ? (
              <span aria-hidden="true" className="mx-1.5 h-3 w-px bg-line" />
            ) : null}
            <button
              type="button"
              onClick={() => switchTo(code)}
              disabled={isPending}
              aria-current={isActive ? "true" : undefined}
              aria-label={t("switchTo", { language: t(code) })}
              // 24×24 como minimo (WCAG 2.2, tamano de objetivo): el texto mide
              // 18 px y en movil costaba acertar entre ES y EN.
              className={cn(
                "inline-flex min-h-6 min-w-6 items-center justify-center font-sans text-[0.6875rem] font-medium tracking-[0.16em] uppercase transition-colors",
                isActive
                  ? "text-fg"
                  : "text-fg-subtle hover:text-fg disabled:opacity-60",
              )}
            >
              {code}
            </button>
          </span>
        );
      })}
    </div>
  );
}
