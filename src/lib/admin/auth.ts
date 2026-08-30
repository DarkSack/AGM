import { cache } from "react";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { asEnum, asNullableString, asString, isRecord } from "@/lib/json";

export type AdminRole = "admin" | "editor";

export interface StaffProfile {
  id: string;
  email: string | null;
  fullName: string | null;
  role: AdminRole;
}

export interface StaffSession {
  /** `sub` del token ya verificado. Es lo unico que se usaba de `user`. */
  userId: string;
  profile: StaffProfile;
  supabase: SupabaseClient;
}

/**
 * Puerta de entrada de todo el panel.
 *
 * Se llama al principio de cada pagina y de cada Server Action que escribe. El
 * middleware ya redirige al anonimo, pero eso solo cubre la navegacion: una
 * Server Action se puede invocar directamente. Por eso la comprobacion se
 * repite aqui, junto a la operacion, que es donde de verdad importa.
 *
 * Tener sesion no basta: hace falta fila en `profiles`. Es lo que separa a un
 * usuario cualquiera de Supabase Auth del personal del despacho, y es la misma
 * condicion que exigen las politicas RLS.
 *
 * Va envuelta en `cache()` de React: dentro de una misma peticion se puede
 * llamar desde la pagina y desde cualquier componente sin repetir las dos
 * consultas de red que hace (verificar el token y leer el perfil).
 */
export const requireStaff = cache(async (): Promise<StaffSession> => {
  const supabase = await createSupabaseServerClient();

  // Sin backend configurado no puede haber sesion. Se manda a la pantalla de
  // acceso, que es la unica del panel que sabe explicar como configurarlo.
  if (!supabase) redirect("/admin/login");

  // getUser() valida el token contra Supabase. getSession() solo leeria la
  // cookie, que el cliente controla.
  // Verificacion local de la firma (ES256 via WebCrypto, con el JWKS del
  // proyecto cacheado). Sustituye a getUser(), que preguntaba al servidor de
  // Supabase en cada carga de cada seccion del panel. Comprueba lo mismo: que
  // el token lo emitio este proyecto y no ha caducado.
  const { data: claimsData, error: authError } = await supabase.auth.getClaims();

  if (authError && authError.name !== "AuthSessionMissingError") {
    console.error("[auth] no se pudo verificar la sesion:", authError.message);
  }

  const claims = claimsData?.claims;
  if (!claims?.sub) redirect("/admin/login");
  const userId = claims.sub;
  const claimEmail = typeof claims.email === "string" ? claims.email : null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", userId)
    .maybeSingle();

  // No es lo mismo no tener perfil que no poder consultarlo. Antes ambos casos
  // acababan en "sin-perfil", que ante una caida de la base de datos le dice al
  // usuario justo lo contrario de lo que pasa y manda a buscar el problema al
  // sitio equivocado.
  if (error) {
    console.error("[auth] no se pudo leer el perfil:", error.message);
    redirect("/admin/login?error=sin-conexion");
  }

  if (!data || !isRecord(data)) {
    // Usuario autenticado pero sin perfil: no es personal del despacho.
    redirect("/admin/login?error=sin-perfil");
  }

  return {
    userId,
    supabase,
    profile: {
      id: asString(data.id, userId),
      email: asNullableString(data.email) ?? claimEmail,
      fullName: asNullableString(data.full_name),
      role: asEnum<AdminRole>(data.role, ["admin", "editor"], "editor"),
    },
  };
});

/**
 * Acciones reservadas al rol `admin` (configuracion global y usuarios).
 *
 * Hoy el panel no distingue casi nada por rol, pero el punto de control existe
 * para que anadir permisos mas adelante sea cambiar esta funcion y no repartir
 * comprobaciones nuevas por veinte ficheros.
 */
export function assertAdmin(profile: StaffProfile): void {
  if (profile.role !== "admin") {
    throw new Error("Esta acción requiere rol de administrador.");
  }
}
