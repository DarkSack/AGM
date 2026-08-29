import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./config";

let cached: SupabaseClient | null = null;

/**
 * Cliente anonimo sin sesion, para las lecturas del sitio publico.
 *
 * Deliberadamente no lee cookies: si lo hiciera, cada pagina pasaria a ser
 * dinamica y perderiamos el renderizado estatico con revalidacion, que es lo
 * que mantiene el LCP bajo. Todo lo que devuelve esta filtrado por las
 * politicas RLS del rol `anon`, asi que nunca expone borradores.
 */
export function getPublicSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  cached ??= createClient(supabaseUrl as string, supabaseAnonKey as string, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
