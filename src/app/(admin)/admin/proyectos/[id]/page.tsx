import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { requireStaff } from "@/lib/admin/auth";
import { getProjectById } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

/**
 * Alta y edicion comparten pantalla: el identificador reservado `nuevo` indica
 * que se esta creando. Mantener un solo formulario evita que las dos vistas se
 * desincronicen cada vez que se anade un campo.
 */
export default async function ProjectEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireStaff();

  const isNew = id === "nuevo";
  const project = isNew ? null : await getProjectById(id);

  if (!isNew && !project) notFound();

  return (
    <AdminShell
      profile={profile}
      title={isNew ? "Nuevo proyecto" : (project?.title.es || "Editar proyecto")}
      description={
        isNew
          ? "Rellena al menos el nombre y el resumen. Puedes guardarlo como borrador y terminarlo más tarde."
          : "Los cambios se ven en el sitio en cuanto guardas."
      }
    >
      <ProjectForm project={project} isNew={isNew} />
    </AdminShell>
  );
}
