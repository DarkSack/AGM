"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { defaultBlocks } from "@/content/blocks";
import { defaultServices } from "@/content/services";
import { defaultSettings } from "@/content/settings";
import { removedStoragePaths, storagePathsIn } from "@/lib/storage";
import { STORAGE_BUCKET } from "@/lib/supabase/config";
import { requireStaff } from "./auth";
import {
  blocksSchema,
  projectSchema,
  serviceSchema,
  settingsSchema,
} from "./schemas";

/**
 * Server Actions del panel.
 *
 * Reglas comunes a todas:
 *
 *  1. Empiezan por `requireStaff()`. Una Server Action es un endpoint POST: el
 *     middleware no la cubre, asi que la comprobacion tiene que estar aqui.
 *  2. Validan con zod antes de tocar la base de datos.
 *  3. Terminan revalidando las rutas publicas afectadas, para que el cambio se
 *     vea sin esperar a que caduque el ISR de cinco minutos.
 *
 * Devuelven `ActionResult` en lugar de lanzar, para que el formulario pueda
 * mostrar el error sin romper la pagina.
 */

export type ActionResult =
  | { ok: true; message?: string; id?: string }
  | { ok: false; error: string };

/** Revalida las rutas publicas en los dos idiomas. */
function revalidatePublic(slug?: string): void {
  revalidatePath("/", "layout");
  if (slug) {
    revalidatePath(`/proyectos/${slug}`);
    revalidatePath(`/en/projects/${slug}`);
  }
  revalidatePath("/sitemap.xml");
}

function fail(error: unknown, fallback: string): ActionResult {
  // `redirect()` y `notFound()` funcionan lanzando un error que Next tiene que
  // recibir. Si se atrapa aqui, una sesion caducada no manda al login: el
  // formulario muestra literalmente "NEXT_REDIRECT".
  unstable_rethrow(error);

  if (error instanceof z.ZodError) {
    const first = error.issues[0];
    return {
      ok: false,
      error: first ? `${first.path.join(".")}: ${first.message}` : fallback,
    };
  }
  if (error instanceof Error) return { ok: false, error: error.message };
  return { ok: false, error: fallback };
}

/** Traduce los errores de Postgres a algo que una persona pueda entender. */
function describeDbError(message: string): string {
  if (message.includes("projects_slug_key")) {
    return "Ya existe un proyecto con ese slug. Elige otro.";
  }
  if (message.includes("services_slug_key")) {
    return "Ya existe un servicio con ese identificador. Elige otro.";
  }
  if (message.includes("duplicate key")) {
    return "Ya existe un elemento con ese identificador. Elige otro.";
  }
  if (message.includes("_slug_format")) {
    return "El slug solo admite minúsculas, números y guiones.";
  }
  if (message.includes("row-level security")) {
    return "Tu usuario no tiene permisos para esta operación.";
  }
  if (message.includes("replace_content_blocks") || message.includes("previous_slugs")) {
    return "Falta actualizar la base de datos: vuelve a ejecutar supabase/schema.sql en el SQL Editor de Supabase.";
  }
  return message;
}

/** URL de todas las imagenes que referencia una fila de `projects`. */
function projectImageUrls(row: unknown): string[] {
  if (typeof row !== "object" || row === null) return [];
  const { cover_image, gallery, seo } = row as {
    cover_image?: unknown;
    gallery?: unknown;
    seo?: unknown;
  };
  const images = [cover_image, ...(Array.isArray(gallery) ? gallery : [])];
  const urls = images.flatMap((image) =>
    typeof image === "object" &&
    image !== null &&
    typeof (image as { url?: unknown }).url === "string"
      ? [(image as { url: string }).url]
      : [],
  );
  const ogImage = (seo as { ogImage?: unknown } | null | undefined)?.ogImage;
  if (typeof ogImage === "string") urls.push(ogImage);
  return urls;
}

