"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { whatsappUrl, type Locale } from "@/config/site";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import type { ResolvedContact } from "@/lib/contactInfo";
import { cn } from "@/lib/cn";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NAV_SECTIONS, sectionHref } from "./navigation";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (sectionId: string) => void;
  isHome: boolean;
  locale: Locale;
  /** Datos de contacto ya resueltos con lo editado en el panel. */
  contact: ResolvedContact;
}

/**
 * Menu de pantalla completa.
 *
 * Se monta siempre para poder animar la salida, pero se marca `inert` cuando
 * esta cerrado: asi ni el teclado ni el lector de pantalla pueden alcanzar
 * enlaces invisibles. Bloquea el scroll del fondo, cierra con Escape y devuelve
 * el foco al abrir.
 */
export function MobileMenu({
  open,
  onClose,
  onNavigate,
  isHome,
  locale,
  contact,
}: MobileMenuProps) {
  const t = useTranslations("nav");
  const tContact = useTranslations("contact");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const toggle = () =>
      document.querySelector<HTMLElement>('[aria-controls="mobile-menu"]');

    const onKeyDown = (event: KeyboardEvent) => {
      // Tab no sale del menu mientras esta abierto: el ciclo incluye el boton
      // de cerrar, que vive fuera del panel, y los enlaces del panel. Sin esto
      // el foco acababa en la pagina que hay debajo, invisible tras el menu.
      if (event.key === "Tab") {
        const panel = panelRef.current;
        const button = toggle();
        if (!panel || !button) return;
        const focusables = [
          button,
          ...panel.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
        ];
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        const inside = focusables.includes(active as HTMLElement);

        if (event.shiftKey && (active === first || !inside)) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && (active === last || !inside)) {
          event.preventDefault();
          first?.focus();
        }
        return;
      }

      if (event.key !== "Escape") return;
      onClose();
      // El foco vuelve al boton que abrio el menu. Si no, se queda en un
      // enlace que acaba de volverse `inert` y el teclado pierde la posicion.
      toggle()?.focus();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    // El primer enlace recibe el foco para que el teclado entre directamente
    // en el menu recien abierto.
    panelRef.current?.querySelector("a")?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <div
      id="mobile-menu"
      ref={panelRef}
      // `inert` retira del arbol de accesibilidad y del orden de tabulacion.
      inert={!open}
      aria-hidden={!open}
      className={cn(
        "fixed inset-x-0 top-18 bottom-0 z-40 overflow-y-auto border-t border-line bg-bg transition-[opacity,transform] duration-400 ease-out motion-reduce:transition-none md:top-20 min-[52rem]:hidden",
        open
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-2 opacity-0",
      )}
    >
      <nav
        aria-label={t("mobileLabel")}
        className="container-editorial flex flex-col pt-8 pb-12"
      >
        <ul className="flex flex-col">
          {NAV_SECTIONS.map(({ id, key }, index) => (
            <li key={id} className="border-b border-line">
              <a
                href={sectionHref(id, locale, isHome)}
                onClick={() => onNavigate(id)}
                className="flex items-baseline gap-5 py-5 transition-colors hover:text-accent"
              >
                <span className="numeral w-6">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="font-display text-h3 text-fg">{t(key)}</span>
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-col gap-4">
          <span className="eyebrow">{tContact("directLabel")}</span>

          <a
            href={whatsappUrl(locale, contact.whatsappNumber)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              track(ANALYTICS_EVENTS.whatsappClick, {
                location: "mobile_menu",
                locale,
              })
            }
            className="font-sans text-base text-fg transition-colors hover:text-accent"
          >
            {tContact("whatsapp")}
          </a>

          <a
            href={contact.phoneHref}
            onClick={() =>
              track(ANALYTICS_EVENTS.phoneClick, {
                location: "mobile_menu",
                locale,
              })
            }
            className="font-sans text-base text-fg-muted transition-colors hover:text-accent"
          >
            {contact.phoneDisplay}
          </a>

          <a
            href={contact.emailHref}
            onClick={() =>
              track(ANALYTICS_EVENTS.emailClick, {
                location: "mobile_menu",
                locale,
              })
            }
            className="font-sans text-base break-all text-fg-muted transition-colors hover:text-accent"
          >
            {contact.email}
          </a>
        </div>

        <div className="mt-10 border-t border-line pt-6 sm:hidden">
          <LanguageSwitcher />
        </div>
      </nav>
    </div>
  );
}
