import { AdminShell } from "@/components/admin/AdminShell";
import { MessagesList } from "@/components/admin/MessagesList";
import { requireStaff } from "@/lib/admin/auth";
import { listMessages } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  // La consulta arranca a la vez que la comprobacion de sesion. Son dos
  // viajes de red independientes y encadenarlos duplicaba la espera al
  // cambiar de seccion. La autorizacion se sigue resolviendo antes de
  // renderizar nada, y RLS protege la consulta pase lo que pase.
  const [{ profile }, messages] = await Promise.all([
    requireStaff(),
    listMessages(),
  ]);
  const unread = messages.filter((message) => !message.read).length;

  return (
    <AdminShell
      profile={profile}
      title="Solicitudes"
      description={
        unread > 0
          ? `Tienes ${unread} ${unread === 1 ? "solicitud sin leer" : "solicitudes sin leer"}.`
          : "Todo lo que llega por el formulario de contacto del sitio."
      }
    >
      <MessagesList messages={messages} />
    </AdminShell>
  );
}
