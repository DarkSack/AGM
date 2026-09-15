"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { seedDefaultContent } from "@/lib/admin/actions";

/** Boton que copia a la base de datos el contenido inicial que trae el sitio. */
export function SeedContentButton() {
  const router = useRouter();
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
              const result = await seedDefaultContent();
              setFeedback(
                result.ok
                  ? { kind: "ok", text: result.message ?? "Listo." }
                  : { kind: "error", text: result.error },
              );
              if (result.ok) router.refresh();
            });
          }}
          className="inline-flex h-10 items-center rounded-[3px] bg-fg px-4 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-accent-fg disabled:opacity-60"
        >
          {pending ? "Cargando…" : "Cargar contenido inicial"}
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
