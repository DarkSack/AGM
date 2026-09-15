import { getTranslations } from "next-intl/server";
import type { Locale } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { publicText } from "@/lib/placeholder";
import { MediaImage } from "@/components/ui/MediaImage";
import { t as pick, type Project } from "@/types/content";

/**
 * Ficha de proyecto.
 *
 * Vive en su propio componente porque la usan dos rutas: la publica y la vista
 * previa del panel. Compartirlo es lo que hace que la vista previa sirva de
 * algo — si fueran dos maquetaciones distintas, aprobar en una no garantizaria
 * nada sobre la otra.
 *
 * `getTranslations` recibe el idioma de forma explicita para poder llamarse
 * desde el panel, que esta fuera del segmento `[locale]`.
 */
export async function ProjectArticle({
  project,
  locale,
  showBackLink = true,
}: {
  project: Project;
  locale: Locale;
  showBackLink?: boolean;
}) {
  const t = await getTranslations({ locale, namespace: "projects" });
  const title = pick(project.title, locale);

  // `publicText` descarta vacios y marcadores pendientes (`[AÑO]`,
  // `[CIUDAD]`...): una ficha con menos datos es mejor que una con corchetes.
  const meta = [
    { label: t("meta.category"), value: t(`categories.${project.category}`) },
    { label: t("meta.location"), value: publicText(pick(project.location, locale)) },
    { label: t("meta.year"), value: publicText(project.year) },
    {
      label: t("meta.client"),
      value: project.client ? publicText(pick(project.client, locale)) : null,
    },
    { label: t("meta.area"), value: publicText(project.area) },
  ].filter((item) => Boolean(item.value));

  return (
    <article className="pt-28 pb-24 md:pt-36">
      <div className="container-editorial">
        {showBackLink ? (
          <Link
            // Vuelve a la seccion de proyectos, no al principio de la portada.
            href={{ pathname: "/", hash: "proyectos" }}
            className="inline-flex items-center gap-2 font-sans text-sm text-fg-muted transition-colors hover:text-fg"
          >
            <span aria-hidden="true">&larr;</span>
            {t("backToProjects")}
          </Link>
        ) : null}

        <header className="mt-10 max-w-[52rem]">
          {project.isConcept ? (
            <span className="eyebrow inline-block border border-line px-3 py-1.5">
              {t("conceptBadge")}
            </span>
          ) : null}

          <h1 className="mt-5 text-h1 text-fg">{title}</h1>

          <p className="mt-6 max-w-[54ch] text-lead text-fg-muted">
            {pick(project.summary, locale)}
          </p>
        </header>
      </div>

      {project.coverImage ? (
        <div className="mt-14 md:mt-16">
          <div className="container-editorial">
            <div className="aspect-16/9 w-full overflow-hidden bg-bg-alt">
              <MediaImage
                src={project.coverImage.url}
                alt={pick(project.coverImage.alt, locale)}
                width={project.coverImage.width ?? 1600}
                height={project.coverImage.height ?? 1200}
                sizes="(max-width: 1440px) 100vw, 1440px"
                priority
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="container-editorial mt-14 md:mt-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            {meta.length > 0 ? (
              <dl className="divide-y divide-line border-y border-line">
                {meta.map((item) => (
                  <div key={item.label} className="flex flex-col gap-1 py-4">
                    <dt className="eyebrow">{item.label}</dt>
                    <dd className="font-sans text-[0.9375rem] text-fg">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {project.tags.length > 0 ? (
              <ul className="mt-6 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <li
                    key={tag}
                    className="border border-line px-2.5 py-1 font-sans text-xs text-fg-muted"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="lg:col-span-7 lg:col-start-6">
            {project.isConcept ? (
              <p className="mb-8 border-l-2 border-accent py-3 pl-5 text-sm leading-relaxed text-fg-muted">
                {t("conceptNoticeSingle")}
              </p>
            ) : null}

            <div className="max-w-[62ch] text-base leading-[1.75] whitespace-pre-line text-fg-muted">
              {pick(project.description, locale)}
            </div>
          </div>
        </div>
      </div>

      {project.gallery.length > 0 ? (
        <section className="container-editorial mt-20" aria-labelledby="galeria">
          <h2 id="galeria" className="eyebrow font-sans">
            {t("gallery")}
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {project.gallery.map((image) => (
              <div
                key={image.id}
                className="aspect-4/3 overflow-hidden bg-bg-alt"
                data-reveal
              >
                <MediaImage
                  src={image.url}
                  alt={pick(image.alt, locale)}
                  width={image.width ?? 1200}
                  height={image.height ?? 900}
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
