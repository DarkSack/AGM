import { siteConfig, siteUrl, type Locale } from "@/config/site";
import { resolveContact } from "@/lib/contactInfo";
import { absoluteUrl } from "@/lib/seo";
import { t as pick, type Project, type Service, type SiteSettings } from "@/types/content";

/**
 * Datos estructurados.
 *
 * Regla de oro: no se declara nada que no este confirmado. Direccion,
 * coordenadas, horarios, valoraciones, premios y numero de empleados se omiten
 * mientras sean marcadores. Un dato inventado en JSON-LD no solo no ayuda al
 * SEO local: puede acarrear una accion manual de Google por marcado engañoso.
 */

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/** Elimina claves nulas para no emitir propiedades vacias en el grafo. */
function compact(input: Record<string, JsonValue | undefined>): JsonValue {
  const output: Record<string, JsonValue> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    output[key] = value;
  }
  return output;
}

interface JsonLdProps {
  locale: Locale;
  settings: SiteSettings;
  services: Service[];
  projects: Project[];
}

export function OrganizationJsonLd({
  locale,
  settings,
  services,
  projects,
}: JsonLdProps) {
  const contact = resolveContact(settings);
  const businessId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;

  const sameAs = [contact.facebookUrl, contact.instagramUrl].filter(
    (url): url is string => Boolean(url),
  );

  // La direccion solo se publica cuando esta verificada.
  const address =
    !contact.locationPending && contact.cityLine
      ? compact({
          "@type": "PostalAddress",
          streetAddress: contact.streetAddress,
          addressLocality: settings.contact.city ?? siteConfig.location.city,
          addressRegion: settings.contact.state ?? siteConfig.location.state,
          postalCode: contact.postalCode,
          addressCountry: siteConfig.location.countryCode,
        })
      : undefined;

  const business = compact({
    "@type": ["ProfessionalService", "LocalBusiness"],
    "@id": businessId,
    name: siteConfig.name,
    description: pick(settings.seo.description, locale),
    url: siteUrl,
    telephone: contact.phoneHref.replace("tel:", ""),
    email: contact.email,
    address,
    // `areaServed` con marcador no aporta nada: se omite hasta tener la ciudad.
    areaServed: contact.locationPending ? undefined : contact.cityLine,
    openingHours: contact.openingHours ?? undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    knowsAbout: services.map((service) => pick(service.title, locale)),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: pick(settings.seo.title, locale),
      itemListElement: services.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: pick(service.title, locale),
          description: pick(service.description, locale),
        },
      })),
    },
  });

  const website = compact({
    "@type": "WebSite",
    "@id": websiteId,
    url: siteUrl,
    name: siteConfig.name,
    inLanguage: locale,
    publisher: { "@id": businessId },
  });

  const webPage = compact({
    "@type": "WebPage",
    "@id": `${absoluteUrl(locale, { pathname: "/" })}#webpage`,
    url: absoluteUrl(locale, { pathname: "/" }),
    name: pick(settings.seo.title, locale),
    description: pick(settings.seo.description, locale),
    inLanguage: locale,
    isPartOf: { "@id": websiteId },
    about: { "@id": businessId },
  });

  /**
   * Los proyectos conceptuales se declaran como `CreativeWork`, nunca como
   * obra ejecutada por el despacho: no llevan `creator` ni `provider`.
   */
  const collection = compact({
    "@type": "CollectionPage",
    "@id": `${absoluteUrl(locale, { pathname: "/" })}#proyectos`,
    name: pick(settings.seo.title, locale),
    hasPart: projects.map((project) =>
      compact({
        "@type": "CreativeWork",
        name: pick(project.title, locale),
        abstract: pick(project.summary, locale),
        url: absoluteUrl(locale, {
          pathname: "/proyectos/[slug]",
          params: { slug: project.slug },
        }),
        creativeWorkStatus: project.isConcept ? "Concept" : undefined,
        creator: project.isConcept ? undefined : { "@id": businessId },
      }),
    ),
  });

  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@graph": [business, website, webPage, collection],
      }}
    />
  );
}

export function ProjectJsonLd({
  locale,
  project,
  breadcrumb,
}: {
  locale: Locale;
  project: Project;
  breadcrumb: { name: string; url: string }[];
}) {
  const work = compact({
    "@type": "CreativeWork",
    name: pick(project.title, locale),
    description: pick(project.description, locale) || pick(project.summary, locale),
    inLanguage: locale,
    url: absoluteUrl(locale, {
      pathname: "/proyectos/[slug]",
      params: { slug: project.slug },
    }),
    image: project.coverImage
      ? project.coverImage.url.startsWith("http")
        ? project.coverImage.url
        : `${siteUrl}${project.coverImage.url}`
      : undefined,
    creativeWorkStatus: project.isConcept ? "Concept" : undefined,
    creator: project.isConcept ? undefined : { "@id": `${siteUrl}/#organization` },
    // El ano es un marcador mientras no haya obra real; solo se declara si es
    // un ano de verdad.
    dateCreated: project.year && /^\d{4}$/.test(project.year) ? project.year : undefined,
    keywords: project.tags.length > 0 ? project.tags.join(", ") : undefined,
  });

  const breadcrumbList = {
    "@type": "BreadcrumbList",
    itemListElement: breadcrumb.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  } satisfies JsonValue;

  return (
    <JsonLdScript
      data={{ "@context": "https://schema.org", "@graph": [work, breadcrumbList] }}
    />
  );
}

/**
 * `</script>` dentro de una cadena cerraria la etiqueta antes de tiempo y
 * permitiria inyectar marcado. Se escapa la barra, que es la forma estandar de
 * serializar JSON-LD sin abrir ese agujero.
 */
function JsonLdScript({ data }: { data: JsonValue }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
  );
}
