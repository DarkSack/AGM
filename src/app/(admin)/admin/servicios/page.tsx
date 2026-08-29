import { AdminShell } from "@/components/admin/AdminShell";
import { ServicesEditor } from "@/components/admin/ServicesEditor";
import { requireStaff } from "@/lib/admin/auth";
import { listAllServices } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const { profile } = await requireStaff();
  const services = await listAllServices();

  return (
    <AdminShell
      profile={profile}
      title="Servicios"
      description="Lo que el despacho ofrece. Puedes reordenarlos, ocultar alguno temporalmente o añadir uno nuevo sin tocar el código."
    >
      <ServicesEditor services={services} />
    </AdminShell>
  );
}
