"use client";

import { useCallback } from "react";
import { THEME_STORAGE_KEY } from "@/components/layout/ThemeScript";
import { useIsDarkTheme } from "@/components/layout/useIsDarkTheme";

/**
 * Conmutador de tema del panel.
 *
 * Repite la logica del publico pero con los textos en castellano fijos: el
 * panel no monta el proveedor de next-intl, asi que el componente del sitio
 * publico no puede reutilizarse aqui sin arrastrar toda la i18n.
 */
export function ThemeToggleStandalone() {
  // null hasta hidratar: no se conoce el tema real.
  const theme = useIsDarkTheme();
  const mounted = theme !== null;
  const dark = theme === true;

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.dataset.themeSource = "user";
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // Storage bloqueado: el cambio vale solo para esta sesion.
    }
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Cambiar tema"
      aria-pressed={mounted ? dark : undefined}
      title={mounted ? (dark ? "Tema claro" : "Tema oscuro") : "Cambiar tema"}
      className="inline-flex size-8 items-center justify-center rounded-full border border-line text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        aria-hidden="true"
        className="size-4"
      >
        {mounted && dark ? (
          <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
          </>
        )}
      </svg>
    </button>
  );
}
