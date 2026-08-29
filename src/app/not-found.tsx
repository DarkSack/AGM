import Link from "next/link";
import "./globals.css";

/**
 * 404 global.
 *
 * Cubre las rutas que no pertenecen ni al sitio publico ni al panel (por
 * ejemplo un prefijo de idioma inexistente). Como el proyecto usa varios root
 * layouts, esta pagina tiene que aportar su propio `<html>`.
 *
 * Es deliberadamente sobria y no depende de traducciones: en este punto no
 * sabemos en que idioma navega el visitante.
 */
export default function GlobalNotFound() {
  return (
    <html lang="es">
      <body className="min-h-svh antialiased">
        <div className="flex min-h-svh items-center">
          <div className="container-editorial">
            <p className="numeral">404</p>
            <h1 className="mt-4 text-h1 text-fg">Página no encontrada</h1>
            <p className="mt-5 max-w-[46ch] text-lead text-fg-muted">
              La dirección que has abierto no existe. Vuelve al inicio para
              seguir navegando.
            </p>
            <Link
              href="/"
              className="mt-9 inline-flex h-11 items-center rounded-[3px] border border-line-strong px-6 font-sans text-sm text-fg transition-colors hover:bg-fg hover:text-bg"
            >
              Ir al inicio
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
