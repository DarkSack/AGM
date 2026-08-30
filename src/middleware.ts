import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { routing } from "@/i18n/routing";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

const intlMiddleware = createIntlMiddleware(routing);

const LOGIN_PATH = "/admin/login";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Renueva la sesion de Supabase y expulsa a quien no ha iniciado sesion.
 *
 * Esto es una barrera de conveniencia para no renderizar el panel a un
 * visitante anonimo. La autorizacion real vive en las politicas RLS de la base
 * de datos y en la comprobacion que hace cada pagina y cada Server Action del
 * panel: el middleware por si solo nunca es suficiente.
 */
async function handleAdmin(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Sin backend configurado no hay sesion posible; dejamos pasar para que el
  // panel muestre sus propias instrucciones de configuracion.
  if (!isSupabaseConfigured) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl as string, supabaseAnonKey as string, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() revalida el token contra el servidor de Supabase. No usar
  // getSession() aqui: lee la cookie sin verificar la firma.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Si no se pudo verificar el token seguimos expulsando (fallar cerrado es lo
  // correcto), pero se deja constancia: sin esta linea, no poder hablar con
  // Supabase es indistinguible de no haber iniciado sesion, y el sintoma es un
  // login que "no hace nada" sin una sola pista en los registros.
  if (error && error.name !== "AuthSessionMissingError") {
    console.error("[auth] no se pudo verificar la sesion:", error.message);
  }

  const isLoginPage = pathname === LOGIN_PATH;

  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    return handleAdmin(request);
  }
  return intlMiddleware(request);
}

export const config = {
  /**
   * Excluye rutas de API, assets de Next y cualquier fichero con extension.
   * Asi el middleware no se ejecuta para imagenes, fuentes ni el sitemap.
   */
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
