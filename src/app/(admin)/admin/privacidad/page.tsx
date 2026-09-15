import { AdminShell } from "@/components/admin/AdminShell";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireStaff } from "@/lib/admin/auth";
import { getAdminSettings } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminPrivacyPage() {
  const [{ profile }, settings] = await Promise.all([
    requireStaff(),
    getAdminSettings(),
  ]);

  return (
    <AdminShell
      profile={profile}
      title="Aviso de privacidad"
      description="El texto legal de la página de privacidad, a la que enlaza el formulario de contacto."
    >
      <SettingsForm settings={settings} section="privacidad" />
    </AdminShell>
  );
}
