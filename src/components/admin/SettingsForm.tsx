"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { LOCALES } from "@/config/site";
import { saveSettings } from "@/lib/admin/actions";
import type { Localized, SiteSettings } from "@/types/content";
import { ImageUploader } from "./ImageUploader";
import { LocalizedField, TextField } from "./fields";

const emptyLocalized = (): Localized =>
  Object.fromEntries(LOCALES.map((locale) => [locale, ""])) as Localized;

export type SettingsSection = "contenido" | "despacho" | "seo" | "privacidad";

/**
 * Editor de la configuracion del sitio.
 *
 * Los ajustes viven en una unica fila `jsonb`, asi que cualquier pantalla que
 * toque una parte tiene que enviar el objeto completo. Para evitar que guardar
 * en "SEO" borre lo escrito en "Contenido", el formulario recibe siempre los
 * ajustes enteros y solo muestra la seccion pedida.
 */
export function SettingsForm({
  settings,
  section,
}: {
  settings: SiteSettings;
  section: SettingsSection;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<SiteSettings>(settings);
  const [feedback, setFeedback] = useState<
    { kind: "ok" | "error"; text: string } | null
  >(null);

  function save() {
    setFeedback(null);
    startTransition(async () => {
      // Se envia el objeto completo, no solo la seccion visible.
      const result = await saveSettings({
        hero: values.hero,
        about: values.about,
        method: values.method,
        values: values.values,
        seo: values.seo,
        contact: values.contact,
        privacy: values.privacy,
      });

      setFeedback(
        result.ok
          ? { kind: "ok", text: result.message ?? "Guardado." }
          : { kind: "error", text: result.error },
      );
      if (result.ok) router.refresh();
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
      className="flex flex-col gap-8"
    >
      {section === "contenido" ? (
        <ContentSection values={values} setValues={setValues} />
      ) : null}
      {section === "despacho" ? (
        <ContactSection values={values} setValues={setValues} />
      ) : null}
      {section === "seo" ? (
        <SeoSection values={values} setValues={setValues} />
      ) : null}
      {section === "privacidad" ? (
        <PrivacySection values={values} setValues={setValues} />
      ) : null}

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
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-[3px] bg-fg px-5 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-accent-fg disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
        <span className="text-xs text-fg-subtle">
          Se aplican al sitio en cuanto guardas.
        </span>
      </div>
    </form>
  );
}

type SectionProps = {
  values: SiteSettings;
  setValues: React.Dispatch<React.SetStateAction<SiteSettings>>;
};

function ContentSection({ values, setValues }: SectionProps) {
  const setHero = (changes: Partial<SiteSettings["hero"]>) =>
    setValues((current) => ({ ...current, hero: { ...current.hero, ...changes } }));

  const setAbout = (changes: Partial<SiteSettings["about"]>) =>
    setValues((current) => ({
      ...current,
      about: { ...current.about, ...changes },
    }));

  return (
    <>
      <Panel
        title="Portada"
        description="Lo primero que ve alguien que llega desde Google."
      >
        <LocalizedField
          label="Antetítulo"
          value={values.hero.eyebrow}
          onChange={(next) => setHero({ eyebrow: next })}
          hint="La línea pequeña sobre el titular."
        />
        <LocalizedField
          label="Titular"
          value={values.hero.title}
          onChange={(next) => setHero({ title: next })}
        />
        <LocalizedField
          label="Subtítulo"
          value={values.hero.subtitle}
          onChange={(next) => setHero({ subtitle: next })}
          multiline
          rows={2}
        />

        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-[3px] border border-line p-4">
            <span className="text-xs font-medium tracking-[0.06em] text-fg-muted uppercase">
              Botón principal
            </span>
            <LocalizedField
              label="Texto"
              value={values.hero.primaryCta.label}
              onChange={(next) =>
                setHero({
                  primaryCta: { ...values.hero.primaryCta, label: next },
                })
              }
            />
            <TextField
              label="Destino"
              value={values.hero.primaryCta.href}
              onChange={(next) =>
                setHero({
                  primaryCta: { ...values.hero.primaryCta, href: next },
                })
              }
              hint="Un ancla de la propia página (#proyectos) o una ruta interna (/…)."
            />
          </div>

          <div className="flex flex-col gap-3 rounded-[3px] border border-line p-4">
            <span className="text-xs font-medium tracking-[0.06em] text-fg-muted uppercase">
              Botón secundario
            </span>
            <LocalizedField
              label="Texto"
              value={values.hero.secondaryCta.label}
              onChange={(next) =>
                setHero({
                  secondaryCta: { ...values.hero.secondaryCta, label: next },
                })
              }
            />
            <TextField
              label="Destino"
              value={values.hero.secondaryCta.href}
              onChange={(next) =>
                setHero({
                  secondaryCta: { ...values.hero.secondaryCta, href: next },
                })
              }
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium tracking-[0.06em] text-fg-muted uppercase">
            Imagen de portada
          </span>
          <p className="text-sm leading-relaxed text-fg-muted">
            Sin imagen se muestra el dibujo arquitectónico que trae el sitio.
            Sube una fotografía apaisada y de buena calidad para sustituirlo.
          </p>
          <ImageUploader
            folder="portada"
            firstIsCover={false}
            images={
              values.hero.image
                ? [
                    {
                      id: "hero",
                      url: values.hero.image.url,
                      alt: values.hero.image.alt,
                      position: 0,
                      width: null,
                      height: null,
                    },
                  ]
                : []
            }
            onChange={(images) => {
              const first = images[images.length - 1];
              setHero({
                image: first ? { url: first.url, alt: first.alt } : null,
              });
            }}
          />
        </div>
      </Panel>

      <Panel
        title="Sobre AGM"
        description="La presentación del despacho. Deja los corchetes hasta tener la información real."
      >
        <TextField
          label="Nombre del arquitecto"
          value={values.about.architectName}
          onChange={(next) => setAbout({ architectName: next })}
          hint="Aparece en la ficha lateral."
        />
        <LocalizedField
          label="Cargo o titulación"
          value={values.about.role}
          onChange={(next) => setAbout({ role: next })}
        />
        <LocalizedField
          label="Entradilla"
          value={values.about.intro}
          onChange={(next) => setAbout({ intro: next })}
          multiline
          rows={3}
        />

        <ParagraphList
          label="Párrafos"
          hint="El cuerpo del texto. Añade tantos como necesites."
          items={values.about.body}
          onChange={(body) => setAbout({ body })}
        />

        <LocalizedField
          label="Frase de filosofía"
          value={values.about.philosophy}
          onChange={(next) => setAbout({ philosophy: next })}
          multiline
          rows={2}
        />
      </Panel>

      <Panel
        title="Método de trabajo"
        description="Las etapas por las que pasa un proyecto."
      >
        <StepList
          steps={values.method}
          onChange={(method) => setValues((current) => ({ ...current, method }))}
        />
      </Panel>

      <Panel title="Valores" description="Los cuatro conceptos de la banda oscura.">
        <ValueList
          items={values.values}
          onChange={(next) =>
            setValues((current) => ({ ...current, values: next }))
          }
        />
      </Panel>
    </>
  );
}

function ContactSection({ values, setValues }: SectionProps) {
  const setContact = (changes: Partial<SiteSettings["contact"]>) =>
    setValues((current) => ({
      ...current,
      contact: { ...current.contact, ...changes },
    }));

  return (
    <Panel
      title="Datos del despacho"
      description="Se usan en la sección de contacto, en el pie y en los datos estructurados que lee Google. Lo que dejes vacío usa el valor por defecto del código."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <TextField
          label="Teléfono"
          value={values.contact.phone ?? ""}
          onChange={(next) => setContact({ phone: next || null })}
          hint="Diez dígitos. Se usa también para el enlace de WhatsApp."
        />
        <TextField
          label="Correo electrónico"
          type="email"
          value={values.contact.email ?? ""}
          onChange={(next) => setContact({ email: next || null })}
        />
        <TextField
          label="URL de Facebook"
          value={values.contact.facebookUrl ?? ""}
          onChange={(next) => setContact({ facebookUrl: next || null })}
          hint="Enlace completo. Mientras esté vacío, el sitio muestra el nombre de la página sin enlazarla."
        />
        <TextField
          label="URL de Instagram"
          value={values.contact.instagramUrl ?? ""}
          onChange={(next) => setContact({ instagramUrl: next || null })}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <TextField
          label="Calle y número"
          value={values.contact.addressLine ?? ""}
          onChange={(next) => setContact({ addressLine: next || null })}
        />
        <TextField
          label="Ciudad"
          value={values.contact.city ?? ""}
          onChange={(next) => setContact({ city: next || null })}
          hint="Sustituye a la dirección de la configuración. Si la dejas vacía se usa esa; en ambos casos se publica en los datos estructurados."
        />
        <TextField
          label="Estado"
          value={values.contact.state ?? ""}
          onChange={(next) => setContact({ state: next || null })}
        />
        <TextField
          label="País"
          value={values.contact.country ?? ""}
          onChange={(next) => setContact({ country: next || null })}
        />
      </div>

      <TextField
        label="Horario de atención"
        value={(values.contact.openingHours ?? []).join(" | ")}
        onChange={(next) =>
          setContact({
            openingHours: next.trim()
              ? next
                  .split("|")
                  .map((line) => line.trim())
                  .filter(Boolean)
              : null,
          })
        }
        hint="Separa las líneas con |. Por ejemplo: Lu-Vi 9:00-18:00 | Sa 9:00-14:00. Déjalo vacío si prefieres no publicarlo."
      />
    </Panel>
  );
}

function SeoSection({ values, setValues }: SectionProps) {
  const setSeo = (changes: Partial<SiteSettings["seo"]>) =>
    setValues((current) => ({ ...current, seo: { ...current.seo, ...changes } }));

  return (
    <Panel
      title="Buscadores"
      description="El título y la descripción que aparecen en el resultado de Google, y la imagen que se ve al compartir el enlace."
    >
      <LocalizedField
        label="Título"
        value={values.seo.title}
        onChange={(next) => setSeo({ title: next })}
        hint="Entre 50 y 60 caracteres funciona bien. Más largo, Google lo recorta."
      />

      <LocalizedField
        label="Descripción"
        value={values.seo.description}
        onChange={(next) => setSeo({ description: next })}
        multiline
        rows={3}
        hint="Alrededor de 150 caracteres. No influye en el posicionamiento directamente, pero sí en cuánta gente hace clic."
      />

      <div className="grid gap-5 md:grid-cols-2">
        {LOCALES.map((locale) => (
          <TextField
            key={locale}
            label={`Palabras clave (${locale})`}
            value={values.seo.keywords[locale].join(", ")}
            onChange={(next) =>
              setSeo({
                keywords: {
                  ...values.seo.keywords,
                  [locale]: next
                    .split(",")
                    .map((keyword) => keyword.trim())
                    .filter(Boolean),
                },
              })
            }
            hint="Separadas por comas. Describen el negocio; no las repitas dentro de los textos de forma artificial."
          />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium tracking-[0.06em] text-fg-muted uppercase">
          Imagen al compartir
        </span>
        <p className="text-sm leading-relaxed text-fg-muted">
          Es la miniatura que aparece al pegar el enlace en WhatsApp, Facebook o
          LinkedIn. Lo ideal es una imagen apaisada de 1200 × 630 píxeles.
        </p>
        <ImageUploader
          folder="og"
          firstIsCover={false}
          images={
            values.seo.ogImage
              ? [
                  {
                    id: "og",
                    url: values.seo.ogImage,
                    alt: emptyLocalized(),
                    position: 0,
                    width: null,
                    height: null,
                  },
                ]
              : []
          }
          onChange={(images) => {
            const last = images[images.length - 1];
            setSeo({ ogImage: last ? last.url : null });
          }}
        />
      </div>
    </Panel>
  );
}

function PrivacySection({ values, setValues }: SectionProps) {
  return (
    <Panel
      title="Aviso de privacidad"
      description="El texto legal que explica qué datos recoge el formulario, para qué se usan y cómo ejercer los derechos ARCO. Debe redactarlo o revisarlo quien asesore legalmente al despacho."
    >
      <LocalizedField
        label="Texto del aviso"
        value={values.privacy.body}
        onChange={(body) =>
          setValues((current) => ({ ...current, privacy: { body } }))
        }
        multiline
        rows={18}
        hint="Separa los apartados con una línea en blanco. Mientras el español esté vacío, la página muestra un aviso provisional y Google no la indexa. Si falta el inglés, se muestra el español."
      />
    </Panel>
  );
}

/* ------------------------------------------------------------------ */

function ParagraphList({
  label,
  hint,
  items,
  onChange,
}: {
  label: string;
  hint?: string;
  items: Localized[];
  onChange: (items: Localized[]) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium tracking-[0.06em] text-fg-muted uppercase">
          {label}
        </span>
        <button
          type="button"
          onClick={() => onChange([...items, emptyLocalized()])}
          className="rounded-[3px] border border-line px-2.5 py-1 text-xs text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
        >
          Añadir párrafo
        </button>
      </div>

      {hint ? <p className="text-xs text-fg-subtle">{hint}</p> : null}

      {items.map((paragraph, index) => (
        <div
          key={index}
          className="flex flex-col gap-2 rounded-[3px] border border-line p-3"
        >
          <LocalizedField
            label={`Párrafo ${index + 1}`}
            value={paragraph}
            onChange={(next) =>
              onChange(items.map((item, i) => (i === index ? next : item)))
            }
            multiline
            rows={4}
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
            className="self-end text-xs text-fg-subtle transition-colors hover:text-accent"
          >
            Quitar párrafo
          </button>
        </div>
      ))}
    </div>
  );
}

function StepList({
  steps,
  onChange,
}: {
  steps: SiteSettings["method"];
  onChange: (steps: SiteSettings["method"]) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() =>
          onChange([
            ...steps,
            {
              id: `step-${Date.now()}`,
              number: String(steps.length + 1).padStart(2, "0"),
              title: emptyLocalized(),
              description: emptyLocalized(),
              position: steps.length,
            },
          ])
        }
        className="self-start rounded-[3px] border border-line px-2.5 py-1 text-xs text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
      >
        Añadir etapa
      </button>

      {steps.map((step, index) => (
        <div
          key={step.id}
          className="flex flex-col gap-3 rounded-[3px] border border-line p-3"
        >
          <div className="grid gap-3 md:grid-cols-[6rem_1fr]">
            <TextField
              label="Nº"
              value={step.number}
              onChange={(next) =>
                onChange(
                  steps.map((item, i) =>
                    i === index ? { ...item, number: next } : item,
                  ),
                )
              }
            />
            <LocalizedField
              label="Título"
              value={step.title}
              onChange={(next) =>
                onChange(
                  steps.map((item, i) =>
                    i === index ? { ...item, title: next } : item,
                  ),
                )
              }
            />
          </div>

          <LocalizedField
            label="Descripción"
            value={step.description}
            onChange={(next) =>
              onChange(
                steps.map((item, i) =>
                  i === index ? { ...item, description: next } : item,
                ),
              )
            }
            multiline
            rows={2}
          />

          <button
            type="button"
            onClick={() =>
              onChange(
                steps
                  .filter((_, i) => i !== index)
                  .map((item, position) => ({ ...item, position })),
              )
            }
            className="self-end text-xs text-fg-subtle transition-colors hover:text-accent"
          >
            Quitar etapa
          </button>
        </div>
      ))}
    </div>
  );
}

function ValueList({
  items,
  onChange,
}: {
  items: SiteSettings["values"];
  onChange: (items: SiteSettings["values"]) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() =>
          onChange([
            ...items,
            {
              id: `value-${Date.now()}`,
              title: emptyLocalized(),
              description: emptyLocalized(),
              position: items.length,
            },
          ])
        }
        className="self-start rounded-[3px] border border-line px-2.5 py-1 text-xs text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
      >
        Añadir valor
      </button>

      {items.map((value, index) => (
        <div
          key={value.id}
          className="flex flex-col gap-3 rounded-[3px] border border-line p-3"
        >
          <LocalizedField
            label="Título"
            value={value.title}
            onChange={(next) =>
              onChange(
                items.map((item, i) =>
                  i === index ? { ...item, title: next } : item,
                ),
              )
            }
          />
          <LocalizedField
            label="Descripción"
            value={value.description}
            onChange={(next) =>
              onChange(
                items.map((item, i) =>
                  i === index ? { ...item, description: next } : item,
                ),
              )
            }
            multiline
            rows={2}
          />
          <button
            type="button"
            onClick={() =>
              onChange(
                items
                  .filter((_, i) => i !== index)
                  .map((item, position) => ({ ...item, position })),
              )
            }
            className="self-end text-xs text-fg-subtle transition-colors hover:text-accent"
          >
            Quitar valor
          </button>
        </div>
      ))}
    </div>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[4px] border border-line bg-bg p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-fg">{title}</h2>
      {description ? (
        <p className="mt-1.5 max-w-[70ch] text-sm leading-relaxed text-fg-muted">
          {description}
        </p>
      ) : null}
      <div className="mt-5 flex flex-col gap-6">{children}</div>
    </section>
  );
}
