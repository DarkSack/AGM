import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { MessagesList } from "@/components/admin/MessagesList";
import { requireStaff } from "@/lib/admin/auth";
import { listMessages } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const { pagina } = await searchParams;
  const requested = Number.parseInt(pagina ?? "1", 10);

  // La consulta arranca a la vez que la comprobacion de sesion. Son dos
  // viajes de red independientes y encadenarlos duplicaba la espera al
  // cambiar de seccion. La autorizacion se sigue resolviendo antes de
  // renderizar nada, y RLS protege la consulta pase lo que pase.
  const [{ profile }, result] = await Promise.all([
    requireStaff(),
    listMessages(requested),
  ]);
  const { messages, page, pageCount, total, unread } = result;

  return (
    <AdminShell
      profile={profile}
      title="Solicitudes"
      description={
        unread > 0
          ? `Tienes ${unread} ${unread === 1 ? "solicitud sin leer" : "solicitudes sin leer"}.`
          : "Todo lo que llega por el formulario de contacto del sitio."
      }
      actions={
        total > 0 ? (
          // `<a>` y no `<Link>`: es una descarga, no una navegacion del router.
          <a
            href="/admin/mensajes/exportar"
            download
            className="inline-flex h-10 items-center rounded-[3px] border border-line-strong px-4 text-sm text-fg transition-colors hover:bg-fg hover:text-bg"
          >
            Exportar CSV
          </a>
        ) : null
      }
    >
      <div className="flex flex-col gap-6">
        <MessagesList messages={messages} />

        {pageCount > 1 ? (
          <nav
            aria-label="Páginas de solicitudes"
            className="flex flex-wrap items-center justify-between gap-3 text-sm"
          >
            <span className="text-fg-subtle">
              Página {page} de {pageCount} · {total} en total
            </span>
            <div className="flex gap-2">
              <PageLink page={page - 1} disabled={page <= 1}>
                ← Más recientes
              </PageLink>
              <PageLink page={page + 1} disabled={page >= pageCount}>
                Más antiguas →
              </PageLink>
            </div>
          </nav>
        ) : null}
      </div>
    </AdminShell>
  );
}

function PageLink({
  page,
  disabled,
  children,
}: {
  page: number;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const className =
    "inline-flex h-9 items-center rounded-[3px] border border-line px-3 text-sm transition-colors";

  if (disabled) {
    return (
      <span aria-disabled="true" className={`${className} text-fg-subtle opacity-50`}>
        {children}
      </span>
    );
  }

  return (
    <Link
      href={page <= 1 ? "/admin/mensajes" : `/admin/mensajes?pagina=${page}`}
      className={`${className} text-fg-muted hover:border-line-strong hover:text-fg`}
    >
      {children}
    </Link>
  );
}
