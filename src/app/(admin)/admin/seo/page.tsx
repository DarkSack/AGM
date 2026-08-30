import { AdminShell } from "@/components/admin/AdminShell";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireStaff } from "@/lib/admin/auth";
import { getAdminSettings } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminSeoPage() {
  // La consulta arranca a la vez que la comprobacion de sesion. Son dos
  // viajes de red independientes y encadenarlos duplicaba la espera al
  // cambiar de seccion. La autorizacion se sigue resolviendo antes de
  // renderizar nada, y RLS protege la consulta pase lo que pase.
  const [{ profile }, settings] = await Promise.all([
    requireStaff(),
    getAdminSettings(),
  ]);

  return (
    <AdminShell
      profile={profile}
      title="Buscadores"
      description="Cómo se presenta el sitio en Google y al compartir el enlace. Cada proyecto tiene además sus propios campos en su ficha."
    >
      <SettingsForm settings={settings} section="seo" />
    </AdminShell>
  );
}
