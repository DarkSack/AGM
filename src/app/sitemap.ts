import type { MetadataRoute } from "next";
import { LOCALES } from "@/config/site";
import { getPublishedProjects, getSettings } from "@/data/queries";
import { privacyText } from "@/lib/privacy";
import { HREFLANG, absoluteUrl } from "@/lib/seo";
import type { AppPathnames } from "@/i18n/routing";

/**
 * sitemap.xml.
 *
 * Cada URL se declara una sola vez (en espanol, el idioma canonico) con sus
 * alternativas de idioma en `alternates.languages`. Declarar ademas la version
 * inglesa como entrada propia duplicaria las URL y es justo lo que Google pide
 * evitar en un sitio multiidioma.
 *
 * El aviso de privacidad solo se incluye cuando tiene su texto definitivo.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, settings] = await Promise.all([
    getPublishedProjects(),
    getSettings(),
  ]);

  const entry = (
    pathname: AppPathnames,
    params: Record<string, string> | undefined,
    lastModified: Date,
    priority: number,
  ): MetadataRoute.Sitemap[number] => {
    const languages: Record<string, string> = {};
    // Los mismos codigos (`es-MX`, `en`) que las etiquetas hreflang de cada
    // pagina: antes aqui se usaba `es` y las dos senales no coincidian.
    for (const locale of LOCALES) {
      languages[HREFLANG[locale]] = absoluteUrl(locale, { pathname, params });
    }
    // Version a la que Google debe mandar a quien no encaje con ningun idioma.
    languages["x-default"] = absoluteUrl("es", { pathname, params });

    return {
      url: absoluteUrl("es", { pathname, params }),
      lastModified,
      changeFrequency: "monthly",
      priority,
      alternates: { languages },
    };
  };

  const lastProjectUpdate = projects.reduce<Date>((latest, project) => {
    const updated = new Date(project.updatedAt);
    return Number.isNaN(updated.getTime()) || updated < latest ? latest : updated;
  }, new Date(0));

  const home = entry(
    "/",
    undefined,
    lastProjectUpdate.getTime() > 0 ? lastProjectUpdate : new Date(),
    1,
  );

  const projectPages = projects.map((project) =>
    entry(
      "/proyectos/[slug]",
      { slug: project.slug },
      new Date(project.updatedAt),
      0.7,
    ),
  );

  // El aviso de privacidad entra solo cuando el despacho ha escrito el texto
  // real; el provisional va con `noindex`.
  const privacy = privacyText(settings, "es")
    ? [entry("/aviso-de-privacidad", undefined, new Date(settings.updatedAt), 0.2)]
    : [];

  return [home, ...projectPages, ...privacy];
}
