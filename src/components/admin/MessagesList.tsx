"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteMessage, setMessageRead } from "@/lib/admin/actions";
import { cn } from "@/lib/cn";
import { PROJECT_TYPE_LABELS } from "@/lib/validation";
import type { ContactMessage } from "@/types/content";

const dateFormat = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
});

/**
 * Bandeja de solicitudes del formulario.
 *
 * Responder se hace desde el correo de siempre: el enlace `mailto:` viene con
 * el asunto puesto. Montar un cliente de correo dentro del panel seria mucho
 * trabajo para algo que el despacho ya tiene resuelto.
 */
export function MessagesList({ messages }: { messages: ContactMessage[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (messages.length === 0) {
    return (
      <p className="rounded-[4px] border border-dashed border-line p-10 text-center text-sm text-fg-muted">
        Todavía no ha llegado ninguna solicitud.
      </p>
    );
  }

  // Antes el resultado se descartaba: si fallaba, el mensaje seguia igual y
  // nadie sabia por que.
  function toggleRead(message: ContactMessage) {
    setError(null);
    startTransition(async () => {
      const result = await setMessageRead(message.id, !message.read);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function remove(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteMessage(id);
      setConfirmId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <p role="alert" className="border-l-2 border-accent pl-3 text-sm text-fg">
          {error}
        </p>
      ) : null}
      <ul className="flex flex-col gap-2">
        {messages.map((message) => {
          const open = openId === message.id;

          return (
            <li
              key={message.id}
              className={cn(
                "rounded-[4px] border bg-bg",
                message.read ? "border-line" : "border-accent",
              )}
            >
              <button
                type="button"
                onClick={() => {
                  setOpenId(open ? null : message.id);
                  if (!message.read && !open) toggleRead(message);
                }}
                aria-expanded={open}
                className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 p-4 text-left"
              >
                {!message.read ? (
                  <span
                    aria-label="Sin leer"
                    className="size-2 shrink-0 rounded-full bg-accent"
                  />
                ) : (
                  <span aria-hidden="true" className="size-2 shrink-0" />
                )}

                <span className="text-sm font-medium text-fg">{message.name}</span>
                <span className="text-xs text-fg-muted">
                  {(PROJECT_TYPE_LABELS as Record<string, string>)[message.projectType] ??
                    message.projectType}
                </span>
                <span className="ml-auto text-xs text-fg-subtle">
                  {dateFormat.format(new Date(message.createdAt))}
                </span>
              </button>

              {open ? (
                <div className="flex flex-col gap-4 border-t border-line p-4">
                  <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[7rem_1fr]">
                    <dt className="text-xs tracking-[0.06em] text-fg-subtle uppercase">
                      Correo
                    </dt>
                    <dd>
                      <a
                        href={`mailto:${message.email}?subject=${encodeURIComponent(
                          "Tu solicitud a AGM Diseño y Proyección",
                        )}`}
                        className="break-all text-fg underline underline-offset-4"
                      >
                        {message.email}
                      </a>
                    </dd>

                    {message.phone ? (
                      <>
                        <dt className="text-xs tracking-[0.06em] text-fg-subtle uppercase">
                          Teléfono
                        </dt>
                        <dd>
                          <a
                            href={`tel:${message.phone.replace(/[^\d+]/g, "")}`}
                            className="text-fg underline underline-offset-4"
                          >
                            {message.phone}
                          </a>
                        </dd>
                      </>
                    ) : null}

                    <dt className="text-xs tracking-[0.06em] text-fg-subtle uppercase">
                      Idioma
                    </dt>
                    <dd className="text-fg-muted">
                      {message.locale === "es" ? "Español" : "Inglés"}
                    </dd>
                  </dl>

                  <p className="whitespace-pre-line rounded-[3px] border border-line bg-bg-alt p-4 text-sm leading-relaxed text-fg">
                    {message.message}
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => toggleRead(message)}
                      className="inline-flex h-8 items-center rounded-[3px] border border-line px-3 text-xs text-fg-muted transition-colors hover:border-line-strong hover:text-fg disabled:opacity-60"
                    >
                      {message.read ? "Marcar como sin leer" : "Marcar como leído"}
                    </button>

                    {confirmId === message.id ? (
                      <>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => remove(message.id)}
                          className="inline-flex h-8 items-center rounded-[3px] bg-accent px-3 text-xs font-medium text-accent-fg disabled:opacity-60"
                        >
                          Sí, eliminar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          className="text-xs text-fg-muted hover:text-fg"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmId(message.id)}
                        className="ml-auto text-xs text-fg-subtle transition-colors hover:text-accent"
                      >
                        Eliminar
                      </button>
                    )}
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
