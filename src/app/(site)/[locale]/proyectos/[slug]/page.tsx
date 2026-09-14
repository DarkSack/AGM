import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale } from "@/config/site";
import { getProjectBySlug, getPublishedProjects } from "@/data/queries";
import { routing } from "@/i18n/routing";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo";
import { ProjectArticle } from "@/components/sections/ProjectArticle";
import { ProjectJsonLd } from "@/components/seo/JsonLd";
import { t as pick } from "@/types/content";

export const revalidate = 300;
/**
 * Los slugs que no existian en el build se generan al vuelo. Con `false` un
 * proyecto publicado desde el panel daba 404 hasta el siguiente despliegue:
 * `revalidatePath` refresca paginas existentes, pero no crea rutas nuevas.
 *
 * Sigue sin poder leerse un borrador adivinando la URL: `getProjectBySlug`
 * usa el cliente anonimo, que por RLS solo ve lo publicado, y todo lo demas
 * acaba en `notFound()`. Para revisar un borrador esta la vista previa.
 */
export const dynamicParams = true;

export async function generateStaticParams() {
  const projects = await getPublishedProjects();
  return routing.locales.flatMap((locale) =>
    projects.map((project) => ({ locale, slug: project.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};

  setRequestLocale(locale);
  const project = await getProjectBySlug(slug);
  if (!project) return {};

  const t = await getTranslations({ locale, namespace: "projects" });
  const title = pick(project.title, locale);

  // Metadata propia si el despacho la ha escrito; si no, se deriva del
  // contenido del proyecto en lugar de dejarla vacia.
  const seoTitle = project.seo.title[locale] ?? title;
  const seoDescription =
    project.seo.description[locale] ?? pick(project.summary, locale);

  return buildPageMetadata({
    locale,
    pathname: "/proyectos/[slug]",
    params: { slug: project.slug },
    title: project.isConcept ? `${seoTitle} · ${t("conceptBadge")}` : seoTitle,
    description: seoDescription,
    ogImage: project.seo.ogImage ?? project.coverImage?.url ?? null,
    type: "article",
  });
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  setRequestLocale(locale);
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const breadcrumb = [
    { name: "AGM", url: absoluteUrl(locale, { pathname: "/" }) },
    {
      name: pick(project.title, locale),
      url: absoluteUrl(locale, {
        pathname: "/proyectos/[slug]",
        params: { slug: project.slug },
      }),
    },
  ];

  return (
    <>
      <ProjectJsonLd locale={locale} project={project} breadcrumb={breadcrumb} />
      <ProjectArticle project={project} locale={locale} />
    </>
  );
}
