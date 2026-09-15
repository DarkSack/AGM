import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { MediaCleanupButton } from "@/components/admin/MediaCleanupButton";
import { SeedContentButton } from "@/components/admin/SeedContentButton";
import { requireStaff } from "@/lib/admin/auth";
import { getDashboardStats } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // La consulta arranca a la vez que la comprobacion de sesion. Son dos
  // viajes de red independientes y encadenarlos duplicaba la espera al
  // cambiar de seccion. La autorizacion se sigue resolviendo antes de
  // renderizar nada, y RLS protege la consulta pase lo que pase.
  const [{ profile }, stats] = await Promise.all([
    requireStaff(),
    getDashboardStats(),
  ]);

  const missing = [
    stats.missingContent.settings ? "textos" : null,
    stats.missingContent.services ? "servicios" : null,
    stats.missingContent.blocks ? "composición de portada" : null,
  ].filter((item): item is string => item !== null);

  const lastUpdate = stats.lastUpdate
    ? new Intl.DateTimeFormat("es-MX", {
        dateStyle: "long",
        timeStyle: "short",
      }).format(new Date(stats.lastUpdate))
    : "Sin cambios registrados";

  return (
    <AdminShell
      profile={profile}
      title={`Hola${profile.fullName ? `, ${profile.fullName.split(" ")[0]}` : ""}`}
      description="Resumen del sitio y accesos rápidos a lo que se usa a diario."
      actions={
        <Link
          href="/admin/proyectos/nuevo"
          className="inline-flex h-10 items-center rounded-[3px] bg-fg px-4 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-accent-fg"
        >
          Nuevo proyecto
        </Link>
      }
    >
      <div className="flex flex-col gap-8">
        {missing.length > 0 ? (
          <section
            aria-labelledby="contenido-inicial"
            className="rounded-[4px] border border-accent bg-bg p-5"
          >
            <h2 id="contenido-inicial" className="text-sm font-semibold text-fg">
              El sitio todavía muestra el contenido de ejemplo
            </h2>
            <p className="mt-1.5 mb-4 max-w-[70ch] text-sm leading-relaxed text-fg-muted">
              Aún no hay {missing.join(", ")} guardados en la base de datos, así
              que el panel aparece vacío en esas secciones. Cárgalos para
              editarlos en lugar de escribirlos desde cero. Solo se rellena lo
              que falta; no se borra nada ni se añaden los proyectos de muestra.
            </p>
            <SeedContentButton />
          </section>
        ) : null}

        <section aria-labelledby="cifras">
          <h2 id="cifras" className="sr-only">
            Cifras del sitio
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              label="Proyectos publicados"
              value={stats.projectsPublished}
              detail={`${stats.projectsTotal} en total`}
              href="/admin/proyectos"
            />
            <Stat
              label="En borrador"
              value={stats.projectsDraft}
              detail={
                stats.projectsArchived > 0
                  ? `${stats.projectsArchived} archivados`
                  : "No se muestran en el sitio"
              }
              href="/admin/proyectos"
            />
            <Stat
              label="Servicios activos"
              value={stats.servicesActive}
              detail={`${stats.servicesTotal} configurados`}
              href="/admin/servicios"
            />
            <Stat
              label="Mensajes sin leer"
              value={stats.messagesUnread}
              detail={`${stats.messagesTotal} recibidos`}
              href="/admin/mensajes"
              highlight={stats.messagesUnread > 0}
            />
          </div>
        </section>

        <section
          aria-labelledby="estado"
          className="rounded-[4px] border border-line bg-bg p-5"
        >
          <h2 id="estado" className="text-sm font-semibold text-fg">
            Última actualización del sitio
          </h2>
          <p className="mt-1.5 text-sm text-fg-muted">{lastUpdate}</p>
        </section>

        <section
          aria-labelledby="almacenamiento"
          className="rounded-[4px] border border-line bg-bg p-5"
        >
          <h2 id="almacenamiento" className="text-sm font-semibold text-fg">
            Almacenamiento de imágenes
          </h2>
          <p className="mt-1.5 mb-4 max-w-[70ch] text-sm leading-relaxed text-fg-muted">
            Las fotos que se suben y luego se quitan sin guardar siguen ocupando
            espacio. Esto borra las que no usa ningún proyecto, bloque ni texto
            del sitio y tienen más de un día.
          </p>
          <MediaCleanupButton />
        </section>

        <section aria-labelledby="atajos">
          <h2 id="atajos" className="text-sm font-semibold text-fg">
            Qué puedes hacer aquí
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Shortcut
              href="/admin/proyectos/nuevo"
              title="Publicar un proyecto"
              body="Sube las fotos, escribe la descripción y publícalo. Puedes dejarlo en borrador y terminarlo después."
            />
            <Shortcut
              href="/admin/contenido"
              title="Cambiar los textos"
              body="Titular de portada, presentación del despacho, método de trabajo y valores."
            />
            <Shortcut
              href="/admin/servicios"
              title="Ajustar los servicios"
              body="Añadir, reordenar, desactivar o reescribir cualquiera de los servicios."
            />
            <Shortcut
              href="/admin/despacho"
              title="Datos de contacto"
              body="Teléfono, correo, redes y ubicación. Se actualizan en toda la web a la vez."
            />
            <Shortcut
              href="/admin/bloques"
              title="Ordenar la portada"
              body="Decide qué secciones aparecen y en qué orden."
            />
            <Shortcut
              href="/admin/seo"
              title="Posicionamiento"
              body="Título y descripción que ve Google, en español y en inglés."
            />
          </ul>
        </section>
      </div>
    </AdminShell>
  );
}

function Stat({
  label,
  value,
  detail,
  href,
  highlight = false,
}: {
  label: string;
  value: number;
  detail: string;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col rounded-[4px] border border-line bg-bg p-5 transition-colors hover:border-line-strong"
    >
      <span className="text-xs tracking-[0.06em] text-fg-muted uppercase">
        {label}
      </span>
      <span
        className={`mt-3 text-3xl font-semibold tabular-nums ${
          highlight ? "text-accent" : "text-fg"
        }`}
      >
        {value}
      </span>
      <span className="mt-1 text-xs text-fg-subtle">{detail}</span>
    </Link>
  );
}

function Shortcut({
  href,
  title,
  body,
}: {
  href: string;
  title: string;
  body: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex h-full flex-col rounded-[4px] border border-line bg-bg p-5 transition-colors hover:border-line-strong"
      >
        <span className="text-sm font-medium text-fg">{title}</span>
        <span className="mt-1.5 text-sm leading-relaxed text-fg-muted">
          {body}
        </span>
      </Link>
    </li>
  );
}
