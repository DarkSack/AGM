"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import type { Locale } from "@/config/site";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import {
  PROJECT_TYPES,
  contactSchema,
  fieldErrors,
  type ContactInput,
} from "@/lib/validation";
import { Button } from "@/components/ui/Button";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; reason: "generic" | "notConfigured" | "rateLimited" };

type Errors = Partial<Record<keyof ContactInput, string>>;

const fieldClasses =
  "w-full border-b border-line bg-transparent pb-2.5 pt-1 font-sans text-[0.9375rem] " +
  "text-fg transition-colors placeholder:text-fg-subtle/70 hover:border-line-strong " +
  "focus:border-accent focus:outline-none disabled:opacity-60";

/**
 * Formulario de cotizacion.
 *
 * Validacion con el mismo esquema de zod que usa la API, de modo que el
 * mensaje que ve el usuario y el que aplica el servidor no pueden divergir.
 * Todos los estados (envio, exito, error) se anuncian por region viva para que
 * un lector de pantalla se entere sin tener que rastrear la pagina.
 */
export function ContactForm({ locale }: { locale: Locale }) {
  const t = useTranslations("form");
  const formId = useId();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [errors, setErrors] = useState<Errors>({});
  const successRef = useRef<HTMLDivElement>(null);

  const isSubmitting = status.kind === "submitting";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const raw = Object.fromEntries(new FormData(form));

    const parsed = contactSchema.safeParse({ ...raw, locale });
    if (!parsed.success) {
      const nextErrors = fieldErrors(parsed.error);
      setErrors(nextErrors);
      setStatus({ kind: "idle" });
      // Lleva el foco al primer campo con problema en vez de dejar al usuario
      // buscando cual falla.
      const firstField = Object.keys(nextErrors)[0];
      if (firstField) {
        form.querySelector<HTMLElement>(`[name="${firstField}"]`)?.focus();
      }
      return;
    }

    setErrors({});
    setStatus({ kind: "submitting" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (response.ok) {
        // Nunca se envian a GA4 el nombre, el correo ni el mensaje: solo el
        // tipo de proyecto, que es una categoria, no un dato personal.
        track(ANALYTICS_EVENTS.contactFormSubmit, {
          value: parsed.data.projectType,
          locale,
        });
        form.reset();
        setStatus({ kind: "success" });
        // Mueve el foco al aviso para que se anuncie y sea el punto de partida
        // de la navegacion por teclado.
        requestAnimationFrame(() => successRef.current?.focus());
        return;
      }

      const body: unknown = await response.json().catch(() => null);
      const code =
        typeof body === "object" && body !== null && "code" in body
          ? String((body as { code: unknown }).code)
          : "";

      const reason =
        code === "not_configured"
          ? "notConfigured"
          : code === "rate_limited"
            ? "rateLimited"
            : "generic";

      track(ANALYTICS_EVENTS.contactFormError, { value: reason, locale });
      setStatus({ kind: "error", reason });
    } catch {
      track(ANALYTICS_EVENTS.contactFormError, { value: "network", locale });
      setStatus({ kind: "error", reason: "generic" });
    }
  }

  if (status.kind === "success") {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="border border-line bg-surface p-8 focus:outline-none"
      >
        <CheckMark />
        <h3 className="mt-5 text-h3 text-fg">{t("successTitle")}</h3>
        <p className="mt-3 max-w-[44ch] text-sm leading-relaxed text-fg-muted">
          {t("successBody")}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-7"
          onClick={() => setStatus({ kind: "idle" })}
        >
          {t("sendAnother")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-7">
      <fieldset disabled={isSubmitting} className="contents">
        <legend className="sr-only">{t("legend")}</legend>

        <Field
          id={`${formId}-name`}
          name="name"
          label={t("name")}
          placeholder={t("namePlaceholder")}
          autoComplete="name"
          required
          requiredLabel={t("required")}
          error={errors.name ? t(`errors.${errors.name}`) : undefined}
        />

        <div className="grid gap-7 sm:grid-cols-2">
          <Field
            id={`${formId}-email`}
            name="email"
            type="email"
            label={t("email")}
            placeholder={t("emailPlaceholder")}
            autoComplete="email"
            inputMode="email"
            required
            requiredLabel={t("required")}
            error={errors.email ? t(`errors.${errors.email}`) : undefined}
          />

          <Field
            id={`${formId}-phone`}
            name="phone"
            type="tel"
            label={t("phone")}
            placeholder={t("phonePlaceholder")}
            autoComplete="tel"
            inputMode="tel"
            hint={t("phoneOptional")}
            error={errors.phone ? t(`errors.${errors.phone}`) : undefined}
          />
        </div>

        <SelectField
          id={`${formId}-project-type`}
          label={t("projectType")}
          placeholder={t("projectTypePlaceholder")}
          requiredLabel={t("required")}
          error={
            errors.projectType ? t(`errors.${errors.projectType}`) : undefined
          }
        />

        <Field
          id={`${formId}-message`}
          name="message"
          label={t("message")}
          placeholder={t("messagePlaceholder")}
          multiline
          required
          requiredLabel={t("required")}
          error={errors.message ? t(`errors.${errors.message}`) : undefined}
        />

        {/* Honeypot. Fuera de la vista y del orden de tabulacion, pero no con
            `display:none`, que algunos bots detectan. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor={`${formId}-company`}>Company</label>
          <input
            id={`${formId}-company`}
            name="company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="flex flex-col gap-4">
          <Button type="submit" size="lg" className="w-full sm:w-auto">
            {isSubmitting ? t("submitting") : t("submit")}
          </Button>

          {/* Region viva permanente: si apareciera solo al fallar, algunos
              lectores de pantalla no llegarian a anunciarla. */}
          <div role="alert" aria-live="polite" className="min-h-0">
            {status.kind === "error" ? (
              <div className="border-l-2 border-accent bg-bg-alt py-3 pr-4 pl-4">
                <p className="font-sans text-sm font-medium text-fg">
                  {t("errorTitle")}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-fg-muted">
                  {status.reason === "notConfigured"
                    ? t("notConfigured")
                    : status.reason === "rateLimited"
                      ? t("errors.rateLimited")
                      : t("errorBody")}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </fieldset>
    </form>
  );
}

/* ------------------------------------------------------------------ */

interface FieldProps {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  inputMode?: "email" | "tel" | "text";
  required?: boolean;
  requiredLabel?: string;
  hint?: string;
  multiline?: boolean;
  error?: string;
}

function Field({
  id,
  name,
  label,
  placeholder,
  type = "text",
  autoComplete,
  inputMode,
  required = false,
  requiredLabel,
  hint,
  multiline = false,
  error,
}: FieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="flex flex-col gap-2">
      {/* La pista va fuera del <label> y se enlaza con aria-describedby: si
          estuviera dentro, el lector de pantalla la pegaria al nombre del
          campo y anunciaria "Telefonoopcional". */}
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={id}
          className="font-sans text-xs font-medium tracking-[0.08em] text-fg-muted uppercase"
        >
          {label}
          {required ? (
            <>
              <span aria-hidden="true" className="ml-1 text-accent">
                *
              </span>
              <span className="sr-only"> ({requiredLabel})</span>
            </>
          ) : null}
        </label>
        {hint ? (
          <span
            id={hintId}
            className="font-sans text-[0.6875rem] text-fg-subtle"
          >
            {hint}
          </span>
        ) : null}
      </div>

      {multiline ? (
        <textarea
          id={id}
          name={name}
          rows={5}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(fieldClasses, "resize-y", error && "border-accent")}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(fieldClasses, error && "border-accent")}
        />
      )}

      {error ? (
        <p id={errorId} className="font-sans text-xs text-accent">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SelectField({
  id,
  label,
  placeholder,
  requiredLabel,
  error,
}: {
  id: string;
  label: string;
  placeholder: string;
  requiredLabel: string;
  error?: string;
}) {
  const t = useTranslations("form.projectTypes");
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="font-sans text-xs font-medium tracking-[0.08em] text-fg-muted uppercase"
      >
        {label}
        <span aria-hidden="true" className="ml-1 text-accent">
          *
        </span>
        <span className="sr-only"> ({requiredLabel})</span>
      </label>

      <div className="relative">
        <select
          id={id}
          name="projectType"
          defaultValue=""
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            fieldClasses,
            "appearance-none pr-8",
            error && "border-accent",
          )}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {PROJECT_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(type)}
            </option>
          ))}
        </select>
        <ChevronDown />
      </div>

      {error ? (
        <p id={errorId} className="font-sans text-xs text-accent">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ChevronDown() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      aria-hidden="true"
      className="pointer-events-none absolute top-1.5 right-1 size-4 text-fg-subtle"
    >
      <path d="m5 8 5 5 5-5" />
    </svg>
  );
}

function CheckMark() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="square"
      aria-hidden="true"
      className="size-8 text-accent"
    >
      <path d="M4 17.5 12 25 28 7" />
    </svg>
  );
}
