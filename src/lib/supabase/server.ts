import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./config";

/**
 * Forma de cada cookie que Supabase pide escribir. La libreria no exporta este
 * tipo con nombre propio, asi que se declara aqui una sola vez en lugar de
 * repetirlo (o dejarlo implicito) en cada cliente.
 */
type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Cliente de servidor ligado a las cookies de la peticion.
 *
 * Devuelve `null` cuando no hay credenciales para que quien llama pueda caer
 * en el contenido por defecto en lugar de lanzar.
 */
export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured) return null;

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl as string, supabaseAnonKey as string, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Los Server Components no pueden escribir cookies. La renovacion de
          // sesion la hace el middleware, asi que ignorar aqui es correcto.
        }
      },
    },
  });
}

/** Igual que el anterior pero lanza: usar solo en rutas ya protegidas. */
export async function requireSupabaseServerClient() {
  const client = await createSupabaseServerClient();
  if (!client) {
    throw new Error("Supabase no esta configurado.");
  }
  return client;
}
