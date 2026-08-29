import { AdminShell } from "@/components/admin/AdminShell";
import { BlocksEditor } from "@/components/admin/BlocksEditor";
import { requireStaff } from "@/lib/admin/auth";
import { listAllBlocks, listAllProjects } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminBlocksPage() {
  const { profile } = await requireStaff();
  const [blocks, projects] = await Promise.all([
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