/**
 * Borra del bucket los archivos que un proyecto ha dejado de usar.
 *
 * Se hace aqui, despues de guardar, y no al pulsar "Eliminar" en la galeria:
 * antes el archivo desaparecia del bucket en ese momento, y si la persona
 * salia sin guardar el proyecto publicado se quedaba con la imagen rota.
 *
 * Un fallo al limpiar no invalida el guardado; solo deja un archivo huerfano.
 */
async function removeUnusedImages(
  supabase: SupabaseClient,
  before: readonly string[],
  after: readonly string[],
): Promise<void> {
  const paths = removedStoragePaths(before, after);
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove(paths);
  if (error) {
    console.warn("[storage] no se pudieron borrar imagenes sin uso:", error.message);
  }
}

/* ------------------------------------------------------------------ *
 * Proyectos
 * ------------------------------------------------------------------ */

export async function saveProject(input: unknown): Promise<ActionResult> {
  try {
    const { supabase } = await requireStaff();
    const values = projectSchema.parse(input);

    const row = {
      slug: values.slug,
      title: values.title,
      summary: values.summary,
      description: values.description,
      category: values.category,
      location: values.location,
      year: values.year,
      client: values.client,
      area: values.area,
      status: values.status,
      featured: values.featured,
      is_concept: values.isConcept,
      cover_image: values.coverImage,
      gallery: values.gallery,
      tags: values.tags,
      seo: values.seo,
      position: values.position,
    };

    if (values.id) {
      const { data: previous } = await supabase
        .from("projects")
        .select("*")
        .eq("id", values.id)
        .maybeSingle();

      // Al cambiar el slug se apunta el anterior para que la ficha publica
      // redirija desde el. Solo se escribe la columna cuando hace falta, asi
      // que editar sin tocar el slug funciona aunque falte la migracion.
      const oldSlug = (previous as { slug?: unknown } | null)?.slug;
      const slugChanged = typeof oldSlug === "string" && oldSlug !== values.slug;
      const history = (previous as { previous_slugs?: unknown } | null)
        ?.previous_slugs;
      const update = slugChanged
        ? {
            ...row,
            previous_slugs: [
              ...new Set([
                ...(Array.isArray(history)
                  ? history.filter((item): item is string => typeof item === "string")
                  : []),
                oldSlug,
              ]),
            ].filter((item) => item !== values.slug),
          }
        : row;

      const { error } = await supabase
        .from("projects")
        .update(update)
        .eq("id", values.id);
      if (error) return { ok: false, error: describeDbError(error.message) };

      await removeUnusedImages(
        supabase,
        projectImageUrls(previous),
        projectImageUrls(row),
      );

      revalidatePublic(values.slug);
      // La URL antigua tiene que dejar de servirse desde la cache para que
      // empiece a redirigir.
      if (slugChanged) revalidatePublic(oldSlug);
      return { ok: true, message: "Proyecto actualizado.", id: values.id };
    }

    const { data, error } = await supabase
      .from("projects")
      .insert(row)
      .select("id")
      .single();

    if (error) return { ok: false, error: describeDbError(error.message) };

    revalidatePublic(values.slug);
    return { ok: true, message: "Proyecto creado.", id: String(data.id) };
  } catch (error) {
    return fail(error, "No se pudo guardar el proyecto.");
  }
}

export async function deleteProject(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireStaff();
    z.string().uuid().parse(id);

    const { data: previous } = await supabase
      .from("projects")
      .select("slug, cover_image, gallery, seo")
      .eq("id", id)
      .maybeSingle();

    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return { ok: false, error: describeDbError(error.message) };

    await removeUnusedImages(supabase, projectImageUrls(previous), []);

    const previousSlug = (previous as { slug?: unknown } | null)?.slug;
    revalidatePublic(typeof previousSlug === "string" ? previousSlug : undefined);
    return { ok: true, message: "Proyecto eliminado." };
  } catch (error) {
    return fail(error, "No se pudo eliminar el proyecto.");
  }
}

