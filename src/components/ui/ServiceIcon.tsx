import type { ReactElement } from "react";
import { cn } from "@/lib/cn";

/**
 * Iconografia de trazo fino, dibujada sobre una retícula de 32×32.
 *
 * Son SVG inline en lugar de una libreria de iconos: pesan unos bytes, heredan
 * `currentColor` en ambos temas y mantienen el mismo grosor de linea que el
 * resto del sistema grafico, que es lo que hace que el conjunto parezca
 * dibujado y no ensamblado.
 */
const icons: Record<string, ReactElement> = {
  // Mantenimiento: edificio con una pieza sustituida.
  maintenance: (
    <>
      <path d="M5 27V9l11-5 11 5v18" />
      <path d="M5 27h22" />
      <rect x="11" y="16" width="6" height="6" />
      <path d="M20 13h4v4" />
    </>
  ),
  // Remodelacion: planta que cambia de forma.
  remodeling: (
    <>
      <path d="M4 6h14v14" />
      <path d="M28 26H14V12" />
      <path d="M20 6h8v8" />
    </>
  ),
  // Impermeabilizacion: cubierta que repele el agua.
  waterproofing: (
    <>
      <path d="M3 16 16 6l13 10" />
      <path d="M6 20h20" />
      <path d="M11 25v2M16 25v2M21 25v2" />
    </>
  ),
  // Fachada: retícula de vanos.
  facade: (
    <>
      <rect x="6" y="4" width="20" height="24" />
      <path d="M6 12h20M6 20h20M13 4v24M19.5 4v24" />
    </>
  ),
  // Diseno arquitectonico: escuadra de dibujo.
  design: (
    <>
      <path d="M5 27 16 5l11 22z" />
      <path d="M10 21h12" />
      <path d="M16 5v16" />
    </>
  ),
  // Proyecto ejecutivo: plano acotado.
  blueprint: (
    <>
      <path d="M5 5h16l6 6v16H5z" />
      <path d="M21 5v6h6" />
      <path d="M9 17h10M9 22h6" />
    </>
  ),
  // Consultoria: dos volumenes y una decision.
  consulting: (
    <>
      <path d="M4 24V13l8-5 8 5" />
      <path d="M4 24h16" />
      <circle cx="24" cy="10" r="4" />
      <path d="M24 17v4" />
    </>
  ),
  // Supervision: nivel de obra sobre el terreno.
  supervision: (
    <>
      <path d="M4 20h24" />
      <path d="M9 20V9l7-4 7 4v11" />
      <path d="M16 5v15" />
      <path d="M6 26h20" />
    </>
  ),
};

export const SERVICE_ICON_KEYS = Object.keys(icons);

export function ServiceIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const glyph = icons[name] ?? icons.design;

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      className={cn("size-8", className)}
    >
      {glyph}
    </svg>
  );
}
