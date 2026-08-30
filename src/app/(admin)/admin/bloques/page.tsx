import { AdminShell } from "@/components/admin/AdminShell";
import { BlocksEditor } from "@/components/admin/BlocksEditor";
import { requireStaff } from "@/lib/admin/auth";
import { listAllBlocks, listAllProjects } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminBlocksPage() {
  // La consulta arranca a la vez que la comprobacion de sesion. Son dos
  // viajes de red independientes y encadenarlos duplicaba la espera al
  // cambiar de seccion. La autorizacion se sigue resolviendo antes de
  // renderizar nada, y RLS protege la consulta pase lo que pase.
  const [{ profile }, blocks, projects] = await Promise.all([
    requireStaff(),
    listAllBlocks(),
    listAllProjects(),
  ]);

  return (
    <AdminShell
      profile={profile}
      title="Composición de la portada"
      description="Decide qué secciones aparecen y en qué orden. Puedes añadir bloques sueltos —una cita, unas cifras, una imagen— sin tocar el código."
    >
      <BlocksEditor blocks={blocks} projects={projects} />
    </AdminShell>
  );
}
