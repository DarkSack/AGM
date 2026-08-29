import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SectionProps {
  id: string;
  children: ReactNode;
  className?: string;
  /** Fondo alterno para separar secciones sin recurrir a tarjetas ni sombras. */
  tone?: "default" | "alt";
  labelledBy?: string;
}

export function Section({
  id,
  children,
  className,
  tone = "default",
  labelledBy,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        "section-y scroll-mt-20",
        tone === "alt" ? "bg-bg-alt" : "bg-bg",
        className,
      )}
    >
      {children}
    </section>
  );
}

interface SectionHeadingProps {
  id?: string;
  eyebrow: string;
  title: string;
  intro?: string;
  /** Numeral editorial tipo "02" que ordena la lectura de la pagina. */
  index?: string;
  className?: string;
  align?: "left" | "center";
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  intro,
  index,
  className,
  align = "left",
}: SectionHeadingProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-5",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      <div
        className="flex items-center gap-4"
        data-reveal
      >
        {index ? (
          <>
            <span className="numeral">{index}</span>
            <span aria-hidden="true" className="h-px w-8 bg-line-strong" />
          </>
        ) : null}
        <span className="eyebrow">{eyebrow}</span>
      </div>

      <h2
        id={id}
        className="max-w-[24ch] text-h2 text-fg"
        data-reveal
        style={{ "--reveal-delay": "60ms" } as React.CSSProperties}
      >
        {title}
      </h2>

      {intro ? (
        <p
          className={cn(
            "max-w-[58ch] text-lead text-fg-muted",
            align === "center" && "mx-auto",
          )}
          data-reveal
          style={{ "--reveal-delay": "120ms" } as React.CSSProperties}
        >
          {intro}
        </p>
      ) : null}
    </header>
  );
}
