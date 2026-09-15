"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LOCALES } from "@/config/site";
import { deleteService, reorderServices, saveService } from "@/lib/admin/actions";
import { slugify } from "@/lib/slug";
import { SERVICE_ICON_KEYS, ServiceIcon } from "@/components/ui/ServiceIcon";
import type { Localized, Service } from "@/types/content";
import { CheckboxField, LocalizedField, SelectField, TextField } from "./fields";
import { useDragReorder } from "./useDragReorder";
import { sameContent, useUnsavedChanges } from "./useUnsavedChanges";

const emptyLocalized = (): Localized =>
  Object.fromEntries(LOCALES.map((locale) => [locale, ""])) as Localized;

function blankService(position: number): Service {
  return {
    id: "",
    slug: "",
    title: emptyLocalized(),
    description: emptyLocalized(),
    icon: "design",
    position,
    active: true,
  };
}

/**
 * Editor de servicios.
 *
 * Cada servicio se guarda por separado en cuanto se pulsa su boton, en lugar
 * de acumular todo en un unico envio: la lista puede tener quince fichas y un
 * fallo al final no debe tirar los cambios de las anteriores.
 *
 * El orden se manipula con flechas y se persiste en el campo `position` de
 * cada fila afectada.
 */
export function ServicesEditor({ services }: { services: Service[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState<Service[]>(services);
  const [openId, setOpenId] = useState<string | null>(null);

  // Version guardada de cada servicio. La posicion no cuenta: el orden se
  // guarda solo al moverlo. Una ficha nueva cuenta como cambio en cuanto tiene
  // nombre.
  const [savedById, setSavedById] = useState<Record<string, Service>>(() =>
    Object.fromEntries(services.map((service) => [service.id, service])),
  );
  const contentOf = (service: Service) => ({ ...service, position: 0 });
  useUnsavedChanges(
    items.some((item) => {
      if (!item.id) return item.title.es.trim().length > 0;
      const stored = savedById[item.id];
      return !stored || !sameContent(contentOf(item), contentOf(stored));
    }),
  );
  const [feedback, setFeedback] = useState<
    { kind: "ok" | "error"; text: string } | null
  >(null);

  const patch = (index: number, changes: Partial<Service>) =>
    setItems((current) =>
      current.map((item, position) =>
        position === index ? { ...item, ...changes } : item,
      ),
    );

  function persist(service: Service, index: number) {
    setFeedback(null);
    const wasNew = !service.id;
    startTransition(async () => {
      const result = await saveService({
        ...(service.id ? { id: service.id } : {}),
        slug: service.slug || slugify(service.title.es),
        title: service.title,
        description: service.description,
        icon: service.icon,
        position: service.position,
        active: service.active,
      });

      setFeedback(
        result.ok
          ? { kind: "ok", text: result.message ?? "Guardado." }
          : { kind: "error", text: result.error },
      );
      if (!result.ok) return;

      const id = result.id ?? service.id;
      const slug = service.slug || slugify(service.title.es);
      setSavedById((current) => ({ ...current, [id]: { ...service, id, slug } }));

      // `items` no se vuelve a sincronizar con las props tras el refresh, asi
      // que el id nuevo se apunta aqui. Sin el, la ficha seguia siendo "nueva"
      // y un segundo guardado la insertaba otra vez.
      if (wasNew && result.id) {
        patch(index, { id, slug });
        setOpenId((current) => (current === `nuevo-${index}` ? id : current));
      }
      router.refresh();
    });
  }

  const { itemRef, dragState } = useDragReorder(items.length, (f, t) =>
    reorder(f, t),
  );

  function reorder(from: number, to: number) {
    const next = [...items];
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);

    const reordered = next.map((entry, position) => ({ ...entry, position }));
    setItems(reordered);

    // Se envia el orden completo y solo el orden: arrastrando, un movimiento
    // corre de sitio a todas las fichas intermedias, y lo que se este editando
    // en otra ficha no debe guardarse sin pulsar su boton.
    const ids = reordered.map((entry) => entry.id).filter(Boolean);

    setFeedback(null);
    startTransition(async () => {
      const result = await reorderServices(ids);
      if (!result.ok) {
        setFeedback({ kind: "error", text: result.error });
        return;
      }
      router.refresh();
    });
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    reorder(index, target);
  }

  function remove(service: Service, index: number) {
    if (!service.id) {
      setItems((current) => current.filter((_, i) => i !== index));
      return;
    }
    startTransition(async () => {
      const result = await deleteService(service.id);
      setFeedback(
        result.ok
          ? { kind: "ok", text: result.message ?? "Eliminado." }
          : { kind: "error", text: result.error },
      );
      if (result.ok) {
        setItems((current) => current.filter((_, i) => i !== index));
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            // La ficha nueva se abre de inmediato. Su clave sigue el mismo
            // patron que usa el render (`nuevo-<indice>`), que para el ultimo
            // elemento es la longitud actual de la lista.
            setOpenId(`nuevo-${items.length}`);
            setItems((current) => [...current, blankService(current.length)]);
          }}
          className="inline-flex h-10 items-center rounded-[3px] bg-fg px-4 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-accent-fg"
        >
          Añadir servicio
        </button>
        {pending ? (
          <span className="text-xs text-fg-subtle">Guardando…</span>
        ) : null}
      </div>

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

      <ul className="flex flex-col gap-2">
        {items.map((service, index) => {
          const key = service.id || `nuevo-${index}`;
          const open = openId === key;

          return (
            <li
              key={key}
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
                <ServiceIcon
                  name={service.icon}
                  className="size-6 shrink-0 text-fg-muted"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">
                    {service.title.es || "Servicio sin nombre"}
                  </p>
                  <p className="truncate text-xs text-fg-subtle">
                    {service.active ? "Visible en el sitio" : "Oculto"}
                    {service.title.en.trim().length === 0
                      ? " · falta la traducción al inglés"
                      : ""}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <SmallButton
                    label="Subir"
                    onClick={() => move(index, -1)}
                    disabled={index === 0 || pending}
                  >
                    ↑
                  </SmallButton>
                  <SmallButton
                    label="Bajar"
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1 || pending}
                  >
                    ↓
                  </SmallButton>
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : key)}
                    aria-expanded={open}
                    className="inline-flex h-8 items-center rounded-[3px] border border-line px-3 text-xs text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
                  >
                    {open ? "Cerrar" : "Editar"}
                  </button>
                </div>
              </div>

              {open ? (
                <div className="flex flex-col gap-5 border-t border-line p-4 sm:p-5">
                  <LocalizedField
                    label="Nombre del servicio"
                    value={service.title}
                    onChange={(next) => {
                      patch(index, { title: next });
                      if (!service.id && !service.slug) {
                        patch(index, { slug: slugify(next.es) });
                      }
                    }}
                  />

                  <LocalizedField
                    label="Descripción"
                    value={service.description}
                    onChange={(next) => patch(index, { description: next })}
                    multiline
                    rows={3}
                  />

                  <div className="grid gap-5 md:grid-cols-2">
                    <SelectField
                      label="Icono"
                      value={service.icon}
                      onChange={(next) => patch(index, { icon: next })}
                      options={SERVICE_ICON_KEYS.map((icon) => ({
                        value: icon,
                        label: ICON_LABELS[icon] ?? icon,
                      }))}
                    />
                    <TextField
                      label="Identificador (slug)"
                      value={service.slug}
                      onChange={(next) => patch(index, { slug: slugify(next) })}
                      hint="Uso interno. Solo minúsculas, números y guiones."
                    />
                  </div>

                  <CheckboxField
                    label="Mostrar en el sitio"
                    checked={service.active}
                    onChange={(checked) => patch(index, { active: checked })}
                  />

                  <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => persist(service, index)}
                      className="inline-flex h-9 items-center rounded-[3px] bg-fg px-4 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-accent-fg disabled:opacity-60"
                    >
                      Guardar servicio
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => remove(service, index)}
                      className="ml-auto text-xs text-fg-subtle transition-colors hover:text-accent"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const ICON_LABELS: Record<string, string> = {
  maintenance: "Mantenimiento",
  remodeling: "Remodelación",
  waterproofing: "Impermeabilización",
  facade: "Fachada",
  design: "Diseño",
  blueprint: "Proyecto ejecutivo",
  consulting: "Consultoría",
  supervision: "Supervisión de obra",
};

function SmallButton({
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
