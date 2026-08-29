import { Suspense } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/layout/Logo";
import { LoginForm } from "@/components/admin/LoginForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = {
  title: "Acceso · Panel AGM",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <LogoMark className="size-10 text-fg" />
          <div className="flex flex-col leading-none">
            <span className="text-base font-semibold tracking-[0.22em] text-fg">
              AGM
            </span>
            <span className="mt-1.5 text-[0.625rem] tracking-[0.18em] text-fg-subtle uppercase">
              Panel de administración
            </span>
          </div>
        </div>

        <div className="rounded-[4px] border border-line bg-bg p-6 sm:p-8">
          {isSupabaseConfigured ? (
            // `useSearchParams` obliga a un limite de Suspense para que la
            // pagina se pueda prerenderizar.
            <Suspense
              fallback={
                <p className="text-sm text-fg-muted">Cargando formulario…</p>
              }
            >
              <LoginForm />
            </Suspense>
          ) : (
            <SetupNotice />
          )}
        </div>

        <p className="mt-6 text-center text-xs text-fg-subtle">
          <Link href="/" className="underline underline-offset-4 hover:text-fg">
            Volver al sitio
          </Link>
        </p>
      </div>
    </div>
  );
}

/**
 * Pantalla que ve quien abre el panel antes de dar de alta el backend.
 *
 * En lugar de un error, explica los tres pasos que faltan. El sitio publico
 * funciona sin esto: solo el panel necesita base de datos.
 */
function SetupNotice() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-fg">Falta configurar el backend</h2>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">
          El sitio público ya funciona con el contenido incluido en el código.
          Para poder editarlo desde aquí hay que conectar Supabase.
        </p>
      </div>

      <ol className="flex flex-col gap-3 text-sm leading-relaxed text-fg-muted">
        <Step number={1}>
          Crea un proyecto en Supabase y ejecuta{" "}
          <code className="rounded-[2px] bg-bg-alt px-1.5 py-0.5 text-xs text-fg">
            supabase/schema.sql
          </code>{" "}
          en su editor de SQL.
        </Step>
        <Step number={2}>
          Copia{" "}
          <code className="rounded-[2px] bg-bg-alt px-1.5 py-0.5 text-xs text-fg">
            .env.example
          </code>{" "}
          a{" "}
          <code className="rounded-[2px] bg-bg-alt px-1.5 py-0.5 text-xs text-fg">
            .env.local
          </code>{" "}
          y rellena la URL y la clave <em>anon</em> del proyecto.
        </Step>
        <Step number={3}>
          Crea tu usuario en Authentication y añade su fila en{" "}
          <code className="rounded-[2px] bg-bg-alt px-1.5 py-0.5 text-xs text-fg">
            profiles
          </code>{" "}
          con rol <em>admin</em>. Las instrucciones exactas están al final del
          fichero de esquema.
        </Step>
      </ol>

      <p className="border-t border-line pt-4 text-xs leading-relaxed text-fg-subtle">
        Todo el detalle está en el README del proyecto.
      </p>
    </div>
  );
}

function Step({
  number,
  children,
}: {
  number: number;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-line-strong text-[0.625rem] text-fg-muted">
        {number}
      </span>
      <span>{children}</span>
    </li>
  );
}
