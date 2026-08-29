"use client";

import { useId, type ReactNode } from "react";
import { LOCALES, type Locale } from "@/config/site";
import { cn } from "@/lib/cn";
import type { Localized } from "@/types/content";

/**
 * Primitivos de formulario del panel.
 *
 * Priorizan claridad sobre lucimiento: etiqueta siempre visible, ayuda debajo
 * y area de pulsacion amplia. Quien los usa no es un disenador, es alguien del
 * despacho que quiere subir un proyecto y volver a lo suyo.
 */

const controlClasses =
  "w-full rounded-[3px] border border-line bg-surface px-3 py-2.5 font-sans text-sm " +
  "text-fg transition-colors placeholder:text-fg-subtle/70 hover:border-line-strong " +
  "focus:border-accent focus:outline-none disabled:opacity-60";

export function FieldShell({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="font-sans text-xs font-medium tracking-[0.06em] text-fg-muted uppercase"
      >
        {label}
      </label>
      {children}
      {hint ? (
        <p className="font-sans text-xs leading-relaxed text-fg-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  placeholder,
  type = "text",
  disabled,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} htmlFor={id} className={className}>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={controlClasses}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  hint,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  rows?: number;
}) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} htmlFor={id}>
      <textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={cn(controlClasses, "resize-y leading-relaxed")}
      />
    </FieldShell>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  hint?: string;
}) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} htmlFor={id}>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className={controlClasses}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function CheckboxField({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-[var(--color-accent)]"
      />
      <div className="flex flex-col gap-0.5">
        <label htmlFor={id} className="font-sans text-sm text-fg">
          {label}
        </label>
        {hint ? (
          <p className="font-sans text-xs leading-relaxed text-fg-subtle">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Campo con una pestana por idioma.
 *
 * Mantener los dos idiomas a la vista evita el fallo mas comun de un CMS
 * bilingue: publicar con el ingles a medias sin darse cuenta. Cada pestana
 * marca si su idioma ya tiene texto.
 */
export function LocalizedField({
  label,
  value,
  onChange,
  hint,
  multiline = false,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: Localized;
  onChange: (value: Localized) => void;
  hint?: string;
  multiline?: boolean;
  rows?: number;
  placeholder?: Partial<Record<Locale, string>>;
}) {
  const baseId = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-sans text-xs font-medium tracking-[0.06em] text-fg-muted uppercase">
        {label}
      </span>

      <div className="grid gap-3 md:grid-cols-2">
        {LOCALES.map((locale) => {
          const id = `${baseId}-${locale}`;
          const filled = value[locale].trim().length > 0;
          return (
            <div key={locale} className="flex flex-col gap-1">
              <label
                htmlFor={id}
                className="flex items-center gap-2 font-sans text-[0.6875rem] tracking-[0.1em] text-fg-subtle uppercase"
              >
                {locale}
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-1.5 rounded-full",
                    filled ? "bg-accent" : "bg-line-strong",
                  )}
                />
                <span className="sr-only">
                  {filled ? "con contenido" : "vacío"}
                </span>
              </label>

              {multiline ? (
                <textarea
                  id={id}
                  rows={rows}
                  value={value[locale]}
                  placeholder={placeholder?.[locale]}
                  onChange={(event) =>
                    onChange({ ...value, [locale]: event.target.value })
                  }
                  className={cn(controlClasses, "resize-y leading-relaxed")}
                />
              ) : (
                <input
                  id={id}
                  type="text"
                  value={value[locale]}
                  placeholder={placeholder?.[locale]}
                  onChange={(event) =>
                    onChange({ ...value, [locale]: event.target.value })
                  }
                  className={controlClasses}
                />
              )}
            </div>
          );
        })}
      </div>

      {hint ? (
        <p className="font-sans text-xs leading-relaxed text-fg-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

/** Lista de etiquetas separadas por comas, editada como texto plano. */
export function TagsField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  hint?: string;
}) {
  return (
    <TextField
      label={label}
      hint={hint ?? "Separa las etiquetas con comas."}
      value={value.join(", ")}
      onChange={(raw) =>
        onChange(
          raw
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0),
        )
      }
    />
  );
}
