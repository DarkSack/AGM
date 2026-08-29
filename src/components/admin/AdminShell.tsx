import Link from "next/link";
import { LogoMark } from "@/components/layout/Logo";
import { ThemeToggleStandalone } from "./ThemeToggleStandalone";
import type { StaffProfile } from "@/lib/admin/auth";
import { AdminNav } from "./AdminNav";
import { SignOutButton } from "./SignOutButton";

/**
 * Marco comun de las paginas autenticadas del panel.
 *
 * En movil la navegacion se convierte en una tira horizontal desplazable en
 * lugar de un menu desplegable: son ocho secciones cortas, y verlas todas de
 * un vistazo es mas rapido que abrir y cerrar un panel.
 */
export function AdminShell({
  profile,
  title,
  description,
  actions,
  children,
}: {
  profile: StaffProfile;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="border-b border-line bg-bg lg:sticky lg:top-0 lg:h-svh lg:border-r lg:border-b-0">
        <div className="flex h-full flex-col gap-6 p-5">
          <div className="flex items-center justify-between gap-3">
            <Link href="/admin" className="flex items-center gap-2.5">
              <LogoMark className="size-8 text-fg" />
              <span className="flex flex-col leading-none">
                <span className="text-sm font-semibold tracking-[0.2em] text-fg">
                  AGM
                </span>
                <span className="mt-1 text-[0.5625rem] tracking-[0.16em] text-fg-subtle uppercase">
                  Panel
                </span>
              </span>
            </Link>
            <ThemeToggleStandalone />
          </div>

          {/* En movil la lista se desplaza en horizontal; en escritorio ocupa
              la columna lateral completa. */}
          <div className="-mx-5 overflow-x-auto px-5 lg:mx-0 lg:overflow-visible lg:px-0">
            <div className="min-w-max lg:min-w-0 [&_ul]:flex-row [&_ul]:gap-1 lg:[&_ul]:flex-col lg:[&_ul]:gap-0.5">
              <AdminNav />
            </div>
          </div>

          <div className="mt-auto hidden flex-col gap-3 border-t border-line pt-4 lg:flex">
            <div className="flex flex-col gap-0.5">
              <span className="truncate text-sm text-fg">
                {profile.fullName ?? profile.email ?? "Usuario"}
              </span>
              <span className="text-xs text-fg-subtle">
                {profile.role === "admin" ? "Administrador" : "Editor"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <SignOutButton />
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-[3px] border border-line px-3 py-1.5 text-xs text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
              >
                Ver el sitio
              </Link>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="border-b border-line bg-bg px-5 py-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-fg sm:text-2xl">
                {title}
              </h1>
              {description ? (
                <p className="mt-1.5 max-w-[70ch] text-sm leading-relaxed text-fg-muted">
                  {description}
                </p>
              ) : null}
            </div>
            {actions ? (
              <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
            ) : null}
          </div>
        </header>

        <main className="flex-1 px-5 py-7 sm:px-8">{children}</main>

        <footer className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-4 text-xs text-fg-subtle sm:px-8 lg:hidden">
          <span>{profile.fullName ?? profile.email ?? "Usuario"}</span>
          <SignOutButton />
        </footer>
      </div>
    </div>
  );
}
