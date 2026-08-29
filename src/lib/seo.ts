import type { Metadata } from "next";
import { LOCALES, siteUrl, type Locale } from "@/config/site";
import { getPathname } from "@/i18n/navigation";
import type { AppPathnames } from "@/i18n/routing";

/** Etiqueta `hreflang` completa por idioma. */
const HREFLANG: Record<Locale, string> = {
  es: "es-MX",
  en: "en",
};

interface AlternatesInput {
  pathname: AppPathnames;
  params?: Record<string, string>;
}

/**
 * URL absoluta de una ruta en un idioma concreto.
 *
 * Se apoya en `getPathname` de next-intl para que las rutas traducidas
 * (`/proyectos/x` frente a `/en/projects/x`) se generen desde la misma fuente
 * que usa la navegacion. Escribirlas a mano aqui seria la forma segura de que
 * el canonical y el enlace real acabaran divergiendo.
 */
export function absoluteUrl(
  locale: Locale,
  { pathname, params }: AlternatesInput,
): string {
  const path = getPathname({
    locale,
    // El tipado de next-intl exige el par exacto ruta/params; el objeto que
    // construimos lo cumple en tiempo de ejecucion.
    href: params ? ({ pathname, params } as never) : (pathname as never),
  });
  return `${siteUrl}${path}`;
}

/**
 * Canonical + hreflang para las dos versiones de idioma.
 *
 * `x-default` apunta al espanol porque es el idioma principal del despacho y
 * el que se sirve en la raiz del dominio.
 */
export function buildAlternates(
  locale: Locale,
  input: AlternatesInput,
): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = {};
  for (const code of LOCALES) {
    languages[HREFLANG[code]] = absoluteUrl(code, input);
  }
  languages["x-default"] = absoluteUrl("es", input);

  return {
    canonical: absoluteUrl(locale, input),
    languages,
  };
}

interface PageMetadataInput extends AlternatesInput {
  locale: Locale;
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string | null;
  /** `false` en paginas que no deben indexarse (panel, vistas previas). */
  index?: boolean;
  /**
   * La portada ya lleva el nombre del despacho en su titulo, asi que no debe
   * pasar por la plantilla `%s · AGM...` del layout y repetirlo.
   */
  absoluteTitle?: boolean;
  type?: "website" | "article";
}

export function buildPageMetadata({
  locale,
  title,
  description,
  keywords,
  ogImage,
  index = true,
  absoluteTitle = false,
  type = "website",
  pathname,
  params,
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(locale, { pathname, params });
  const images = ogImage
    ? [{ url: ogImage.startsWith("http") ? ogImage : `${siteUrl}${ogImage}` }]
    : undefined;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    keywords: keywords && keywords.length > 0 ? keywords : undefined,
    alternates: buildAlternates(locale, { pathname, params }),
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      type,
      url,
      title,
      description,
      siteName: "AGM Diseño y Proyección",
      locale: HREFLANG[locale].replace("-", "_"),
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images: images?.map((image) => image.url),
    },
  };
}
