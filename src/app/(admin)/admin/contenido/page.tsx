import { AdminShell } from "@/components/admin/AdminShell";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireStaff } from "@/lib/admin/auth";
import { getAdminSettings } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const { profile } = await requireStaff();
  const settings = await getAdminSettings();

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
