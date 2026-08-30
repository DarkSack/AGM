import { AdminShell } from "@/components/admin/AdminShell";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireStaff } from "@/lib/admin/auth";
import { getAdminSettings } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
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
      title="Contenido"
      description="Los textos de la portada: titular, presentación del despacho, método de trabajo y valores."
    >
      <SettingsForm settings={settings} section="contenido" />
    </AdminShell>
  );
}