/** Cambio rapido de estado desde el listado, sin abrir el formulario. */
export async function setProjectStatus(
  id: string,
  status: "draft" | "published" | "archived",
): Promise<ActionResult> {
  try {
    const { supabase } = await requireStaff();
    z.string().uuid().parse(id);
    z.enum(["draft", "published", "archived"]).parse(status);

    const { data, error } = await supabase
      .from("projects")
      .update({ status })
      .eq("id", id)
      .select("slug")
      .single();

    if (error) return { ok: false, error: describeDbError(error.message) };

    revalidatePublic(typeof data.slug === "string" ? data.slug : undefined);
    return { ok: true, message: "Estado actualizado." };
  } catch (error) {
    return fail(error, "No se pudo cambiar el estado.");
  }
}

/* ------------------------------------------------------------------ *
 * Servicios
 * ------------------------------------------------------------------ */

export async function saveService(input: unknown): Promise<ActionResult> {
  try {
    const { supabase } = await requireStaff();
    const values = serviceSchema.parse(input);

    const row = {
      slug: values.slug,
      title: values.title,
      description: values.description,
      icon: values.icon,
      position: values.position,
      active: values.active,
    };

    if (values.id) {
      const { error } = await supabase
        .from("services")
        .update(row)
        .eq("id", values.id);
      if (error) return { ok: false, error: describeDbError(error.message) };

      revalidatePublic();
      return { ok: true, message: "Servicio guardado.", id: values.id };
    }

    // Se devuelve el id para que el editor deje de tratar la ficha como nueva:
    // sin el, un segundo "Guardar" volvia a insertarla y chocaba con el slug.
    const { data, error } = await supabase
      .from("services")
      .insert(row)
      .select("id")
      .single();
    if (error) return { ok: false, error: describeDbError(error.message) };

    revalidatePublic();
    return { ok: true, message: "Servicio guardado.", id: String(data.id) };
  } catch (error) {
    return fail(error, "No se pudo guardar el servicio.");
  }
}

/**
 * Guarda el orden de los servicios.
 *
 * Solo toca `position`. Antes el reordenado reutilizaba `saveService` con la
 * ficha completa, asi que arrastrar un servicio guardaba tambien lo que se
 * estuviera editando en otras fichas sin haber pulsado "Guardar", y los
 * errores se descartaban en silencio.
 */
export async function reorderServices(ids: unknown): Promise<ActionResult> {
  try {
    const { supabase } = await requireStaff();
    const ordered = z.array(z.string().uuid()).max(200).parse(ids);

    const results = await Promise.all(
      ordered.map((id, position) =>
        supabase.from("services").update({ position }).eq("id", id),
      ),
    );
    const failed = results.find((result) => result.error);
    if (failed?.error) {
      return { ok: false, error: describeDbError(failed.error.message) };
    }

    revalidatePublic();
    return { ok: true, message: "Orden guardado." };
  } catch (error) {
    return fail(error, "No se pudo guardar el orden.");
  }
}

export async function deleteService(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireStaff();
    z.string().uuid().parse(id);

    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) return { ok: false, error: describeDbError(error.message) };

    revalidatePublic();
    return { ok: true, message: "Servicio eliminado." };
  } catch (error) {
    return fail(error, "No se pudo eliminar el servicio.");
  }
}

/* ------------------------------------------------------------------ *
 * Contenido y configuracion
 * ------------------------------------------------------------------ */

export async function saveSettings(input: unknown): Promise<ActionResult> {
  try {
    const { supabase, userId } = await requireStaff();
    const values = settingsSchema.parse(input);

    const { error } = await supabase.from("site_settings").upsert({
      id: 1,
      data: values,
      updated_by: userId,
    });

    if (error) return { ok: false, error: describeDbError(error.message) };

    revalidatePublic();
    return { ok: true, message: "Contenido guardado." };
  } catch (error) {
    return fail(error, "No se pudo guardar el contenido.");
  }
}

/**
 * Guarda la composicion completa de bloques.
 *
 * Se reemplaza el conjunto entero en lugar de aplicar diferencias: son pocas
 * filas y asi el orden guardado es exactamente el que se ve en pantalla.
 *
 * El borrado y la insercion van en una sola funcion de Postgres, que corre en
 * una transaccion. Hechos como dos peticiones separadas, un fallo en la
 * insercion dejaba la tabla vacia y se perdia la composicion entera.
 */
