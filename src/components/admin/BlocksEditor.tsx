"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LOCALES } from "@/config/site";
import { saveBlocks } from "@/lib/admin/actions";
import { useDragReorder } from "./useDragReorder";
import { BLOCK_TYPES, type BlockType, type ContentBlock, type Localized, type Project } from "@/types/content";
import { ImageUploader } from "./ImageUploader";
import { LocalizedField, SelectField, TextField } from "./fields";

const emptyLocalized = (): Localized =>
  Object.fromEntries(LOCALES.map((locale) => [locale, ""])) as Localized;

const BLOCK_LABELS: Record<BlockType, string> = {
  hero: "Portada",
  about: "Sobre AGM",
  services: "Servicios",
  projects: "Proyectos",
  featuredProject: "Proyecto destacado",
  method: "Método",
  values: "Valores",
  stats: "Cifras",
  quote: "Cita",
  text: "Texto",
  image: "Imagen",
  imageGrid: "Retícula de imágenes",
  cta: "Llamada a la acción",
  divider: "Separador",
  contact: "Contacto",
};

const BLOCK_HINTS: Partial<Record<BlockType, string>> = {
  hero: "Se edita en Contenido.",
  about: "Se edita en Contenido.",
  services: "Se edita en Servicios.",
  projects: "Muestra los proyectos publicados.",
  method: "Se edita en Contenido.",
  values: "Se edita en Contenido.",
  contact: "Se edita en Datos del despacho.",
  divider: "Una línea fina de separación.",
};

/** Bloques que solo pueden aparecer una vez en la pagina. */
const SINGLETON_TYPES: BlockType[] = [
  "hero",
  "about",
  "services",
  "projects",
  "method",
  "values",
  "contact",
];

function blankBlock(type: BlockType, position: number): ContentBlock {
  const base = { id: `blk-${Date.now()}-${position}`, position, enabled: true };

  switch (type) {
    case "featuredProject":
      return { ...base, type, data: { projectSlug: "" } };
    case "stats":
      return { ...base, type, data: { items: [] } };
    case "quote":
      return { ...base, type, data: { text: emptyLocalized(), author: null } };
    case "text":
      return { ...base, type, data: { heading: null, body: emptyLocalized() } };
    case "image":
      return { ...base, type, data: { url: "", alt: emptyLocalized(), caption: null } };
    case "imageGrid":
      return { ...base, type, data: { images: [] } };
    case "cta":
      return {
        ...base,
        type,
        data: {
          heading: emptyLocalized(),
          body: null,
          label: emptyLocalized(),
          href: "#contacto",
        },
      };
    default:
      return { ...base, type, data: {} } as ContentBlock;
  }
}

/**
 * Composicion de la portada.
 *
 * El administrador ordena, activa o desactiva bloques de un catalogo cerrado.
 * No hay ningun tipo que acepte HTML ni codigo: cada uno tiene sus campos y su
 * componente, de modo que desde aqui se puede cambiar el contenido del sitio
 * pero nunca ejecutar nada en el navegador de un visitante.
 */
