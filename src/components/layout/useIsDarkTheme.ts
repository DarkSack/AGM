"use client";

import { useSyncExternalStore } from "react";

/**
 * Si el documento esta en modo oscuro, leido de la clase `dark` de <html>.
 *
 * La fuente de verdad es esa clase (la pone `ThemeScript` antes de pintar y la
 * cambian los conmutadores), no un estado de React. Con `useSyncExternalStore`
 * el componente se suscribe a ella en vez de copiarla a un `useState` dentro
 * de un efecto, que provocaba un render extra y lo marca el linter de React.
 *
 * Devuelve `null` en el servidor y durante la hidratacion: hasta entonces no se
 * conoce el tema real.
 */
export function useIsDarkTheme(): boolean | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getSnapshot(): boolean {
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot(): null {
  return null;
}
