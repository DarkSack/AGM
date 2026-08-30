import { AdminShell } from "@/components/admin/AdminShell";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireStaff } from "@/lib/admin/auth";
import { getAdminSettings } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminOfficePage() {
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
      title="Datos del despacho"
      description="Teléfono, correo, redes y ubicación. Se escriben una sola vez y se usan en todo el sitio."
    >
      <SettingsForm settings={settings} section="despacho" />
    </AdminShell>
  );
}
