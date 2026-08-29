import { AdminShell } from "@/components/admin/AdminShell";
import { MessagesList } from "@/components/admin/MessagesList";
import { requireStaff } from "@/lib/admin/auth";
import { listMessages } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const { profile } = await requireStaff();
  const messages = await listMessages();
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
