"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProject, setProjectStatus } from "@/lib/admin/actions";
import { cn } from "@/lib/cn";
import type { Project, PublishStatus } from "@/types/content";

const STATUS_LABEL: Record<PublishStatus, string> = {
  published: "Publicado",
  draft: "Borrador",
  archived: "Archivado",
};

const STATUS_STYLE: Record<PublishStatus, string> = {
  published: "border-accent text-accent",
  draft: "border-line-strong text-fg-muted",
  archived: "border-line text-fg-subtle",
};

/**
 * Listado de proyectos con las acciones que se usan a diario.
 *
 * Publicar y despublicar se hacen desde la propia fila: es la operacion mas
 * frecuente y obligar a entrar al formulario para un solo interruptor seria
 * un paso de mas cada vez.
 */
export function ProjectsTable({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function changeStatus(id: string, status: PublishStatus) {
    setBusyId(id);
    setError(null);
    startTransition(async () => {
      const result = await setProjectStatus(id, status);
      setBusyId(null);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  function remove(id: string) {
    setBusyId(id);
    setError(null);
    startTransition(async () => {
      const result = await deleteProject(id);
      setBusyId(null);
      setConfirmId(null);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-[4px] border border-dashed border-line p-10 text-center">
        <p className="text-sm text-fg-muted">Todavía no hay ningún proyecto.</p>
        <Link
          href="/admin/proyectos/nuevo"
          className="mt-4 inline-flex h-10 items-center rounded-[3px] bg-fg px-4 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-accent-fg"
        >
          Crear el primero
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <p role="alert" className="border-l-2 border-accent pl-3 text-sm text-fg">
          {error}
        </p>
      ) : null}

      <ul className="flex flex-col gap-2">
        {projects.map((project) => {
          const isBusy = pending && busyId === project.id;
          const isConfirming = confirmId === project.id;

          return (
            <li
              key={project.id}
              className={cn(
                "rounded-[4px] border border-line bg-bg transition-opacity",
                isBusy && "opacity-60",
              )}
            >
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="h-16 w-full shrink-0 overflow-hidden bg-bg-alt sm:w-24">
                  {project.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element -- miniatura del panel, no del sitio publico
                    <img
                      src={project.coverImage.url}
                      alt=""
                      className="size-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/proyectos/${project.id}`}
                      className="text-sm font-medium text-fg underline-offset-4 hover:underline"
                    >
                      {project.title.es || project.slug}
                    </Link>
                    <span
                      className={cn(
                        "rounded-[2px] border px-1.5 py-0.5 text-[0.625rem] tracking-[0.08em] uppercase",
                        STATUS_STYLE[project.status],
                      )}
                    >
                      {STATUS_LABEL[project.status]}
                    </span>
                    {project.featured ? (
                      <span className="rounded-[2px] border border-line px-1.5 py-0.5 text-[0.625rem] tracking-[0.08em] text-fg-subtle uppercase">
                        Destacado
                      </span>
                    ) : null}
                    {project.isConcept ? (
                      <span className="rounded-[2px] border border-line px-1.5 py-0.5 text-[0.625rem] tracking-[0.08em] text-fg-subtle uppercase">
                        Conceptual
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 truncate text-xs text-fg-subtle">
                    /proyectos/{project.slug}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {project.status === "published" ? (
                    <RowButton
                      onClick={() => changeStatus(project.id, "draft")}
                      disabled={pending}
                    >
                      Despublicar
                    </RowButton>
                  ) : (
                    <RowButton
                      onClick={() => changeStatus(project.id, "published")}
                      disabled={pending}
                    >
                      Publicar
                    </RowButton>
                  )}

                  <Link
                    href={`/admin/proyectos/${project.id}`}
                    className="inline-flex h-8 items-center rounded-[3px] border border-line px-3 text-xs text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
                  >
                    Editar
                  </Link>

                  {isConfirming ? (
                    <span className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => remove(project.id)}
                        disabled={pending}
                        className="inline-flex h-8 items-center rounded-[3px] bg-accent px-3 text-xs font-medium text-accent-fg disabled:opacity-60"
                      >
                        Sí, eliminar
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        className="inline-flex h-8 items-center rounded-[3px] px-2 text-xs text-fg-muted hover:text-fg"
                      >
                        Cancelar
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmId(project.id)}
                      className="inline-flex h-8 items-center rounded-[3px] px-2 text-xs text-fg-subtle transition-colors hover:text-accent"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>

              {isConfirming ? (
                <p className="border-t border-line px-4 py-2.5 text-xs text-fg-muted">
                  Se eliminará «{project.title.es || project.slug}» de forma
                  permanente. Si solo quieres retirarlo del sitio, usa
                  Despublicar.
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function RowButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-8 items-center rounded-[3px] border border-line-strong px-3 text-xs text-fg transition-colors hover:bg-fg hover:text-bg disabled:opacity-60"
    >
      {children}
    </button>
  );
}
