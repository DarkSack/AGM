import { defaultBlocks } from "@/content/blocks";
import { defaultSettings } from "@/content/settings";
import { mapContactMessage, mapContentBlock, mapProject, mapService, mapSettings } from "@/data/mappers";
import type {
  ContactMessage,
  ContentBlock,
  Project,
  Service,
  SiteSettings,
} from "@/types/content";
import { requireStaff } from "./auth";

/**
 * Lecturas del panel.
 *
 * A diferencia de las del sitio publico, usan el cliente con la sesion del
 * usuario: por eso ven los borradores y los servicios desactivados, que las
 * politicas RLS ocultan al rol anonimo.
 */

export async function listAllProjects(): Promise<Project[]> {
  const { supabase } = await requireStaff();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("position", { ascending: true })
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`No se pudieron cargar los proyectos: ${error.message}`);

  return (data ?? [])
    .map(mapProject)
    .filter((project): project is Project => project !== null);
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getProjectById(id: string): Promise<Project | null> {
  const { supabase } = await requireStaff();
  // Un id mal formado es "no existe" (404), no un fallo de Postgres que
  // acababa en la pagina de error.
  if (!UUID_PATTERN.test(id)) return null;
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`No se pudo cargar el proyecto: ${error.message}`);
  return data ? mapProject(data) : null;
}

export async function listAllServices(): Promise<Service[]> {
  const { supabase } = await requireStaff();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("position", { ascending: true });

  if (error) throw new Error(`No se pudieron cargar los servicios: ${error.message}`);

  return (data ?? [])
    .map(mapService)
    .filter((service): service is Service => service !== null);
}

export async function getAdminSettings(): Promise<SiteSettings> {
  const { supabase } = await requireStaff();
  const { data, error } = await supabase
    .from("site_settings")
    .select("data, updated_at")
    .eq("id", 1)
    .maybeSingle();

  if (error) throw new Error(`No se pudo cargar la configuración: ${error.message}`);
  if (!data) return defaultSettings;

  const settings = mapSettings(data.data);
  return { ...settings, updatedAt: data.updated_at ?? settings.updatedAt };
}

export async function listAllBlocks(): Promise<ContentBlock[]> {
  const { supabase } = await requireStaff();
  const { data, error } = await supabase
    .from("content_blocks")
    .select("*")
    .order("position", { ascending: true });

  if (error) throw new Error(`No se pudieron cargar los bloques: ${error.message}`);

  const blocks = (data ?? [])
    .map(mapContentBlock)
    .filter((block): block is ContentBlock => block !== null);

  return blocks.length > 0 ? blocks : defaultBlocks;
}

export async function listMessages(limit = 100): Promise<ContactMessage[]> {
  const { supabase } = await requireStaff();
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`No se pudieron cargar los mensajes: ${error.message}`);

  return (data ?? [])
    .map(mapContactMessage)
    .filter((message): message is ContactMessage => message !== null);
}

export interface DashboardStats {
  projectsTotal: number;
  projectsPublished: number;
  projectsDraft: number;
  projectsArchived: number;
  servicesActive: number;
  servicesTotal: number;
  messagesTotal: number;
  messagesUnread: number;
  lastUpdate: string | null;
  /** Lo que todavia no existe en la base de datos y sale del codigo. */
  missingContent: {
    settings: boolean;
    services: boolean;
    blocks: boolean;
  };
}

/**
 * Cifras del panel de inicio.
 *
 * Se piden con `count: "exact", head: true`, que devuelve solo el total sin
 * traer las filas: para contar 200 proyectos no hace falta descargarlos.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const { supabase } = await requireStaff();

  // `head: true` pide solo la cabecera con el total: cuenta las filas sin
  // descargarlas. El filtro se expresa como una igualdad simple porque es lo
  // unico que necesitan estas cifras.
  const countOf = async (
    table: string,
    filter?: { column: string; value: string | boolean },
  ): Promise<number> => {
    const query = supabase.from(table).select("*", { count: "exact", head: true });
    const { count, error } = await (filter
      ? query.eq(filter.column, filter.value)
      : query);
    if (error) return 0;
    return count ?? 0;
  };

  const [
    projectsTotal,
    projectsPublished,
    projectsDraft,
    projectsArchived,
    servicesTotal,
    servicesActive,
    messagesTotal,
    messagesUnread,
    blocksTotal,
  ] = await Promise.all([
    countOf("projects"),
    countOf("projects", { column: "status", value: "published" }),
    countOf("projects", { column: "status", value: "draft" }),
    countOf("projects", { column: "status", value: "archived" }),
    countOf("services"),
    countOf("services", { column: "active", value: true }),
    countOf("contact_messages"),
    countOf("contact_messages", { column: "read", value: false }),
    countOf("content_blocks"),
  ]);

  // La ultima actualizacion del sitio es la mas reciente entre contenido y
  // proyectos: es lo que de verdad le interesa saber al despacho.
  const [{ data: lastProject }, { data: lastSettings }] = await Promise.all([
    supabase
      .from("projects")
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("site_settings").select("updated_at").eq("id", 1).maybeSingle(),
  ]);

  const candidates = [lastProject?.updated_at, lastSettings?.updated_at].filter(
    (value): value is string => typeof value === "string",
  );

  const lastUpdate =
    candidates.length > 0
      ? candidates.sort((a, b) => (a < b ? 1 : -1))[0] ?? null
      : null;

  return {
    projectsTotal,
    projectsPublished,
    projectsDraft,
    projectsArchived,
    servicesActive,
    servicesTotal,
    messagesTotal,
    messagesUnread,
    lastUpdate,
    missingContent: {
      settings: !lastSettings,
      services: servicesTotal === 0,
      blocks: blocksTotal === 0,
    },
  };
}
