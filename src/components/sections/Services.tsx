import { getTranslations } from "next-intl/server";
import type { Locale } from "@/config/site";
import { ANALYTICS_EVENTS } from "@/lib/analytics";
import { ArrowRight, buttonClasses } from "@/components/ui/Button";
import { Section, SectionHeading } from "@/components/ui/Section";
import { ServiceIcon } from "@/components/ui/ServiceIcon";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { t as pick, type Service } from "@/types/content";

interface ServicesProps {
  services: Service[];
  locale: Locale;
}

/**
 * Servicios.
 *
 * Retícula de celdas separadas por filetes de 1px, sin tarjetas ni sombras: el
 * separador se obtiene con `gap-px` sobre un fondo de color de linea, lo que
 * mantiene el hilo perfectamente fino en cualquier numero de columnas y en
 * cualquier zoom, sin bordes duplicados.
 */
export async function Services({ services, locale }: ServicesProps) {
  const t = await getTranslations("services");

  return (
    <Section id="servicios" labelledBy="servicios-title">
      <div className="container-editorial">
        <SectionHeading
          id="servicios-title"
          index="02"
          eyebrow={t("eyebrow")}
          title={t("title")}
          intro={t("intro")}
        />

        <ul className="mt-14 grid gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
          {services.map((service, index) => (
            <li
              key={service.id}
              className="group relative flex flex-col bg-bg p-7 transition-colors duration-500 hover:bg-bg-alt lg:p-8"
              data-reveal
              style={
                {
                  "--reveal-delay": `${Math.min(index, 7) * 50}ms`,
                } as React.CSSProperties
              }
            >
              {/* Filete de acento que crece al pasar el cursor. */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px w-0 bg-accent transition-[width] duration-500 ease-out group-hover:w-full motion-reduce:transition-none"
              />

              <div className="flex items-start justify-between gap-4">
                <ServiceIcon
                  name={service.icon}
                  className="size-8 text-fg-muted transition-colors duration-500 group-hover:text-accent"
                />
                <span className="numeral">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <h3 className="mt-8 text-h3 text-fg">
                {pick(service.title, locale)}
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                {pick(service.description, locale)}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-12" data-reveal>
          <TrackedLink
            href="#contacto"
            event={ANALYTICS_EVENTS.quoteCtaClick}
            params={{ location: "services", locale }}
            className={buttonClasses("outline", "md", "group")}
          >
            {t("cta")}
            <ArrowRight />
          </TrackedLink>
        </div>
      </div>
    </Section>
  );
}
