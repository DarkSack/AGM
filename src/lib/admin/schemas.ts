import { z } from "zod";
import { LOCALES } from "@/config/site";
import { BLOCK_TYPES } from "@/types/content";
import { SLUG_PATTERN } from "@/lib/slug";

/**
 * Validacion de todo lo que el panel escribe en la base de datos.
 *
 * Estos esquemas corren en el servidor, dentro de las Server Actions. La
 * validacion del navegador (atributos `required`, `maxlength`) es solo ayuda
 * visual: una Server Action se puede invocar directamente, asi que lo que
 * decide es esto.
 *
 * Los limites reproducen los CHECK de `supabase/schema.sql` para que el error
 * se explique en castellano aqui, en vez de llegar como un fallo de Postgres.
 */

const localized = z.object(
  Object.fromEntries(
    LOCALES.map((locale) => [locale, z.string().trim().max(8000).default("")]),
  ) as Record<(typeof LOCALES)[number], z.ZodDefault<z.ZodString>>,
);

const localizedRequired = localized.refine(
  (value) => value.es.trim().length > 0,
  { message: "El texto en español es obligatorio." },
);

const imageSchema = z.object({
  id: z.string().max(120),
  url: z.string().max(2000),
  alt: localized,
  position: z.number().int().min(0).max(500),
  width: z.number().int().positive().max(20000).nullable(),
  height: z.number().int().positive().max(20000).nullable(),
});

export const PROJECT_CATEGORIES = [
  "residential",
  "commercial",
  "remodeling",
  "maintenance",
  "executive",
  "other",
] as const;

export const PUBLISH_STATUSES = ["draft", "published", "archived"] as const;

export const projectSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(2, "El slug es demasiado corto.")
    .max(96, "El slug es demasiado largo.")
    .regex(SLUG_PATTERN, "El slug solo admite minúsculas, números y guiones."),
  title: localizedRequired,
  summary: localized,
  description: localized,
  category: z.enum(PROJECT_CATEGORIES),
  location: localized,
  year: z.string().trim().max(20).nullable(),
  client: localized.nullable(),
  area: z.string().trim().max(60).nullable(),
  status: z.enum(PUBLISH_STATUSES),
  featured: z.boolean(),
  isConcept: z.boolean(),
  coverImage: imageSchema.nullable(),
  gallery: z.array(imageSchema).max(40),
  tags: z.array(z.string().trim().min(1).max(40)).max(20),
  seo: z.object({
    title: localized,
    description: localized,
    ogImage: z.string().max(2000).nullable(),
  }),
  position: z.number().int().min(0).max(9999),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;

export const serviceSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(2).max(96).regex(SLUG_PATTERN),
  title: localizedRequired,
  description: localized,
  icon: z.string().trim().min(1).max(40),
  position: z.number().int().min(0).max(999),
  active: z.boolean(),
});

export type ServiceFormValues = z.infer<typeof serviceSchema>;

const ctaSchema = z.object({
  label: localized,
  /**
   * Solo anclas internas o rutas del propio sitio. Impide que alguien con
   * acceso al panel deje un `javascript:` en el destino de un boton.
   */
  href: z
    .string()
    .trim()
    .max(300)
    .regex(/^[#/]/, "El destino debe empezar por # o por /"),
});

export const settingsSchema = z.object({
  hero: z.object({
    eyebrow: localized,
    title: localizedRequired,
    subtitle: localized,
    primaryCta: ctaSchema,
    secondaryCta: ctaSchema,
    image: z.object({ url: z.string().max(2000), alt: localized }).nullable(),
  }),
  about: z.object({
    architectName: z.string().trim().max(160),
    role: localized,
    intro: localized,
    body: z.array(localized).max(12),
    philosophy: localized,
    portrait: z.object({ url: z.string().max(2000), alt: localized }).nullable(),
  }),
  method: z
    .array(
      z.object({
        id: z.string().max(60),
        number: z.string().trim().max(6),
        title: localized,
        description: localized,
        position: z.number().int().min(0).max(99),
      }),
    )
    .max(20),
  values: z
    .array(
      z.object({
        id: z.string().max(60),
        title: localized,
        description: localized,
        position: z.number().int().min(0).max(99),
      }),
    )
    .max(20),
  seo: z.object({
    title: localized,
    description: localized,
    keywords: z.object(
      Object.fromEntries(
        LOCALES.map((locale) => [
          locale,
          z.array(z.string().trim().min(1).max(80)).max(25).default([]),
        ]),
      ) as Record<
        (typeof LOCALES)[number],
        z.ZodDefault<z.ZodArray<z.ZodString>>
      >,
    ),
    ogImage: z.string().max(2000).nullable(),
  }),
  contact: z.object({
    phone: z.string().trim().max(40).nullable(),
    email: z.string().trim().max(200).email().nullable().or(z.literal("")),
    facebookUrl: z.string().trim().url().max(500).nullable().or(z.literal("")),
    instagramUrl: z.string().trim().url().max(500).nullable().or(z.literal("")),
    addressLine: z.string().trim().max(300).nullable(),
    city: z.string().trim().max(120).nullable(),
    state: z.string().trim().max(120).nullable(),
    country: z.string().trim().max(120).nullable(),
    openingHours: z.array(z.string().trim().max(80)).max(14).nullable(),
  }),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;

export const blockSchema = z.object({
  id: z.string().max(60),
  type: z.enum(BLOCK_TYPES),
  position: z.number().int().min(0).max(999),
  enabled: z.boolean(),
  /**
   * `data` se valida por tipo en el componente que lo renderiza. Aqui solo se
   * exige que sea un objeto plano: no hay ningun tipo de bloque que acepte
   * HTML ni codigo, asi que no existe forma de inyectar nada desde el panel.
   */
  data: z.record(z.string(), z.unknown()),
});

export const blocksSchema = z.array(blockSchema).max(60);
