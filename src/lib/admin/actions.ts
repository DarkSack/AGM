"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { removedStoragePaths } from "@/lib/storage";
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
 * Sesion
 * ------------------------------------------------------------------ */

export async function signOut(): Promise<never> {
  const { supabase } = await requireStaff();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
