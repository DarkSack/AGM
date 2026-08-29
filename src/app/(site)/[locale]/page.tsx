import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { isLocale } from "@/config/site";
import { getHomeData, getSettings } from "@/data/queries";
import { routing } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/seo";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { OrganizationJsonLd } from "@/components/seo/JsonLd";

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
    title: settings.seo.title[locale],
    absoluteTitle: true,
    description: settings.seo.description[locale],
    keywords: settings.seo.keywords[locale],
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
