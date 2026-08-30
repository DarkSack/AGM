import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProjectsTable } from "@/components/admin/ProjectsTable";
import { requireStaff } from "@/lib/admin/auth";
import { listAllProjects } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  // La consulta arranca a la vez que la comprobacion de sesion. Son dos
  // viajes de red independientes y encadenarlos duplicaba la espera al
  // cambiar de seccion. La autorizacion se sigue resolviendo antes de
  // renderizar nada, y RLS protege la consulta pase lo que pase.
  const [{ profile }, projects] = await Promise.all([
    requireStaff(),
    listAllProjects(),
  ]);

  return (
    <AdminShell
      profile={profile}
      title="Proyectos"
      description="Todo lo que aparece —y lo que no— en la sección de proyectos del sitio."
      actions={
        <Link
          href="/admin/proyectos/nuevo"
          className="inline-flex h-10 items-center rounded-[3px] bg-fg px-4 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-accent-fg"
        >
          Nuevo proyecto
        </Link>
      }
    >
      <ProjectsTable projects={projects} />
    </AdminShell>
  );
}
