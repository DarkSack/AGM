import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/config/site";
import { publicText } from "@/lib/placeholder";
import { Section } from "@/components/ui/Section";
import { t as pick, type SiteSettings } from "@/types/content";

interface AboutProps {
  settings: SiteSettings;
  locale: Locale;
  /** Numeral editorial segun la posicion en la pagina. */
  index: string;
}

/**
 * Sobre AGM.
 *
 * Composicion editorial a dos columnas: el texto lleva el peso y la columna
 * lateral funciona como ficha del despacho. Los datos biograficos son
 * marcadores explicitos: no se inventan titulos, cedulas ni anos de
 * experiencia.
 */
export async function About({ settings, locale, index }: AboutProps) {
  const t = await getTranslations("about");
  const { about } = settings;
  const architectName = publicText(about.architectName);
  const role = publicText(pick(about.role, locale));

  return (
    <Section id="sobre-agm" labelledBy="sobre-agm-title" tone="alt">
      <div className="container-editorial">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7 xl:col-span-7">
            <div className="flex items-center gap-4" data-reveal>
              <span className="numeral">{index}</span>
              <span aria-hidden="true" className="h-px w-8 bg-line-strong" />
              <span className="eyebrow">{t("eyebrow")}</span>
            </div>

            <h2
              id="sobre-agm-title"
              className="mt-6 max-w-[20ch] text-h2 text-fg"
              data-reveal
              style={{ "--reveal-delay": "60ms" } as React.CSSProperties}
            >
              {t("title")}
            </h2>

            <p
              className="mt-8 max-w-[54ch] text-lead text-fg"
              data-reveal
              style={{ "--reveal-delay": "120ms" } as React.CSSProperties}
            >
              {pick(about.intro, locale)}
            </p>

            <div className="mt-8 flex max-w-[62ch] flex-col gap-6">
              {about.body.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-[0.9875rem] leading-[1.75] text-fg-muted md:text-base"
                  data-reveal
                  style={
                    {
                      "--reveal-delay": `${160 + index * 60}ms`,
                    } as React.CSSProperties
                  }
                >
                  {pick(paragraph, locale)}
                </p>
              ))}
            </div>

            <blockquote
              className="mt-12 border-l border-accent pl-6"
              data-reveal
            >
              <p className="eyebrow">{t("philosophyLabel")}</p>
              <p className="mt-3 max-w-[40ch] font-display text-h3 text-fg">
                {pick(about.philosophy, locale)}
              </p>
            </blockquote>
          </div>

          <div className="lg:col-span-5 xl:col-span-4 xl:col-start-9">
            <div className="lg:sticky lg:top-28" data-reveal>
              {about.portrait ? (
                <Image
                  src={about.portrait.url}
                  alt={pick(about.portrait.alt, locale)}
                  width={800}
                  height={1000}
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="w-full object-cover"
                />
              ) : (
                <PortraitPlaceholder />
              )}

              {/* La ficha solo aparece con datos reales. Mientras el nombre o
                  el titulo sean marcadores (`[Nombre del Arquitecto]`) no se
                  publica nada: un visitante no debe ver corchetes. */}
              {architectName ? (
                <dl className="mt-8 divide-y divide-line border-y border-line">
                  <div className="flex flex-col gap-1 py-4">
                    <dt className="eyebrow">{architectName}</dt>
                    {role ? (
                      <dd className="font-sans text-sm text-fg-muted">{role}</dd>
                    ) : null}
                  </div>
                </dl>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

/**
 * Marcador del retrato. En lugar de una silueta generica se dibuja una
 * seccion arquitectonica, coherente con el lenguaje del sitio y evidentemente
 * provisional.
 */
function PortraitPlaceholder() {
  return (
    <div className="relative aspect-4/5 w-full overflow-hidden border border-line bg-surface">
      <svg
        viewBox="0 0 400 500"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
        className="absolute inset-0 size-full text-fg"
      >
        <g strokeWidth="1" className="opacity-[0.08]">
          {Array.from({ length: 9 }, (_, index) => (
            <line
              key={`v-${index}`}
              x1={index * 50}
              y1="0"
              x2={index * 50}
              y2="500"
            />
          ))}
          {Array.from({ length: 11 }, (_, index) => (
            <line
              key={`h-${index}`}
              x1="0"
              y1={index * 50}
              x2="400"
              y2={index * 50}
            />
          ))}
        </g>
        <g strokeWidth="1.5" className="opacity-25">
          <path d="M80 420V210l120-90 120 90v210" />
          <path d="M80 210h240" />
          <path d="M150 420V300h100v120" />
          <path d="M200 120v90" />
        </g>
        <line
          x1="40"
          y1="420"
          x2="360"
          y2="420"
          strokeWidth="1.5"
          className="opacity-30"
        />
      </svg>
    </div>
  );
}
