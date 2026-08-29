import { AdminShell } from "@/components/admin/AdminShell";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireStaff } from "@/lib/admin/auth";
import { getAdminSettings } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminSeoPage() {
  const { profile } = await requireStaff();
  const settings = await getAdminSettings();

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
