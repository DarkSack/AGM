import { AdminShell } from "@/components/admin/AdminShell";
import { ServicesEditor } from "@/components/admin/ServicesEditor";
import { requireStaff } from "@/lib/admin/auth";
import { listAllServices } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  // La consulta arranca a la vez que la comprobacion de sesion. Son dos
  // viajes de red independientes y encadenarlos duplicaba la espera al
  // cambiar de seccion. La autorizacion se sigue resolviendo antes de
  // renderizar nada, y RLS protege la consulta pase lo que pase.
  const [{ profile }, services] = await Promise.all([
    requireStaff(),
    listAllServices(),
  ]);

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
