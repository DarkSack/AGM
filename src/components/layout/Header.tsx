"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/config/site";
import { usePathname } from "@/i18n/navigation";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import type { ResolvedContact } from "@/lib/contactInfo";
import { cn } from "@/lib/cn";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { NAV_SECTIONS, localeHome, sectionHref } from "./navigation";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Navbar fijo.
 *
 * Arranca integrado en el hero (sin fondo) y adquiere fondo translucido con
 * desenfoque en cuanto el visitante se separa de la parte superior. Ademas
 * resalta la seccion que se esta leyendo, lo que en una pagina larga de scroll
 * es la unica pista de orientacion que tiene el usuario.
 */
export function Header({ contact }: { contact: ResolvedContact }) {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const isHome = pathname === "/";

  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Evita re-renderizar en cada evento de scroll: solo cuando cruza el umbral.
  const scrolledRef = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > 24;
      if (next === scrolledRef.current) return;
      scrolledRef.current = next;
      setScrolled(next);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isHome || !("IntersectionObserver" in window)) return;

    const sections = NAV_SECTIONS.map(({ id }) => document.getElementById(id)).filter(
      (element): element is HTMLElement => element !== null,
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Se toma la seccion visible mas cercana a la parte superior, para que
        // al hacer scroll rapido no parpadee entre dos.
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, [isHome]);

  const onNavClick = useCallback(
    (sectionId: string) => {
      track(ANALYTICS_EVENTS.navClick, { section: sectionId, locale });
      setMenuOpen(false);
    },
    [locale],
  );

  return (
    // El menu movil va FUERA del <header> a proposito. El header aplica
    // `backdrop-filter`, y cualquier filtro convierte al elemento en bloque
    // contenedor de sus descendientes `position: fixed`: dentro, el menu se
    // colapsaria a la altura del navbar en lugar de ocupar la pantalla.
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500",
          scrolled || menuOpen
            ? "border-b border-line bg-bg/80 backdrop-blur-xl supports-[backdrop-filter]:bg-bg/70"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="container-editorial flex h-18 items-center justify-between gap-6 md:h-20">
          <a
            href={localeHome(locale)}
            className="shrink-0 rounded-[3px]"
            aria-label={t("home")}
          >
            <Logo />
          </a>

          <nav
            aria-label={t("primaryLabel")}
            className="hidden items-center gap-5 min-[52rem]:flex lg:gap-8"
          >
            {NAV_SECTIONS.map(({ id, key }) => {
              const isActive = isHome && activeSection === id;
              return (
                <a
                  key={id}
                  href={sectionHref(id, locale, isHome)}
                  onClick={() => onNavClick(id)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "relative py-1 font-sans text-[0.8125rem] tracking-[0.02em] transition-colors",
                    isActive ? "text-fg" : "text-fg-muted hover:text-fg",
                  )}
                >
                  {t(key)}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute -bottom-0.5 left-0 h-px bg-accent transition-[width] duration-400 ease-out motion-reduce:transition-none",
                      isActive ? "w-full" : "w-0",
                    )}
                  />
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 md:gap-4">
            <LanguageSwitcher className="hidden sm:flex" />
            <span aria-hidden="true" className="hidden h-4 w-px bg-line sm:block" />
            <ThemeToggle />

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex size-9 items-center justify-center rounded-full border border-line text-fg transition-colors hover:border-line-strong min-[52rem]:hidden"
              aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              <MenuIcon open={menuOpen} />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={onNavClick}
        isHome={isHome}
        locale={locale}
        contact={contact}
      />
    </>
  );
}

/** Dos trazos que se cruzan formando la X al abrir. */
function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      aria-hidden="true"
      className="size-[18px]"
    >
      <line
        x1="4"
        y1="9"
        x2="20"
        y2="9"
        className="origin-center transition-transform duration-300 ease-out motion-reduce:transition-none"
        style={open ? { transform: "translateY(3px) rotate(45deg)" } : undefined}
      />
      <line
        x1="4"
        y1="15"
        x2="20"
        y2="15"
        className="origin-center transition-transform duration-300 ease-out motion-reduce:transition-none"
        style={open ? { transform: "translateY(-3px) rotate(-45deg)" } : undefined}
      />
    </svg>
  );
}
