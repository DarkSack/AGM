import { getTranslations } from "next-intl/server";
import type { Locale } from "@/config/site";
import { Section, SectionHeading } from "@/components/ui/Section";
import { t as pick, type SiteSettings } from "@/types/content";

interface MethodProps {
  steps: SiteSettings["method"];
  locale: Locale;
  /** Numeral editorial segun la posicion en la pagina. */
  index: string;
}

/**
 * Metodo de trabajo.
 *
 * Recorrido vertical con un eje continuo: cada etapa es una parada marcada
 * sobre la linea, con el numeral en gran tamano como ancla visual. Se lee de
 * arriba abajo igual que avanza un proyecto.
 */
export async function Method({ steps, locale, index }: MethodProps) {
  const t = await getTranslations("method");

  return (
    <Section id="metodo" labelledBy="metodo-title">
      <div className="container-editorial">
        <SectionHeading
          id="metodo-title"
          index={index}
          eyebrow={t("eyebrow")}
          title={t("title")}
          intro={t("intro")}
        />

        <ol className="relative mt-16 lg:mt-20">
          {/* Eje del recorrido. Se detiene antes del ultimo punto para no
              sobresalir por debajo de la lista. */}
          <span
            aria-hidden="true"
            className="absolute top-2 bottom-16 left-[7px] w-px bg-line md:left-[calc(6rem+7px)]"
          />

          {steps.map((step, index) => (
            <li
              key={step.id}
              className="relative grid grid-cols-1 gap-x-10 gap-y-3 border-b border-line pb-10 pl-10 last:border-b-0 md:grid-cols-[6rem_1fr] md:pl-0 lg:grid-cols-[6rem_18rem_1fr]"
              data-reveal
              style={
                {
                  "--reveal-delay": `${Math.min(index, 5) * 70}ms`,
                } as React.CSSProperties
              }
            >
              {/* Punto sobre el eje. */}
              <span
                aria-hidden="true"
                className="absolute top-2 left-0 size-[15px] rounded-full border border-line-strong bg-bg md:left-24"
              >
                <span className="absolute inset-[3px] rounded-full bg-accent" />
              </span>

              <div className="md:pt-0">
                <span className="font-display text-4xl leading-none text-fg-subtle md:text-5xl">
                  {step.number}
                </span>
              </div>

              <h3 className="text-h3 text-fg">
                {pick(step.title, locale)}
              </h3>

              <p className="max-w-[52ch] text-sm leading-relaxed text-fg-muted md:col-start-2 lg:col-start-3">
                {pick(step.description, locale)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
