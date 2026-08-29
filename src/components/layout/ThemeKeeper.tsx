"use client";

import { useEffect, useLayoutEffect } from "react";
import { THEME_STORAGE_KEY } from "./ThemeScript";

/**
 * `useLayoutEffect` no existe en el servidor; en SSR se degrada a `useEffect`
 * para no emitir el aviso de React.
 */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Vuelve a aplicar el tema despues de cada render.
 *
 * El script de arranque pone la clase `dark` en <html> antes del primer
 * pintado, pero React se apropia de los atributos de <html> cuando vuelve a
 * renderizar el layout raiz —lo que ocurre, por ejemplo, al cambiar de
 * idioma— y los deja como estaban en su propio arbol: sin la clase. El
 * resultado era que alternar ES/EN devolvia el sitio al tema claro.
 *
 * Este componente se monta una vez y su efecto corre tras *cada* render, sin
 * array de dependencias. Al ser un efecto de layout se ejecuta despues de que
 * React toque el DOM pero antes de que el navegador pinte, asi que la clase se
 * restituye sin que llegue a verse un parpadeo.
 *
 * La alternativa habria sido guardar el tema en una cookie y renderizarlo
 * desde el servidor, pero eso obliga a leer cookies en el layout y convierte
 * toda la portada en dinamica, perdiendo el renderizado estatico.
 */
export function ThemeKeeper() {
  useIsomorphicLayoutEffect(() => {
    const root = document.documentElement;

    let stored: string | null = null;
    try {
      stored = localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      // Storage bloqueado: se cae a la preferencia del sistema.
    }

    const explicit = stored === "dark" || stored === "light";
    const shouldBeDark = explicit
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (root.classList.contains("dark") !== shouldBeDark) {
      root.classList.toggle("dark", shouldBeDark);
    }

    if (!root.dataset.themeSource) {
      root.dataset.themeSource = explicit ? "user" : "system";
    }

    // `js-reveal` viaja en el mismo atributo y se pierde igual. Solo se
    // restituye si el observador sigue vivo para revelar lo que oculte.
    if (root.dataset.revealReady === "1" && !root.classList.contains("js-reveal")) {
      root.classList.add("js-reveal");
    }
  });

  return null;
}
