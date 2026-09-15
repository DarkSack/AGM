"use client";

import { useEffect } from "react";

export const UNSAVED_MESSAGE =
  "Tienes cambios sin guardar. Si sales ahora, se perderán. ¿Salir de todos modos?";

/**
 * Avisa antes de perder cambios sin guardar.
 *
 * Cubre las dos salidas posibles:
 *
 *  - Cerrar o recargar la pestana, o escribir otra URL: `beforeunload`. El
 *    navegador muestra su propio dialogo; el texto no se puede personalizar.
 *  - Pulsar un enlace del propio panel: el App Router no expone eventos de
 *    navegacion que se puedan cancelar, asi que se intercepta el clic en fase
 *    de captura, antes de que `next/link` lo procese.
 *
 * El boton "atras" del navegador dentro del panel no se puede interceptar de
 * forma fiable sin romper el historial; esa via queda sin aviso.
 */
export function useUnsavedChanges(dirty: boolean): void {
  useEffect(() => {
    if (!dirty) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Algunos navegadores aun exigen asignar `returnValue` para mostrar el aviso.
      event.returnValue = "";
    };

    const onClick = (event: MouseEvent) => {
      // Clic con modificador o boton central: se abre en otra pestana y en esta
      // no se pierde nada.
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Un ancla dentro de la misma pagina no descarta el formulario.
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }

      if (!window.confirm(UNSAVED_MESSAGE)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);
}

/**
 * Compara dos estados de formulario por contenido.
 *
 * Suficiente para objetos planos de JSON como los de estos formularios, y mucho
 * mas simple que llevar la cuenta de cada campo tocado.
 */
export function sameContent(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
