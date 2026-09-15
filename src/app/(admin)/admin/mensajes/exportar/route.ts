import { messagesToCsv } from "@/lib/admin/csv";
import { listAllMessages } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

/**
 * Descarga de todas las solicitudes en CSV.
 *
 * `listAllMessages` pasa por `requireStaff`: sin sesion de personal redirige al
 * login, igual que las paginas del panel, y RLS impide leer los mensajes a
 * cualquier otro. No se cachea nunca: son datos personales.
 */
export async function GET() {
  const messages = await listAllMessages();
  const date = new Date().toISOString().slice(0, 10);

  return new Response(messagesToCsv(messages), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="solicitudes-agm-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
