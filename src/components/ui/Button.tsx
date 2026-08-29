import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "solid" | "outline" | "ghost" | "quiet";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2.5 font-sans text-sm font-medium " +
  "tracking-[0.02em] transition-[background-color,border-color,color,transform] " +
  "duration-300 ease-out select-none disabled:pointer-events-none disabled:opacity-50 " +
  // Rectangulo con esquinas apenas marcadas: la geometria es parte del lenguaje
  // grafico del despacho, un boton muy redondeado lo rompe.
  "rounded-[3px] active:translate-y-px motion-reduce:active:translate-y-0";

const variants: Record<ButtonVariant, string> = {
  solid: "bg-fg text-bg hover:bg-accent hover:text-accent-fg",
  outline:
    "border border-line-strong text-fg hover:border-fg hover:bg-fg hover:text-bg",
  ghost: "text-fg hover:bg-bg-alt",
  quiet: "text-fg-muted hover:text-fg",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[0.8125rem]",
  md: "h-11 px-6",
  lg: "h-13 px-8 text-[0.9375rem]",
};

export function buttonClasses(
  variant: ButtonVariant = "solid",
  size: ButtonSize = "md",
  className?: string,
): string {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export function Button({
  variant = "solid",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={buttonClasses(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

/**
 * Enlace con aspecto de boton. Se usa para las anclas de la propia pagina y
 * para destinos externos (WhatsApp, telefono, correo), que deben seguir siendo
 * un `<a>` real para que el navegador y el teclado los traten como tales.
 */
export function ButtonLink({
  variant = "solid",
  size = "md",
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <a className={buttonClasses(variant, size, className)} {...props}>
      {children}
    </a>
  );
}

/** Flecha que se desplaza ligeramente al pasar el cursor por el boton. */
export function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn(
        "size-4 transition-transform duration-300 ease-out group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0",
        className,
      )}
    >
      <path d="M3.5 10h13M11.5 5l5 5-5 5" />
    </svg>
  );
}
