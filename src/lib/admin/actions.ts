"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
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
  if (message.includes("projects_slug_key") || message.includes("duplicate key")) {
    return "Ya existe un proyecto con ese slug. Elige otro.";
  }
  if (message.includes("projects_slug_format")) {
    return "El slug solo admite minúsculas, números y guiones.";
  }
  if (message.includes("row-level security")) {
    return "Tu usuario no tiene permisos para esta operación.";
  }
  return message;
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
      const { error } = await supabase
        .from("projects")
        .update(row)
        .eq("id", values.id);
      if (error) return { ok: false, error: describeDbError(error.message) };

      revalidatePublic(values.slug);
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

    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return { ok: false, error: describeDbError(error.message) };

    revalidatePublic();
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
    } else {
      const { error } = await supabase.from("services").insert(row);
      if (error) return { ok: false, error: describeDbError(error.message) };
    }

    revalidatePublic();
    return { ok: true, message: "Servicio guardado." };
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
 * filas y asi el orden guardado es exactamente el que se ve en pantalla, sin
 * estados intermedios si algo falla a mitad.
 */
export async function saveBlocks(input: unknown): Promise<ActionResult> {
  try {
    const { supabase } = await requireStaff();
    const blocks = blocksSchema.parse(input);

    const { error: deleteError } = await supabase
      .from("content_blocks")
      .delete()
      .not("id", "is", null);

    if (deleteError) {
      return { ok: false, error: describeDbError(deleteError.message) };
    }

    if (blocks.length > 0) {
      const { error } = await supabase.from("content_blocks").insert(
        blocks.map((block, index) => ({
          type: block.type,
          position: index,
          enabled: block.enabled,
          data: block.data,
        })),
      );
      if (error) return { ok: false, error: describeDbError(error.message) };
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
