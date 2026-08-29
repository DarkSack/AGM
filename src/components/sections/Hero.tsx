import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { siteConfig, type Locale } from "@/config/site";
import { ANALYTICS_EVENTS } from "@/lib/analytics";
import { buttonClasses, ArrowRight } from "@/components/ui/Button";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { t as pick } from "@/types/content";
import type { SiteSettings } from "@/types/content";
import { HeroBackdrop } from "./HeroBackdrop";

interface HeroProps {
  settings: SiteSettings;
  locale: Locale;
}

/**
 * Primera pantalla.
 *
 * El titular es el elemento mas grande y es texto, no una imagen: se pinta con
 * el HTML inicial y suele ser el LCP, que es exactamente lo que interesa. Las
 * animaciones de entrada solo afectan a opacidad y transform.
 */
export async function Hero({ settings, locale }: HeroProps) {
  const t = await getTranslations("hero");
  const { hero } = settings;
  const image = hero.image;

  return (
    <section
      id="inicio"
      className="relative flex min-h-[92svh] flex-col justify-end overflow-hidden pt-28 pb-14 md:min-h-svh md:pb-20"
    >
      {image ? (
        <div aria-hidden="true" className="absolute inset-0">
          <Image
            src={image.url}
            alt=""
            fill
            // El hero es el LCP: se pide con prioridad y sin lazy loading.
            priority
            sizes="100vw"
            className="object-cover"
          />
          {/* Velo para garantizar contraste AA del texto sobre cualquier foto. */}
          <div className="absolute inset-0 bg-linear-to-t from-bg via-bg/85 to-bg/45" />
        </div>
      ) : (
        <HeroBackdrop />
      )}

      <div className="container-editorial relative">
        <div className="max-w-[46rem] 3xl:max-w-[54rem]">
          <p
            className="eyebrow flex items-center gap-3"
            data-reveal
          >
            <span aria-hidden="true" className="h-px w-10 bg-line-strong" />
            {pick(hero.eyebrow, locale)}
          </p>

          <h1
            className="mt-7 text-display text-fg"
            data-reveal
            style={{ "--reveal-delay": "80ms" } as React.CSSProperties}
          >
            {pick(hero.title, locale)}
          </h1>

          <p
            className="mt-7 max-w-[52ch] text-lead text-fg-muted"
            data-reveal
            style={{ "--reveal-delay": "160ms" } as React.CSSProperties}
          >
            {pick(hero.subtitle, locale)}
          </p>

          <div
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
            data-reveal
            style={{ "--reveal-delay": "240ms" } as React.CSSProperties}
          >
            <TrackedLink
              href={hero.primaryCta.href}
              event={ANALYTICS_EVENTS.projectsCtaClick}
              params={{ location: "hero", locale }}
              className={buttonClasses("solid", "lg", "group w-full sm:w-auto")}
            >
              {pick(hero.primaryCta.label, locale)}
              <ArrowRight />
            </TrackedLink>

            <TrackedLink
              href={hero.secondaryCta.href}
              event={ANALYTICS_EVENTS.quoteCtaClick}
              params={{ location: "hero", locale }}
              className={buttonClasses("outline", "lg", "w-full sm:w-auto")}
            >
              {pick(hero.secondaryCta.label, locale)}
            </TrackedLink>
          </div>
        </div>

        <div
          className="mt-16 flex items-end justify-between gap-8 border-t border-line pt-6 md:mt-24"
          data-reveal
          style={{ "--reveal-delay": "320ms" } as React.CSSProperties}
        >
          <p className="eyebrow hidden sm:block">
            {siteConfig.name}
          </p>

          <p className="eyebrow flex items-center gap-3">
            {t("scrollHint")}
            <ScrollArrow />
          </p>
        </div>
      </div>
    </section>
  );
}

/** Flecha con un desplazamiento minimo y continuo que invita a bajar. */
function ScrollArrow() {
  return (
    <svg
      viewBox="0 0 16 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      aria-hidden="true"
      className="size-4 animate-bounce [animation-duration:2.4s] motion-reduce:animate-none"
    >
      <path d="M8 3v16M3 14l5 5 5-5" />
    </svg>
  );
}