export async function saveBlocks(input: unknown): Promise<ActionResult> {
  try {
    const { supabase } = await requireStaff();
    const blocks = blocksSchema.parse(input);

    const { error } = await supabase.rpc("replace_content_blocks", {
      blocks: blocks.map((block) => ({
        type: block.type,
        enabled: block.enabled,
        data: block.data,
      })),
    });

    if (error) {
      // PostgREST no nombra la funcion en todos sus mensajes de "no existe".
      const missing = error.code === "PGRST202" || error.code === "42883";
      return {
        ok: false,
        error: describeDbError(
          missing ? `replace_content_blocks: ${error.message}` : error.message,
        ),
      };
    }

    revalidatePublic();
    return { ok: true, message: "Composición guardada." };
  } catch (error) {
    return fail(error, "No se pudo guardar la composición.");
  }
}

/* ------------------------------------------------------------------ *
 * Mensajes
 * ------------------------------------------------------------------ */

export async function setMessageRead(
  id: string,
  read: boolean,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireStaff();
    z.string().uuid().parse(id);

    const { error } = await supabase
      .from("contact_messages")
      .update({ read })
      .eq("id", id);

    if (error) return { ok: false, error: describeDbError(error.message) };

    revalidatePath("/admin/mensajes");
    return { ok: true };
  } catch (error) {
    return fail(error, "No se pudo actualizar el mensaje.");
  }
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireStaff();
    z.string().uuid().parse(id);

    const { error } = await supabase
      .from("contact_messages")
      .delete()
      .eq("id", id);

    if (error) return { ok: false, error: describeDbError(error.message) };

    revalidatePath("/admin/mensajes");
    return { ok: true, message: "Mensaje eliminado." };
  } catch (error) {
    return fail(error, "No se pudo eliminar el mensaje.");
  }
}

/* ------------------------------------------------------------------ *
 * Contenido inicial
 * ------------------------------------------------------------------ */

/**
 * Copia a la base de datos el contenido que trae el codigo (textos, servicios y
 * composicion de la portada), para que el despacho lo edite en vez de
 * reescribirlo desde cero.
 *
 * Solo rellena lo que falta: una tabla con datos no se toca, asi que pulsarlo
 * por error o dos veces no borra nada. Los proyectos de muestra no se cargan:
 * son conceptuales y no deben mezclarse con la obra real.
 */
export async function seedDefaultContent(): Promise<ActionResult> {
  try {
    const { supabase, userId } = await requireStaff();

    const [settingsRow, services, blocks] = await Promise.all([
      supabase.from("site_settings").select("id").eq("id", 1).maybeSingle(),
      supabase.from("services").select("id", { count: "exact", head: true }),
      supabase.from("content_blocks").select("id", { count: "exact", head: true }),
    ]);
    const readError = settingsRow.error ?? services.error ?? blocks.error;
    if (readError) return { ok: false, error: describeDbError(readError.message) };

    const loaded: string[] = [];

    if (!settingsRow.data) {
      // Se valida con el mismo esquema que el panel: lo sembrado tiene que poder
      // guardarse despues sin errores.
      const { error } = await supabase.from("site_settings").upsert({
        id: 1,
        // zod descarta `updatedAt`, que no forma parte del esquema.
        data: settingsSchema.parse(defaultSettings),
        updated_by: userId,
      });
      if (error) return { ok: false, error: describeDbError(error.message) };
      loaded.push("textos del sitio");
    }

    if ((services.count ?? 0) === 0) {
      const { error } = await supabase.from("services").insert(
        defaultServices.map((service, position) =>
          serviceSchema.omit({ id: true }).parse({
            slug: service.slug,
            title: service.title,
            description: service.description,
            icon: service.icon,
            position,
            active: service.active,
          }),
        ),
      );
      if (error) return { ok: false, error: describeDbError(error.message) };
      loaded.push("servicios");
    }

    if ((blocks.count ?? 0) === 0) {
      const { error } = await supabase.rpc("replace_content_blocks", {
        blocks: defaultBlocks.map((block) => ({
          type: block.type,
          enabled: block.enabled,
          data: block.data,
        })),
      });
      if (error) return { ok: false, error: describeDbError(error.message) };
      loaded.push("composición de la portada");
    }

    if (loaded.length === 0) {
      return { ok: true, message: "Ya estaba todo cargado; no se ha cambiado nada." };
    }

    revalidatePublic();
    revalidatePath("/admin", "layout");
    return { ok: true, message: `Cargado: ${loaded.join(", ")}.` };
  } catch (error) {
    return fail(error, "No se pudo cargar el contenido inicial.");
  }
}

