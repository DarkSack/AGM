"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

/**
 * Frontera de error del sitio publico.
 *
 * Nunca muestra el mensaje tecnico al visitante: se registra en consola (que
 * en produccion recoge la plataforma) y en pantalla queda un texto util con
 * una via para reintentar.
 */
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  useEffect(() => {
    console.error("[site] error no controlado:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70svh] items-center pt-28 pb-20">
      <div className="container-editorial">
        <h1 className="text-h1 text-fg">{t("title")}</h1>
        <p className="mt-5 max-w-[46ch] text-lead text-fg-muted">{t("body")}</p>
        <Button variant="outline" className="mt-9" onClick={reset}>
          {t("retry")}
        </Button>
      </div>
    </div>
  );
}
