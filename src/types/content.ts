import type { Locale } from "@/config/site";

/** Texto que existe en los dos idiomas del sitio. */
export type Localized = Record<Locale, string>;

export function t(value: Localized, locale: Locale): string {
  return value[locale] || value.es;
}

export type PublishStatus = "draft" | "published" | "archived";

export type ProjectCategory =
  | "residential"
  | "commercial"
  | "remodeling"
  | "maintenance"
  | "executive"
  | "other";

export interface ProjectImage {
  id: string;
  url: string;
  alt: Localized;
  /** Orden dentro de la galeria. */
  position: number;
  width: number | null;
  height: number | null;
}

export interface Project {
  id: string;
  slug: string;
  title: Localized;
  /** Resumen para las tarjetas del grid. */
  summary: Localized;
  /** Texto largo de la pagina de detalle. */
  description: Localized;
  category: ProjectCategory;
  location: Localized;
  year: string | null;
  client: Localized | null;
  area: string | null;
  status: PublishStatus;
  featured: boolean;
  /**
   * Marca los proyectos que no son obra real de AGM. Cuando es true la UI
   * muestra la etiqueta "Proyecto conceptual" de forma visible.
   */
  isConcept: boolean;
  coverImage: ProjectImage | null;
  gallery: ProjectImage[];
  tags: string[];
  seo: EntitySeo;
  updatedAt: string;
}

export interface Service {
  id: string;
  slug: string;
  title: Localized;
  description: Localized;
  /** Clave del icono en `components/ui/ServiceIcon`. */
  icon: string;
  position: number;
  active: boolean;
}

export interface MethodStep {
  id: string;
  /** "01", "02"... Se muestra como numeral editorial. */
  number: string;
  title: Localized;
  description: Localized;
  position: number;
}

export interface ValueItem {
  id: string;
  title: Localized;
  description: Localized;
  position: number;
}

export interface EntitySeo {
  title: Partial<Localized>;
  description: Partial<Localized>;
  /** Ruta absoluta o URL completa de la imagen Open Graph. */
  ogImage: string | null;
}

export interface HeroContent {
  eyebrow: Localized;
  title: Localized;
  subtitle: Localized;
  primaryCta: { label: Localized; href: string };
  secondaryCta: { label: Localized; href: string };
  image: { url: string; alt: Localized } | null;
}

export interface AboutContent {
  /** Marcador hasta recibir la biografia real. */
  architectName: string;
  role: Localized;
  intro: Localized;
  body: Localized[];
  philosophy: Localized;
  portrait: { url: string; alt: Localized } | null;
}

export interface SiteSettings {
  hero: HeroContent;
  about: AboutContent;
  method: MethodStep[];
  values: ValueItem[];
  seo: {
    title: Localized;
    description: Localized;
    keywords: Record<Locale, string[]>;
    ogImage: string | null;
  };
  /** Datos de contacto administrables. Sobreescriben `siteConfig` si existen. */
  contact: {
    phone: string | null;
    email: string | null;
    facebookUrl: string | null;
    instagramUrl: string | null;
    addressLine: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    openingHours: string[] | null;
  };
  updatedAt: string;
}

/* ------------------------------------------------------------------ *
 * Content blocks
 *
 * El panel compone la pagina ordenando bloques de un catalogo cerrado.
 * Cada tipo tiene una forma de datos concreta y un componente que la
 * renderiza: no existe ninguna via para inyectar HTML ni JS arbitrario.
 * ------------------------------------------------------------------ */

export const BLOCK_TYPES = [
  "hero",
  "about",
  "services",
  "projects",
  "featuredProject",
  "method",
  "values",
  "stats",
  "quote",
  "text",
  "image",
  "imageGrid",
  "cta",
  "divider",
  "contact",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

interface BlockBase<T extends BlockType, D> {
  id: string;
  type: T;
  position: number;
  enabled: boolean;
  data: D;
}

export type ContentBlock =
  | BlockBase<"hero", Record<string, never>>
  | BlockBase<"about", Record<string, never>>
  | BlockBase<"services", Record<string, never>>
  | BlockBase<"projects", Record<string, never>>
  | BlockBase<"method", Record<string, never>>
  | BlockBase<"values", Record<string, never>>
  | BlockBase<"contact", Record<string, never>>
  | BlockBase<"divider", Record<string, never>>
  | BlockBase<"featuredProject", { projectSlug: string }>
  | BlockBase<"stats", { items: { label: Localized; value: string }[] }>
  | BlockBase<"quote", { text: Localized; author: string | null }>
  | BlockBase<"text", { heading: Localized | null; body: Localized }>
  | BlockBase<"image", { url: string; alt: Localized; caption: Localized | null }>
  | BlockBase<"imageGrid", { images: { url: string; alt: Localized }[] }>
  | BlockBase<
      "cta",
      { heading: Localized; body: Localized | null; label: Localized; href: string }
    >;

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  projectType: string;
  message: string;
  locale: Locale;
  read: boolean;
  createdAt: string;
}
