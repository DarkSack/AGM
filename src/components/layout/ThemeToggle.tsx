"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import { THEME_STORAGE_KEY } from "./ThemeScript";

type Resolved = "light" | "dark";

function readResolved(): Resolved {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/**
 * Alterna claro/oscuro y recuerda la eleccion.
 *
 * Mientras el visitante no elija nada, el sitio sigue en vivo la preferencia
 * del sistema; en cuanto pulsa, su decision manda y persiste entre visitas.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const t = useTranslations("theme");
  const [theme, setTheme] = useState<Resolved>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(readResolved());
    setMounted(true);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = (event: MediaQueryListEvent) => {
      // Solo se sigue al sistema si el visitante no ha elegido explicitamente.
      if (document.documentElement.dataset.themeSource !== "system") return;
      document.documentElement.classList.toggle("dark", event.matches);
      setTheme(event.matches ? "dark" : "light");
    };

    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  }, []);

  const toggle = useCallback(() => {
    const next: Resolved = readResolved() === "dark" ? "light" : "dark";
    const root = document.documentElement;
    root.classList.toggle("dark", next === "dark");
    root.dataset.themeSource = "user";
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage bloqueado: el cambio vale para esta sesion y no se persiste.
    }
    setTheme(next);
    track(ANALYTICS_EVENTS.themeChange, { value: next });
  }, []);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      className={`group inline-flex size-9 items-center justify-center rounded-full border border-line text-fg-muted transition-colors hover:border-line-strong hover:text-fg ${className}`}
      aria-label={t("toggle")}
      // Hasta hidratar no se conoce el tema real: sin esto el lector de
      // pantalla podria anunciar un estado equivocado.
      aria-pressed={mounted ? isDark : undefined}
      title={mounted ? (isDark ? t("light") : t("dark")) : t("toggle")}
    >
      <SunMoonIcon dark={mounted && isDark} />
    </button>
  );
}

/** Un solo trazo que pasa de sol a luna girando; sin librerias de iconos. */
function SunMoonIcon({ dark }: { dark: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      className="size-[18px] transition-transform duration-500 ease-out motion-reduce:transition-none"
      style={{ transform: dark ? "rotate(-90deg)" : "none" }}
      aria-hidden="true"
    >
      {dark ? (
        <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
      ) : (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
        </>
      )}
    </svg>
  );
}
