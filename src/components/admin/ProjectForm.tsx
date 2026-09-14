"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { LOCALES } from "@/config/site";
import { saveProject } from "@/lib/admin/actions";
import { PROJECT_CATEGORIES, PUBLISH_STATUSES } from "@/lib/admin/schemas";
import { slugify } from "@/lib/slug";
import type {
  Localized,
  Project,
  ProjectCategory,
  ProjectImage,
  PublishStatus,
} from "@/types/content";
import {
  CheckboxField,
  LocalizedField,
  SelectField,
  TagsField,
  TextField,
} from "./fields";
import { ImageUploader } from "./ImageUploader";

const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  residential: "Residencial",
  commercial: "Comercial",
  remodeling: "Remodelación",
  maintenance: "Mantenimiento",
  executive: "Proyecto ejecutivo",
  other: "Otro",
};

const STATUS_LABELS: Record<PublishStatus, string> = {
  draft: "Borrador — no se ve en el sitio",
  published: "Publicado — visible para todos",
  archived: "Archivado — retirado del sitio",
};

const emptyLocalized = (): Localized =>
  Object.fromEntries(LOCALES.map((locale) => [locale, ""])) as Localized;

function blankProject(): Project {
  return {
    id: "",
    slug: "",
    title: emptyLocalized(),
    summary: emptyLocalized(),
    description: emptyLocalized(),
    category: "residential",
    location: emptyLocalized(),
    year: "",
    client: null,
    area: "",
    status: "draft",
    featured: false,
    // Un proyecto nuevo se asume obra real. Los conceptuales son la excepcion
    // (el contenido de muestra) y hay que marcarlos a mano.
    isConcept: false,
    coverImage: null,
    gallery: [],
    tags: [],
    seo: { title: {}, description: {}, ogImage: null },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Formulario de proyecto.
 *
 * La portada y la galeria se editan como una sola lista ordenada: la primera
 * imagen es la portada. Es mas facil de explicar que dos campos separados, y
 * cambiar la portada se convierte en reordenar.
 */
export function ProjectForm({
  project,
  isNew,
}: {
  project: Project | null;
  isNew: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<
    { kind: "ok" | "error"; text: string } | null
  >(null);

  const initial = useMemo(() => project ?? blankProject(), [project]);

  const [values, setValues] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [images, setImages] = useState<ProjectImage[]>(() =>
    initial.coverImage ? [initial.coverImage, ...initial.gallery] : initial.gallery,
  );

  const update = <K extends keyof Project>(key: K, value: Project[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  // Mientras nadie edite el slug a mano, sigue al titulo en espanol. En cuanto
  // se toca, deja de moverse: cambiar la URL de un proyecto ya publicado
  // rompe los enlaces que Google tenga indexados.
  function onTitleChange(next: Localized) {
    update("title", next);
    if (!slugTouched) update("slug", slugify(next.es));
  }

  function submit(status?: PublishStatus) {
    const finalStatus = status ?? values.status;
    setFeedback(null);

    const payload = {
      ...(values.id ? { id: values.id } : {}),
      slug: values.slug || slugify(values.title.es),
      title: values.title,
      summary: values.summary,
      description: values.description,
      category: values.category,
      location: values.location,
      year: values.year?.trim() ? values.year.trim() : null,
      client: values.client,
      area: values.area?.trim() ? values.area.trim() : null,
      status: finalStatus,
      featured: values.featured,
      isConcept: values.isConcept,
      coverImage: images[0] ?? null,
      gallery: images.slice(1).map((image, index) => ({
        ...image,
        position: index,
      })),
      tags: values.tags,
      seo: {
        title: { ...emptyLocalized(), ...values.seo.title },
        description: { ...emptyLocalized(), ...values.seo.description },
        ogImage: values.seo.ogImage,
      },
      position: 0,
    };

    startTransition(async () => {
      const result = await saveProject(payload);
      if (!result.ok) {
        setFeedback({ kind: "error", text: result.error });
        return;
      }
      // El estado local tiene que reflejar lo que se acaba de guardar. Sin
      // esto, tras "Guardar y publicar" el formulario seguia en borrador y el
      // siguiente "Guardar" despublicaba el proyecto sin avisar.
      setValues((current) => ({
        ...current,
        status: finalStatus,
        slug: payload.slug,
        id: result.id ?? current.id,
      }));
      setFeedback({ kind: "ok", text: result.message ?? "Guardado." });
      if (isNew && result.id) {
        router.replace(`/admin/proyectos/${result.id}`);
      }
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="flex flex-col gap-8"
    >
      <Panel title="Identificación">
        <LocalizedField
          label="Nombre del proyecto"
          value={values.title}
          onChange={onTitleChange}
        />

        <TextField
          label="Dirección web (slug)"
          value={values.slug}
          onChange={(next) => {
            setSlugTouched(true);
            update("slug", slugify(next));
          }}
          hint={`El proyecto se verá en /proyectos/${values.slug || "nombre-del-proyecto"}. Evita cambiarlo si ya está publicado: los enlaces antiguos dejarían de funcionar.`}
        />

        <LocalizedField
          label="Resumen"
          value={values.summary}
          onChange={(next) => update("summary", next)}
          multiline
          rows={2}
          hint="Una o dos líneas. Es lo que se lee en la tarjeta del listado."
        />

        <LocalizedField
          label="Descripción completa"
          value={values.description}
          onChange={(next) => update("description", next)}
          multiline
          rows={7}
          hint="Texto de la ficha del proyecto. Los saltos de línea se respetan."
        />
      </Panel>

      <Panel title="Ficha técnica">
        <div className="grid gap-5 md:grid-cols-2">
          <SelectField
            label="Categoría"
            value={values.category}
            onChange={(next) => update("category", next)}
            options={PROJECT_CATEGORIES.map((category) => ({
              value: category,
              label: CATEGORY_LABELS[category],
            }))}
          />
          <TextField
            label="Año"
            value={values.year ?? ""}
            onChange={(next) => update("year", next)}
            hint="Déjalo vacío si no aplica."
          />
        </div>

        <LocalizedField
          label="Ubicación"
          value={values.location}
          onChange={(next) => update("location", next)}
        />

        <div className="grid gap-5 md:grid-cols-2">
          <TextField
            label="Superficie"
            value={values.area ?? ""}
            onChange={(next) => update("area", next)}
            hint="Opcional. Por ejemplo: 180 m²."
          />
          <TagsField
            label="Etiquetas"
            value={values.tags}
            onChange={(next) => update("tags", next)}
          />
        </div>

        <CheckboxField
          label="Cliente (opcional)"
          hint="Actívalo solo si el cliente ha dado permiso para aparecer."
          checked={values.client !== null}
          onChange={(checked) =>
            update("client", checked ? emptyLocalized() : null)
          }
        />

        {values.client ? (
          <LocalizedField
            label="Nombre del cliente"
            value={values.client}
            onChange={(next) => update("client", next)}
          />
        ) : null}
      </Panel>

      <Panel
        title="Imágenes"
        description="La primera imagen es la portada del proyecto. Arrastra el orden con las flechas."
      >
        <ImageUploader
          images={images}
          onChange={setImages}
          folder={values.slug || "proyectos"}
        />
      </Panel>

      <Panel
        title="SEO"
        description="Si lo dejas vacío se genera solo a partir del nombre y el resumen. Rellénalo únicamente si quieres un texto distinto en Google."
      >
        <LocalizedField
          label="Título para buscadores"
          value={{ ...emptyLocalized(), ...values.seo.title }}
          onChange={(next) =>
            update("seo", { ...values.seo, title: next })
          }
        />
        <LocalizedField
          label="Descripción para buscadores"
          value={{ ...emptyLocalized(), ...values.seo.description }}
          onChange={(next) =>
            update("seo", { ...values.seo, description: next })
          }
          multiline
          rows={2}
          hint="Lo ideal son unos 150 caracteres."
        />
      </Panel>

      <Panel title="Publicación">
        <SelectField
          label="Estado"
          value={values.status}
          onChange={(next) => update("status", next)}
          options={PUBLISH_STATUSES.map((status) => ({
            value: status,
            label: STATUS_LABELS[status],
          }))}
        />

        <CheckboxField
          label="Proyecto destacado"
          hint="Los destacados pueden usarse en el bloque de proyecto destacado de la portada."
          checked={values.featured}
          onChange={(checked) => update("featured", checked)}
        />

        <CheckboxField
          label="Es un proyecto conceptual"
          hint="Márcalo si no es obra ejecutada por AGM. El sitio mostrará la etiqueta «Proyecto conceptual» de forma visible."
          checked={values.isConcept}
          onChange={(checked) => update("isConcept", checked)}
        />
      </Panel>

      {feedback ? (
        <p
          role="alert"
          className={`border-l-2 pl-3 text-sm ${
            feedback.kind === "ok"
              ? "border-line-strong text-fg-muted"
              : "border-accent text-fg"
          }`}
        >
          {feedback.text}
        </p>
      ) : null}

      <div className="sticky bottom-0 -mx-5 flex flex-wrap items-center gap-3 border-t border-line bg-bg px-5 py-4 sm:-mx-8 sm:px-8">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-[3px] bg-fg px-5 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-accent-fg disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>

        {values.status !== "published" ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => submit("published")}
            className="inline-flex h-10 items-center rounded-[3px] border border-line-strong px-4 text-sm text-fg transition-colors hover:bg-fg hover:text-bg disabled:opacity-60"
          >
            Guardar y publicar
          </button>
        ) : null}

        {!isNew && values.id ? (
          <Link
            href={
              values.status === "published"
                ? `/proyectos/${values.slug}`
                : `/admin/proyectos/${values.id}/vista-previa`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center rounded-[3px] border border-line px-4 text-sm text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
          >
            {values.status === "published" ? "Ver publicado" : "Vista previa"}
          </Link>
        ) : null}

        <Link
          href="/admin/proyectos"
          className="ml-auto text-sm text-fg-subtle underline underline-offset-4 hover:text-fg"
        >
          Volver al listado
        </Link>
      </div>
    </form>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[4px] border border-line bg-bg p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-fg">{title}</h2>
      {description ? (
        <p className="mt-1.5 max-w-[70ch] text-sm leading-relaxed text-fg-muted">
          {description}
        </p>
      ) : null}
      <div className="mt-5 flex flex-col gap-5">{children}</div>
    </section>
  );
}
