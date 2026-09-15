import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./config";

let cached: SupabaseClient | null = null;

/**
 * Tiempo maximo por consulta. Si Supabase esta lento o pausado, sin limite cada
 * pagina esperaba al timeout de red (varios segundos) antes de caer al
 * contenido por defecto. Con el, la pagina se sirve rapido igualmente.
 */
const REQUEST_TIMEOUT_MS = 5_000;

const fetchWithTimeout: typeof fetch = (input, init) => {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  return fetch(input, { ...init, signal });
};

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
    global: { fetch: fetchWithTimeout },
  });
  return cached;
}
