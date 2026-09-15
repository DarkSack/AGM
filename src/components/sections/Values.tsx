import { getTranslations } from "next-intl/server";
import type { Locale } from "@/config/site";
import { t as pick, type SiteSettings } from "@/types/content";

interface ValuesProps {
  values: SiteSettings["values"];
  locale: Locale;
  /** Numeral editorial segun la posicion en la pagina. */
  index: string;
}

/**
 * Filosofia y valores.
 *
 * Banda de tinta que rompe el ritmo de la pagina justo antes del contacto.
 *
 * Usa la familia de tokens `band-*`, que es oscura en los dos temas. No
 * invierte los colores del tema: hacerlo dejaba un bloque blanco en mitad de
 * la pagina cuando el sitio esta en modo oscuro. En claro la banda contrasta
 * con el fondo; en oscuro queda por debajo de el, de modo que retrocede en vez
 * de destacar.
 */
export async function Values({ values, locale, index }: ValuesProps) {
  const t = await getTranslations("values");

  return (
    <section
      id="filosofia"
      aria-labelledby="filosofia-title"
      className="section-y bg-band text-band-fg"
    >
      <div className="container-editorial">
        <div className="flex flex-col gap-5" data-reveal>
          <div className="flex items-center gap-4">
            <span className="numeral text-band-subtle">{index}</span>
            <span aria-hidden="true" className="h-px w-8 bg-band-line" />
            <span className="eyebrow text-band-subtle">{t("eyebrow")}</span>
          </div>

          <h2 id="filosofia-title" className="max-w-[20ch] text-h2 text-band-fg">
            {t("title")}
          </h2>
        </div>

        {/* Separadores con filete superior en lugar de `gap-px`: asi cada
            columna sigue alineada con el titular, sin sangrados internos. */}
        <ul className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-12">
          {values.map((value, index) => (
            <li
              key={value.id}
              className="flex flex-col border-t border-band-line pt-6"
              data-reveal
              style={
                {
                  "--reveal-delay": `${index * 70}ms`,
                } as React.CSSProperties
              }
            >
              <span className="numeral text-band-subtle">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 font-display text-h3 text-band-fg">
                {pick(value.title, locale)}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-band-muted">
                {pick(value.description, locale)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
