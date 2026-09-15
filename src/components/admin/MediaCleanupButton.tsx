"use client";

import { useState, useTransition } from "react";
import { cleanupOrphanMedia } from "@/lib/admin/actions";

/**
 * Limpieza manual del almacenamiento.
 *
 * No se lanza sola tras cada guardado porque recorre el bucket entero; se
 * pulsa de vez en cuando. Solo borra archivos con mas de un dia que no
 * aparecen en ningun proyecto, bloque ni ajuste.
 */
export function MediaCleanupButton() {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<
    { kind: "ok" | "error"; text: string } | null
  >(null);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setFeedback(null);
            startTransition(async () => {
              const result = await cleanupOrphanMedia();
              setFeedback(
                result.ok
                  ? { kind: "ok", text: result.message ?? "Listo." }
                  : { kind: "error", text: result.error },
              );
            });
          }}
          className="inline-flex h-9 items-center rounded-[3px] border border-line-strong px-4 text-sm text-fg transition-colors hover:bg-fg hover:text-bg disabled:opacity-60"
        >
          {pending ? "Revisando…" : "Borrar imágenes sin uso"}
        </button>
      </div>

      {feedback ? (
        <p
          role="status"
          className={`border-l-2 pl-3 text-sm ${
            feedback.kind === "ok"
              ? "border-line-strong text-fg-muted"
              : "border-accent text-fg"
          }`}
        >
          {feedback.text}
        </p>
      ) : null}
    </div>
  );
}
