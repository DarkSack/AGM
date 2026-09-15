import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { isLocale } from "@/config/site";
import { getHomeData, getSettings } from "@/data/queries";
import { routing } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/seo";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { OrganizationJsonLd } from "@/components/seo/JsonLd";
import { t as pick } from "@/types/content";

/**
 * La portada se genera de forma estatica y se revalida cada cinco minutos.
 *
 * Es el equilibrio entre servir HTML ya listo (LCP minimo, coste casi nulo) y
 * que un cambio hecho en el panel aparezca sin tener que redesplegar.
 */
export const revalidate = 300;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  setRequestLocale(locale);
  const settings = await getSettings();

  return buildPageMetadata({
    locale,
    pathname: "/",
    // Si falta la traduccion se usa el espanol en lugar de un titulo vacio.
    title: pick(settings.seo.title, locale),
    absoluteTitle: true,
    description: pick(settings.seo.description, locale),
    keywords:
      settings.seo.keywords[locale].length > 0
        ? settings.seo.keywords[locale]
        : settings.seo.keywords.es,
    ogImage: settings.seo.ogImage,
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  setRequestLocale(locale);
  const { settings, services, projects, blocks } = await getHomeData();

  return (
    <>
      <OrganizationJsonLd
        locale={locale}
        settings={settings}
        services={services}
        projects={projects}
      />

      <BlockRenderer
        blocks={blocks}
        settings={settings}
        services={services}
        projects={projects}
        locale={locale}
      />
    </>
  );
}
