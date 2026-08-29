import { cache } from "react";
import { defaultBlocks } from "@/content/blocks";
import { defaultProjects } from "@/content/projects";
import { defaultServices } from "@/content/services";
import { defaultSettings } from "@/content/settings";
import { getPublicSupabase } from "@/lib/supabase/public";
import type { ContentBlock, Project, Service, SiteSettings } from "@/types/content";
import { mapContentBlock, mapProject, mapService, mapSettings } from "./mappers";

/**
 * Lecturas del sitio publico.
 *
 * Todas siguen el mismo contrato: si no hay backend configurado, o si la
 * consulta falla, se devuelve el contenido de `src/content`. La pagina nunca
 * se cae por un problema de base de datos, solo deja de reflejar los ultimos
 * cambios del panel.
 *
 * `cache()` deduplica las llamadas dentro de una misma peticion, de forma que
 * renderizar varias secciones que necesitan los proyectos solo consulta una vez.
 */

function warn(scope: string, error: unknown): void {
  console.warn(`[data] ${scope} — se usa el contenido por defecto:`, error);
}

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const supabase = getPublicSupabase();
  if (!supabase) return defaultSettings;

  const { data, error } = await supabase
    .from("site_settings")
    .select("data, updated_at")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    warn("site_settings", error.message);
    return defaultSettings;
  }
  if (!data) return defaultSettings;

  const settings = mapSettings(data.data);
  return { ...settings, updatedAt: data.updated_at ?? settings.updatedAt };
});

export const getServices = cache(async (): Promise<Service[]> => {
  const supabase = getPublicSupabase();
  if (!supabase) return defaultServices;

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("active", true)
    .order("position", { ascending: true });

  if (error) {
    warn("services", error.message);
    return defaultServices;
  }

  const services = (data ?? [])
    .map(mapService)
    .filter((service): service is Service => service !== null);

  return services.length > 0 ? services : defaultServices;
});

export const getPublishedProjects = cache(async (): Promise<Project[]> => {
  const supabase = getPublicSupabase();
  if (!supabase) return defaultProjects;

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("status", "published")
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    warn("projects", error.message);
    return defaultProjects;
  }

  const projects = (data ?? [])
    .map(mapProject)
    .filter((project): project is Project => project !== null);

  return projects.length > 0 ? projects : defaultProjects;
});

export const getProjectBySlug = cache(
  async (slug: string): Promise<Project | null> => {
    const projects = await getPublishedProjects();
    return projects.find((project) => project.slug === slug) ?? null;
  },
);

export const getBlocks = cache(async (): Promise<ContentBlock[]> => {
  const supabase = getPublicSupabase();
  if (!supabase) return defaultBlocks;

  const { data, error } = await supabase
    .from("content_blocks")
    .select("*")
    .eq("enabled", true)
    .order("position", { ascending: true });

  if (error) {
    warn("content_blocks", error.message);
    return defaultBlocks;
  }

  const blocks = (data ?? [])
    .map(mapContentBlock)
    .filter((block): block is ContentBlock => block !== null);

  return blocks.length > 0 ? blocks : defaultBlocks;
});

/** Conjunto completo que necesita la portada, resuelto en paralelo. */
export const getHomeData = cache(async () => {
  const [settings, services, projects, blocks] = await Promise.all([
    getSettings(),
    getServices(),
    getPublishedProjects(),
    getBlocks(),
  ]);
  return { settings, services, projects, blocks };
});