export function BlocksEditor({
  blocks: initialBlocks,
  projects,
}: {
  blocks: ContentBlock[];
  projects: Project[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialBlocks);
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState<BlockType>("text");
  const [feedback, setFeedback] = useState<
    { kind: "ok" | "error"; text: string } | null
  >(null);

  const { itemRef, dragState } = useDragReorder(blocks.length, reorder);

  const usedSingletons = new Set(
    blocks.filter((b) => SINGLETON_TYPES.includes(b.type)).map((b) => b.type),
  );

  const available = BLOCK_TYPES.filter(
    (type) => !SINGLETON_TYPES.includes(type) || !usedSingletons.has(type),
  );

  function reorder(from: number, to: number) {
    const next = [...blocks];
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    setBlocks(next.map((block, position) => ({ ...block, position })));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= blocks.length) return;
    reorder(index, target);
  }

  function save() {
    setFeedback(null);
    startTransition(async () => {
      const result = await saveBlocks(
        blocks.map((block, position) => ({
          id: block.id,
          type: block.type,
          position,
          enabled: block.enabled,
          data: block.data,
        })),
      );
      setFeedback(
        result.ok
          ? { kind: "ok", text: result.message ?? "Guardado." }
          : { kind: "error", text: result.error },
      );
      if (result.ok) router.refresh();
    });
  }

  function patchData(index: number, data: Record<string, unknown>) {
    setBlocks((current) =>
      current.map((block, position) =>
        position === index
          ? ({ ...block, data: { ...block.data, ...data } } as ContentBlock)
          : block,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-3 rounded-[4px] border border-line bg-bg p-4">
        <div className="w-full max-w-xs">
          <SelectField
            label="Añadir bloque"
            value={adding}
            onChange={(next) => setAdding(next)}
            options={available.map((type) => ({
              value: type,
              label: BLOCK_LABELS[type],
            }))}
          />
        </div>
        <button
          type="button"
          onClick={() =>
            setBlocks((current) => [...current, blankBlock(adding, current.length)])
          }
          className="inline-flex h-10 items-center rounded-[3px] border border-line-strong px-4 text-sm text-fg transition-colors hover:bg-fg hover:text-bg"
        >
          Añadir
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {blocks.map((block, index) => {
          const open = openId === block.id;
          const editable = !SINGLETON_TYPES.includes(block.type) && block.type !== "divider";

          return (
            <li
              key={block.id}
              ref={itemRef(index)}
              data-arrastrando={dragState(index).dragging || undefined}
              data-borde={dragState(index).edge ?? undefined}
              className="reordenable rounded-[4px] border border-line bg-bg"
            >
              <div className="flex flex-wrap items-center gap-3 p-4">
                <span
                  aria-hidden="true"
                  title="Arrastra para reordenar"
                  className="cursor-grab select-none text-fg-subtle active:cursor-grabbing"
                >
                  ⠿
                </span>
                <span className="w-6 text-xs tabular-nums text-fg-subtle">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-fg">
                    {BLOCK_LABELS[block.type]}
                  </p>
                  <p className="truncate text-xs text-fg-subtle">
                    {block.enabled ? "Visible" : "Oculto"}
                    {BLOCK_HINTS[block.type]
                      ? ` · ${BLOCK_HINTS[block.type]}`
                      : ""}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <MiniButton
                    label="Subir"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                  >
                    ↑
                  </MiniButton>
                  <MiniButton
                    label="Bajar"
                    onClick={() => move(index, 1)}
                    disabled={index === blocks.length - 1}
                  >
                    ↓
                  </MiniButton>
                  <button
                    type="button"
                    onClick={() =>
                      setBlocks((current) =>
                        current.map((item, position) =>
                          position === index
                            ? { ...item, enabled: !item.enabled }
                            : item,
                        ),
                      )
                    }
                    className="inline-flex h-8 items-center rounded-[3px] border border-line px-3 text-xs text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
                  >
                    {block.enabled ? "Ocultar" : "Mostrar"}
                  </button>
                  {editable ? (
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : block.id)}
                      aria-expanded={open}
                      className="inline-flex h-8 items-center rounded-[3px] border border-line px-3 text-xs text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
                    >
                      {open ? "Cerrar" : "Editar"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() =>
                      setBlocks((current) =>
                        current.filter((_, position) => position !== index),
                      )
                    }
                    className="px-2 text-xs text-fg-subtle transition-colors hover:text-accent"
                  >
                    Quitar
                  </button>
                </div>
              </div>

              {open && editable ? (
                <div className="flex flex-col gap-5 border-t border-line p-4 sm:p-5">
                  <BlockFields
                    block={block}
                    projects={projects}
                    onChange={(data) => patchData(index, data)}
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

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

      <div className="sticky bottom-0 -mx-5 flex items-center gap-3 border-t border-line bg-bg px-5 py-4 sm:-mx-8 sm:px-8">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="inline-flex h-10 items-center rounded-[3px] bg-fg px-5 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-accent-fg disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar composición"}
        </button>
        <span className="text-xs text-fg-subtle">
          Los cambios no se aplican hasta que guardas.
        </span>
      </div>
    </div>
  );
}

function BlockFields({
  block,
  projects,
  onChange,
}: {
  block: ContentBlock;
  projects: Project[];
  onChange: (data: Record<string, unknown>) => void;
}) {
  switch (block.type) {
    case "featuredProject":
      return (
        <SelectField
          label="Proyecto"
          value={block.data.projectSlug}
          onChange={(next) => onChange({ projectSlug: next })}
          hint="Solo se muestra si el proyecto está publicado."
          options={[
            { value: "", label: "Selecciona un proyecto" },
            ...projects.map((project) => ({
              value: project.slug,
              label: `${project.title.es || project.slug}${
                project.status === "published" ? "" : " (sin publicar)"
              }`,
            })),
          ]}
        />
      );

    case "quote":
      return (
        <>
          <LocalizedField
            label="Cita"
            value={block.data.text}
            onChange={(next) => onChange({ text: next })}
            multiline
            rows={3}
          />
          <TextField
            label="Autor"
            value={block.data.author ?? ""}
            onChange={(next) => onChange({ author: next || null })}
            hint="Opcional."
          />
        </>
      );

    case "text":
      return (
        <>
          <LocalizedField
            label="Título"
            value={block.data.heading ?? emptyLocalized()}
            onChange={(next) => onChange({ heading: next })}
            hint="Déjalo vacío para mostrar solo el texto."
          />
          <LocalizedField
            label="Texto"
            value={block.data.body}
            onChange={(next) => onChange({ body: next })}
            multiline
            rows={6}
          />
        </>
      );

    case "cta":
      return (
        <>
          <LocalizedField
            label="Título"
            value={block.data.heading}
            onChange={(next) => onChange({ heading: next })}
          />
          <LocalizedField
            label="Texto"
            value={block.data.body ?? emptyLocalized()}
            onChange={(next) => onChange({ body: next })}
            multiline
            rows={2}
          />
          <LocalizedField
            label="Texto del botón"
            value={block.data.label}
            onChange={(next) => onChange({ label: next })}
          />
          <TextField
            label="Destino del botón"
            value={block.data.href}
            onChange={(next) => onChange({ href: next })}
            hint="Un ancla (#contacto) o una ruta interna (/…)."
          />
        </>
      );

    case "stats":
      return (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() =>
              onChange({
                items: [
                  ...block.data.items,
                  { label: emptyLocalized(), value: "" },
                ],
              })
            }
            className="self-start rounded-[3px] border border-line px-2.5 py-1 text-xs text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
          >
            Añadir cifra
          </button>

          {block.data.items.map((item, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-[3px] border border-line p-3"
            >
              <TextField
                label="Cifra"
                value={item.value}
                onChange={(next) =>
                  onChange({
                    items: block.data.items.map((entry, i) =>
                      i === index ? { ...entry, value: next } : entry,
                    ),
                  })
                }
              />
              <LocalizedField
                label="Etiqueta"
                value={item.label}
                onChange={(next) =>
                  onChange({
                    items: block.data.items.map((entry, i) =>
                      i === index ? { ...entry, label: next } : entry,
                    ),
                  })
                }
              />
              <button
                type="button"
                onClick={() =>
                  onChange({
                    items: block.data.items.filter((_, i) => i !== index),
                  })
                }
                className="self-end text-xs text-fg-subtle transition-colors hover:text-accent"
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      );

    case "image":
      return (
        <>
          <ImageUploader
            folder="bloques"
            firstIsCover={false}
            images={
              block.data.url
                ? [
                    {
                      id: block.data.url,
                      url: block.data.url,
                      alt: block.data.alt,
                      position: 0,
                      width: null,
                      height: null,
                    },
                  ]
                : []
            }
            onChange={(images) => {
              const last = images[images.length - 1];
              onChange(
                last
                  ? { url: last.url, alt: last.alt }
                  : { url: "", alt: emptyLocalized() },
              );
            }}
          />
          <LocalizedField
            label="Pie de foto"
            value={block.data.caption ?? emptyLocalized()}
            onChange={(next) => onChange({ caption: next })}
            hint="Opcional."
          />
        </>
      );

    case "imageGrid":
      return (
        <ImageUploader
          folder="bloques"
          firstIsCover={false}
          images={block.data.images.map((image, index) => ({
            id: `${image.url}-${index}`,
            url: image.url,
            alt: image.alt,
            position: index,
            width: null,
            height: null,
          }))}
          onChange={(images) =>
            onChange({
              images: images.map((image) => ({ url: image.url, alt: image.alt })),
            })
          }
        />
      );

    default:
      return null;
  }
}

function MiniButton({
  label,
  children,
  onClick,
  disabled,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex size-8 items-center justify-center rounded-[3px] border border-line text-sm text-fg-muted transition-colors hover:border-line-strong hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
