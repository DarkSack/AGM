import { LOCALES } from "@/config/site";
import { defaultSettings } from "@/content/settings";
import {
  BLOCK_TYPES,
  type ContentBlock,
  type ContactMessage,
  type EntitySeo,
  type Project,
  type ProjectCategory,
  type ProjectImage,
  type PublishStatus,
  type Service,
  type SiteSettings,
} from "@/types/content";
import {
  asArray,
  asBoolean,
  asEnum,
  asLocalized,
  asLocalizedStringArrays,
  asNullableLocalized,
  asNullableNumber,
  asNullableString,
  asNumber,
  asPartialLocalized,
  asString,
  asStringArray,
  isRecord,
} from "@/lib/json";

const CATEGORIES: readonly ProjectCategory[] = [
  "residential",
  "commercial",
  "remodeling",
  "maintenance",
  "executive",
  "other",
];

const STATUSES: readonly PublishStatus[] = ["draft", "published", "archived"];

function mapImage(value: unknown, index: number): ProjectImage | null {
  if (!isRecord(value)) return null;
  const url = asNullableString(value.url);
  if (!url) return null;
  return {
    id: asString(value.id, `img-${index}`),
    url,
    alt: asLocalized(value.alt),
    position: asNumber(value.position, index),
    width: asNullableNumber(value.width),
    height: asNullableNumber(value.height),
  };
}

function mapSeo(value: unknown): EntitySeo {
  if (!isRecord(value)) return { title: {}, description: {}, ogImage: null };
  return {
    title: asPartialLocalized(value.title),
    description: asPartialLocalized(value.description),
    ogImage: asNullableString(value.ogImage ?? value.og_image),
  };
}

export function mapProject(row: unknown): Project | null {
  if (!isRecord(row)) return null;
  const slug = asNullableString(row.slug);
  const id = asNullableString(row.id);
  if (!slug || !id) return null;

  return {
    id,
    slug,
    title: asLocalized(row.title, slug),
    summary: asLocalized(row.summary),
    description: asLocalized(row.description),
    category: asEnum(row.category, CATEGORIES, "other"),
    location: asLocalized(row.location),
    year: asNullableString(row.year),
    client: asNullableLocalized(row.client),
    area: asNullableString(row.area),
    status: asEnum(row.status, STATUSES, "draft"),
    featured: asBoolean(row.featured),
    isConcept: asBoolean(row.is_concept),
    coverImage: mapImage(row.cover_image, 0),
    gallery: asArray(row.gallery)
      .map(mapImage)
      .filter((image): image is ProjectImage => image !== null)
      .sort((a, b) => a.position - b.position),
    tags: asStringArray(row.tags),
    seo: mapSeo(row.seo),
    previousSlugs: asStringArray(row.previous_slugs),
    updatedAt: asString(row.updated_at, new Date(0).toISOString()),
  };
}

export function mapService(row: unknown): Service | null {
  if (!isRecord(row)) return null;
  const id = asNullableString(row.id);
  const slug = asNullableString(row.slug);
  if (!id || !slug) return null;

  return {
    id,
    slug,
    title: asLocalized(row.title, slug),
    description: asLocalized(row.description),
    icon: asString(row.icon, "design"),
    position: asNumber(row.position),
    active: asBoolean(row.active, true),
  };
}

export function mapContactMessage(row: unknown): ContactMessage | null {
  if (!isRecord(row)) return null;
  const id = asNullableString(row.id);
  if (!id) return null;

  return {
    id,
    name: asString(row.name),
    email: asString(row.email),
    phone: asNullableString(row.phone),
    projectType: asString(row.project_type, "other"),
    message: asString(row.message),
    locale: asEnum(row.locale, LOCALES, "es"),
    read: asBoolean(row.read),
    createdAt: asString(row.created_at, new Date(0).toISOString()),
  };
}

export function mapContentBlock(row: unknown): ContentBlock | null {
  if (!isRecord(row)) return null;
  const id = asNullableString(row.id);
  const type = asNullableString(row.type);
  if (!id || !type || !(BLOCK_TYPES as readonly string[]).includes(type)) return null;

  // El `data` de cada tipo se valida en el componente que lo renderiza; aqui
  // solo se garantiza que sea un objeto y que el tipo pertenezca al catalogo.
  return {
    id,
    type,
    position: asNumber(row.position),
    enabled: asBoolean(row.enabled, true),
    data: isRecord(row.data) ? row.data : {},
  } as ContentBlock;
}

