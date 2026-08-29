"use client";

import { useEffect } from "react";

/**
 * Motor de las animaciones de entrada.
 *
 * Se monta una sola vez y observa todos los elementos marcados con
 * `data-reveal`, incluidos los que aparezcan despues (un MutationObserver los
 * recoge). Asi las secciones siguen siendo Server Components sin JavaScript
 * propio: solo llevan un atributo.
 *
 * Los elementos ya visibles al cargar se revelan de inmediato, sin esperar a
 * un scroll que quiza nunca ocurra, y cada elemento se deja de observar en
 * cuanto se ha mostrado.
 */
export function RevealObserver() {
  useEffect(() => {
    const root = document.documentElement;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      root.classList.remove("js-reveal");
      return;
    }

    // Desactiva el salvavidas del script de arranque: a partir de aqui el
    // observador se hace cargo de revelar el contenido.
    root.dataset.revealReady = "1";

    const reveal = (element: Element) => {
      element.setAttribute("data-revealed", "true");
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      },
      // Se dispara un poco antes de que el elemento entre del todo, para que la
      // transicion termine justo cuando el usuario lo esta mirando.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    const observe = (scope: ParentNode) => {
      for (const element of scope.querySelectorAll("[data-reveal]")) {
        if (element.getAttribute("data-revealed") === "true") continue;
        observer.observe(element);
      }
    };

    observe(document);

    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          const element = node as Element;
          if (element.hasAttribute("data-reveal")) observer.observe(element);
          observe(element);
        }
      }
    });

    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, []);

  return null;
}
