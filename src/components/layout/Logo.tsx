import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";

/**
 * Marca AGM.
 *
 * El monograma reinterpreta el logotipo de la papeleria: un modulo cuadrado
 * con una cubierta a dos aguas y los montantes que insinuan la A y la M. Se
 * dibuja con el mismo grosor de linea que la iconografia para que todo el
 * sistema grafico parezca de la misma mano.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      aria-hidden="true"
      className={cn("size-9", className)}
    >
      <rect x="1.5" y="1.5" width="37" height="37" strokeWidth="1" />
      {/* Cubierta */}
      <path d="M8 22 20 10l12 12" />
      {/* Montantes: A a la izquierda, M insinuada a la derecha */}
      <path d="M11 30V25M20 30V16M29 30V25" />
      <path d="M14.5 26h11" />
    </svg>
  );
}

/**
 * El nombre acompana siempre al monograma, tambien en movil: cabe de sobra
 * junto a los dos botones del navbar y es donde mas falta hace que se lea a
 * quien pertenece el sitio.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <LogoMark className="size-9 shrink-0 text-fg" />
      <span className="flex flex-col leading-none">
        <span className="font-sans text-[0.9375rem] font-semibold tracking-[0.24em] text-fg">
          {siteConfig.shortName}
        </span>
        <span className="mt-1 font-sans text-[0.5625rem] font-medium tracking-[0.2em] text-fg-subtle uppercase">
          {siteConfig.tagline}
        </span>
      </span>
    </span>
  );
}
