import Link from "next/link";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE } from "@/config/site";
import { ProjectArticle } from "@/components/sections/ProjectArticle";
import { requireStaff } from "@/lib/admin/auth";
import { getProjectById } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vista previa · Panel AGM",
  robots: { index: false, follow: false },
};

/**
 * Vista previa de un borrador.
 *
 * Existe porque la ruta publica de proyectos no sirve borradores por diseno:
 * si lo hiciera, cualquiera podria leer obra sin publicar adivinando la URL.
 * Esta pagina exige sesion de personal y reutiliza exactamente el mismo
 * componente que la ficha publica, de modo que lo que se aprueba aqui es lo
 * que se va a ver despues.
 */
export default async function ProjectPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireStaff();

  const project = await getProjectById(id);
  if (!project) notFound();

  const statusLabel =
    project.status === "published"
      ? "publicado"
      : project.status === "draft"
        ? "borrador"
        : "archivado";

  return (
    <div className="bg-bg">
      <div className="sticky top-0 z-50 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-accent px-5 py-2.5 text-accent-fg">
        <span className="text-xs font-medium tracking-[0.1em] uppercase">
          Vista previa
        </span>
        <span className="text-xs opacity-90">
          Estado actual: {statusLabel}. Esta página solo la ves tú.
        </span>
        <Link
          href={`/admin/proyectos/${project.id}`}
          className="ml-auto rounded-[3px] border border-current px-3 py-1 text-xs transition-opacity hover:opacity-80"
        >
          Volver a editar
        </Link>
      </div>

      <ProjectArticle
        project={project}
        locale={DEFAULT_LOCALE}
        showBackLink={false}
      />
    </div>
  );
}