/**
 * Los ajustes se guardan como un unico jsonb. Se fusionan sobre los valores por
 * defecto para que anadir un campo nuevo al codigo no obligue a migrar la fila
 * existente ni deje huecos vacios en la pagina.
 */
export function mapSettings(data: unknown): SiteSettings {
  if (!isRecord(data)) return defaultSettings;

  const hero = isRecord(data.hero) ? data.hero : {};
  const heroPrimary = isRecord(hero.primaryCta) ? hero.primaryCta : {};
  const heroSecondary = isRecord(hero.secondaryCta) ? hero.secondaryCta : {};
  const heroImage = isRecord(hero.image) ? hero.image : null;

  const about = isRecord(data.about) ? data.about : {};
  const aboutPortrait = isRecord(about.portrait) ? about.portrait : null;

  const seo = isRecord(data.seo) ? data.seo : {};
  const contact = isRecord(data.contact) ? data.contact : {};

  const method = asArray(data.method)
    .map((item, index) => {
      if (!isRecord(item)) return null;
      return {
        id: asString(item.id, `step-${index}`),
        number: asString(item.number, String(index + 1).padStart(2, "0")),
        title: asLocalized(item.title),
        description: asLocalized(item.description),
        position: asNumber(item.position, index),
      };
    })
    .filter((item): item is SiteSettings["method"][number] => item !== null)
    .sort((a, b) => a.position - b.position);

  const values = asArray(data.values)
    .map((item, index) => {
      if (!isRecord(item)) return null;
      return {
        id: asString(item.id, `value-${index}`),
        title: asLocalized(item.title),
        description: asLocalized(item.description),
        position: asNumber(item.position, index),
      };
    })
    .filter((item): item is SiteSettings["values"][number] => item !== null)
    .sort((a, b) => a.position - b.position);

  const body = asArray(about.body)
    .map((item) => asLocalized(item))
    .filter((item) => LOCALES.some((locale) => item[locale].length > 0));

  return {
    hero: {
      eyebrow: hero.eyebrow ? asLocalized(hero.eyebrow) : defaultSettings.hero.eyebrow,
      title: hero.title ? asLocalized(hero.title) : defaultSettings.hero.title,
      subtitle: hero.subtitle
        ? asLocalized(hero.subtitle)
        : defaultSettings.hero.subtitle,
      primaryCta: {
        label: heroPrimary.label
          ? asLocalized(heroPrimary.label)
          : defaultSettings.hero.primaryCta.label,
        href: asString(heroPrimary.href, defaultSettings.hero.primaryCta.href),
      },
      secondaryCta: {
        label: heroSecondary.label
          ? asLocalized(heroSecondary.label)
          : defaultSettings.hero.secondaryCta.label,
        href: asString(heroSecondary.href, defaultSettings.hero.secondaryCta.href),
      },
      image: heroImage?.url
        ? { url: asString(heroImage.url), alt: asLocalized(heroImage.alt) }
        : null,
    },
    about: {
      architectName: asString(
        about.architectName,
        defaultSettings.about.architectName,
      ),
      role: about.role ? asLocalized(about.role) : defaultSettings.about.role,
      intro: about.intro ? asLocalized(about.intro) : defaultSettings.about.intro,
      body: body.length > 0 ? body : defaultSettings.about.body,
      philosophy: about.philosophy
        ? asLocalized(about.philosophy)
        : defaultSettings.about.philosophy,
      portrait: aboutPortrait?.url
        ? { url: asString(aboutPortrait.url), alt: asLocalized(aboutPortrait.alt) }
        : null,
    },
    method: method.length > 0 ? method : defaultSettings.method,
    values: values.length > 0 ? values : defaultSettings.values,
    seo: {
      title: seo.title ? asLocalized(seo.title) : defaultSettings.seo.title,
      description: seo.description
        ? asLocalized(seo.description)
        : defaultSettings.seo.description,
      keywords: seo.keywords
        ? asLocalizedStringArrays(seo.keywords)
        : defaultSettings.seo.keywords,
      ogImage: asNullableString(seo.ogImage),
    },
    contact: {
      phone: asNullableString(contact.phone),
      email: asNullableString(contact.email),
      facebookUrl: asNullableString(contact.facebookUrl),
      instagramUrl: asNullableString(contact.instagramUrl),
      addressLine: asNullableString(contact.addressLine),
      city: asNullableString(contact.city),
      state: asNullableString(contact.state),
      country: asNullableString(contact.country),
      openingHours: (() => {
        const hours = asStringArray(contact.openingHours);
        return hours.length > 0 ? hours : null;
      })(),
    },
    updatedAt: asString(data.updatedAt, defaultSettings.updatedAt),
  };
}