/* ------------------------------------------------------------------ *
 * Almacenamiento
 * ------------------------------------------------------------------ */

/** Los archivos mas recientes se respetan: pueden ser de un formulario abierto. */
const ORPHAN_MIN_AGE_MS = 24 * 60 * 60 * 1000;

/** Rutas de todos los archivos del bucket con su fecha de subida. */
async function listBucketFiles(
  supabase: SupabaseClient,
  prefix = "",
  depth = 0,
): Promise<{ path: string; createdAt: string | null }[]> {
  const files: { path: string; createdAt: string | null }[] = [];
  const pageSize = 1000;

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(prefix, { limit: pageSize, offset });
    if (error) throw new Error(`No se pudo listar el almacenamiento: ${error.message}`);

    for (const entry of data ?? []) {
      // Marcador que crea el panel de Supabase para las carpetas vacias.
      if (entry.name === ".emptyFolderPlaceholder") continue;
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      // Las carpetas vienen sin `id`. El panel solo crea un nivel, pero se
      // baja algo mas por si alguien subio archivos a mano.
      if (entry.id === null) {
        if (depth < 3) files.push(...(await listBucketFiles(supabase, path, depth + 1)));
      } else {
        files.push({ path, createdAt: entry.created_at ?? null });
      }
    }
    if (!data || data.length < pageSize) break;
  }

  return files;
}

/**
 * Borra del bucket las imagenes que ya no usa ningun proyecto, bloque ni ajuste.
 *
 * Cubre lo que no puede limpiar el guardado de cada formulario: fotos subidas
 * y quitadas sin llegar a guardar, e imagenes retiradas de la portada o de los
 * bloques. Si falla cualquiera de las lecturas no se borra nada: con una
 * referencia sin leer, un archivo en uso pareceria huerfano.
 */
export async function cleanupOrphanMedia(): Promise<ActionResult> {
  try {
    const { supabase } = await requireStaff();

    const [projects, blocks, settings] = await Promise.all([
      supabase.from("projects").select("*"),
      supabase.from("content_blocks").select("data"),
      supabase.from("site_settings").select("data"),
    ]);
    const readError = projects.error ?? blocks.error ?? settings.error;
    if (readError) return { ok: false, error: describeDbError(readError.message) };

    const referenced = storagePathsIn(
      JSON.stringify([projects.data, blocks.data, settings.data]),
    );

    const now = Date.now();
    const orphans = (await listBucketFiles(supabase))
      .filter((file) => !referenced.has(file.path))
      .filter((file) => {
        const created = file.createdAt ? Date.parse(file.createdAt) : Number.NaN;
        return Number.isFinite(created) && now - created > ORPHAN_MIN_AGE_MS;
      })
      .map((file) => file.path);

    if (orphans.length === 0) {
      return { ok: true, message: "No hay imágenes sin uso." };
    }

    const { error } = await supabase.storage.from(STORAGE_BUCKET).remove(orphans);
    if (error) return { ok: false, error: describeDbError(error.message) };

    return {
      ok: true,
      message:
        orphans.length === 1
          ? "Se borró 1 imagen sin uso."
          : `Se borraron ${orphans.length} imágenes sin uso.`,
    };
  } catch (error) {
    return fail(error, "No se pudo limpiar el almacenamiento.");
  }
}

/* ------------------------------------------------------------------ *
 * Sesion
 * ------------------------------------------------------------------ */

export async function signOut(): Promise<never> {
  const { supabase } = await requireStaff();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
