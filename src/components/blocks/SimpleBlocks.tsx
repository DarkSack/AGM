import { getTranslations } from "next-intl/server";
import type { Locale } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { ArrowRight, buttonClasses } from "@/components/ui/Button";
import { MediaImage } from "@/components/ui/MediaImage";
import { t as pick, type ContentBlock, type Project } from "@/types/content";

/**
 * Bloques opcionales que el despacho puede insertar desde el panel.
 *
 * Cada tipo tiene su componente y sus campos. En ningun caso se interpreta
 * HTML ni se ejecuta codigo procedente de la base de datos: los textos entran
 * como hijos de React, que escapa por defecto, y las URL se filtran con
 * `safeHref`.
 */

/**
 * Solo se permiten rutas internas y http(s).
 *
 * Bloquea `javascript:`, `data:` y `vbscript:`, que serian una via de XSS si
 * alguien con acceso al panel (o una fila manipulada) colase una URL asi en el
 * destino de un boton.
 */
function safeHref(href: string): string {
  const value = href.trim();
  if (value.startsWith("/") || value.startsWith("#")) return value;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? value : "#";
  } catch {
    return "#";
  }
}

type BlockOf<T extends ContentBlock["type"]> = Extract<ContentBlock, { type: T }>;

export function TextBlock({
  block,
  locale,
}: {
  block: BlockOf<"text">;
  locale: Locale;
}) {
  return (
    <div className="section-y">
      <div className="container-editorial">
        <div className="max-w-[68ch]">
          {block.data.heading ? (
            <h2 className="text-h2 text-fg" data-reveal>
              {pick(block.data.heading, locale)}
            </h2>
          ) : null}
          <p
            className="mt-6 text-lead whitespace-pre-line text-fg-muted"
            data-reveal
          >
            {pick(block.data.body, locale)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function QuoteBlock({
  block,
  locale,
}: {
  block: BlockOf<"quote">;
  locale: Locale;
}) {
  return (
    <div className="section-y">
      <div className="container-editorial">
        <figure className="mx-auto max-w-[44ch] text-center" data-reveal>
          <blockquote className="font-display text-h2 text-fg">
            {pick(block.data.text, locale)}
          </blockquote>
          {block.data.author ? (
            <figcaption className="eyebrow mt-6">{block.data.author}</figcaption>
          ) : null}
        </figure>
      </div>
    </div>
  );
}

export function StatsBlock({
  block,
  locale,
}: {
  block: BlockOf<"stats">;
  locale: Locale;
}) {
  const items = block.data.items ?? [];
  if (items.length === 0) return null;

  return (
    <div className="section-y">
      <div className="container-editorial">
        <dl className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex flex-col border-t border-line pt-6"
              data-reveal
              style={
                { "--reveal-delay": `${index * 60}ms` } as React.CSSProperties
              }
            >
              <dt className="eyebrow order-2 mt-3">{pick(item.label, locale)}</dt>
              <dd className="order-1 font-display text-h1 text-fg">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

export function ImageBlock({
  block,
  locale,
}: {
  block: BlockOf<"image">;
  locale: Locale;
}) {
  return (
    <div className="section-y">
      <div className="container-editorial">
        <figure data-reveal>
          <div className="aspect-16/9 w-full overflow-hidden bg-bg-alt">
            <MediaImage
              src={block.data.url}
              alt={pick(block.data.alt, locale)}
              width={1920}
              height={1080}
              sizes="(max-width: 1440px) 100vw, 1440px"
            />
          </div>
          {block.data.caption ? (
            <figcaption className="mt-4 font-sans text-xs text-fg-subtle">
              {pick(block.data.caption, locale)}
            </figcaption>
          ) : null}
        </figure>
      </div>
    </div>
  );
}

export function ImageGridBlock({
  block,
  locale,
}: {
  block: BlockOf<"imageGrid">;
  locale: Locale;
}) {
  const images = block.data.images ?? [];
  if (images.length === 0) return null;

  return (
    <div className="section-y">
      <div className="container-editorial">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => (
            <div
              key={index}
              className="aspect-4/3 overflow-hidden bg-bg-alt"
              data-reveal
              style={
                {
                  "--reveal-delay": `${Math.min(index, 5) * 60}ms`,
                } as React.CSSProperties
              }
            >
              <MediaImage
                src={image.url}
                alt={pick(image.alt, locale)}
                width={1200}
                height={900}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CtaBlock({
  block,
  locale,
}: {
  block: BlockOf<"cta">;
  locale: Locale;
}) {
  return (
    <div className="section-y bg-bg-alt">
      <div className="container-editorial">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[38ch]" data-reveal>
            <h2 className="text-h2 text-fg">{pick(block.data.heading, locale)}</h2>
            {block.data.body ? (
              <p className="mt-4 text-lead text-fg-muted">
                {pick(block.data.body, locale)}
              </p>
            ) : null}
          </div>

          <a
            href={safeHref(block.data.href)}
            className={buttonClasses("solid", "lg", "group shrink-0")}
            data-reveal
          >
            {pick(block.data.label, locale)}
            <ArrowRight />
          </a>
        </div>
      </div>
    </div>
  );
}

export function DividerBlock() {
  return (
    <div className="container-editorial">
      <hr className="border-0 hairline" />
    </div>
  );
}

export async function FeaturedProjectBlock({
  block,
  locale,
  projects,
}: {
  block: BlockOf<"featuredProject">;
  locale: Locale;
  projects: Project[];
}) {
  const t = await getTranslations("projects");
  const project = projects.find((item) => item.slug === block.data.projectSlug);

  // Si el proyecto se despublica o se borra, el bloque desaparece en lugar de
  // dejar un hueco roto en la pagina.
  if (!project) return null;

  return (
    <div className="section-y">
      <div className="container-editorial">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7" data-reveal>
            <div className="aspect-4/3 w-full overflow-hidden bg-bg-alt">
              {project.coverImage ? (
                <MediaImage
                  src={project.coverImage.url}
                  alt={pick(project.coverImage.alt, locale)}
                  width={project.coverImage.width ?? 1600}
                  height={project.coverImage.height ?? 1200}
                  sizes="(max-width: 1024px) 100vw, 58vw"
                />
              ) : null}
            </div>
          </div>

          <div className="lg:col-span-5" data-reveal>
            {project.isConcept ? (
              <span className="eyebrow">{t("conceptBadge")}</span>
            ) : null}
            <h2 className="mt-3 text-h2 text-fg">{pick(project.title, locale)}</h2>
            <p className="mt-5 max-w-[46ch] text-lead text-fg-muted">
              {pick(project.summary, locale)}
            </p>
            <Link
              href={{ pathname: "/proyectos/[slug]", params: { slug: project.slug } }}
              className={buttonClasses("outline", "md", "group mt-8")}
            >
              {t("viewDetail")}
              <ArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
