import { AdminShell } from "@/components/admin/AdminShell";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireStaff } from "@/lib/admin/auth";
import { getAdminSettings } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminOfficePage() {
  const { profile } = await requireStaff();
  const settings = await getAdminSettings();

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
