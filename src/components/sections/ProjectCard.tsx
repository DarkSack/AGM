import { getTranslations } from "next-intl/server";
import type { Locale } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { publicText } from "@/lib/placeholder";
import { MediaImage } from "@/components/ui/MediaImage";
import { t as pick, type Project } from "@/types/content";

interface ProjectCardProps {
  project: Project;
  locale: Locale;
  /** Columnas que ocupa en la retícula de 12 en pantallas grandes. */
  span: 5 | 6 | 7;
  aspect: "4/3" | "3/4" | "16/10";
  /** La primera tarjeta se carga con prioridad; el resto en diferido. */
  priority?: boolean;
  delay?: number;
}

const spanClasses: Record<ProjectCardProps["span"], string> = {
  5: "lg:col-span-5",
  6: "lg:col-span-6",
  7: "lg:col-span-7",
};

const aspectClasses: Record<ProjectCardProps["aspect"], string> = {
  "4/3": "aspect-4/3",
  "3/4": "aspect-4/3 lg:aspect-3/4",
  "16/10": "aspect-16/10",
};

/** Anchos reales servidos en cada breakpoint, para no descargar de mas. */
const sizesBySpan: Record<ProjectCardProps["span"], string> = {
  5: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw",
  6: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 48vw",
  7: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 56vw",
};

export async function ProjectCard({
  project,
  locale,
  span,
  aspect,
  priority = false,
  delay = 0,
}: ProjectCardProps) {
  const t = await getTranslations("projects");
  const title = pick(project.title, locale);
  const cover = project.coverImage;

  return (
    <article
      className={cn("group relative", spanClasses[span])}
      data-reveal
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      <Link
        href={{ pathname: "/proyectos/[slug]", params: { slug: project.slug } }}
        // El enlace cubre toda la tarjeta mediante el pseudo-elemento, de modo
        // que hay un unico destino tabulable en lugar de imagen + titulo.
        className="after:absolute after:inset-0 after:content-['']"
      >
        <div
          className={cn(
            "relative w-full overflow-hidden bg-bg-alt",
            aspectClasses[aspect],
          )}
        >
          {cover ? (
            <MediaImage
              src={cover.url}
              alt={pick(cover.alt, locale)}
              width={cover.width ?? 1600}
              height={cover.height ?? 1200}
              sizes={sizesBySpan[span]}
              priority={priority}
              className="transition-transform duration-[900ms] ease-out group-hover:scale-[1.035] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          ) : (
            <div className="size-full bg-bg-alt" />
          )}

          {project.isConcept ? (
            <span className="absolute top-4 left-4 bg-bg/90 px-3 py-1.5 font-sans text-[0.625rem] font-medium tracking-[0.14em] text-fg uppercase backdrop-blur-sm">
              {t("conceptBadge")}
            </span>
          ) : null}

          {/* Oscurecido muy leve al pasar el cursor, sin tapar la imagen. */}
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-fg/0 transition-colors duration-500 group-hover:bg-fg/[0.06]"
          />
        </div>

        <div className="mt-5 flex items-start justify-between gap-6">
          <div>
            <h3 className="text-h3 text-fg transition-colors duration-300 group-hover:text-accent">
              {title}
            </h3>
            <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-fg-muted">
              {pick(project.summary, locale)}
            </p>
          </div>

          <span className="numeral shrink-0 pt-2 text-right">
            {t(`categories.${project.category}`)}
            {publicText(project.year) ? (
              <>
                <br />
                {publicText(project.year)}
              </>
            ) : null}
          </span>
        </div>
      </Link>
    </article>
  );
}
