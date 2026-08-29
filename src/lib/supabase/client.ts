"use client";

import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./config";

/**
 * Cliente de navegador. Solo se usa dentro del panel: la parte publica no
 * necesita Supabase en el cliente porque todo se renderiza en el servidor.
 */
export function createClient() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase no esta configurado. Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return createBrowserClient(supabaseUrl as string, supabaseAnonKey as string);
}
