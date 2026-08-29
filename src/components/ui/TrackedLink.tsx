"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import {
  track,
  type AnalyticsEvent,
  type AnalyticsParams,
} from "@/lib/analytics";

interface TrackedLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  event: AnalyticsEvent;
  params?: AnalyticsParams;
  children: ReactNode;
}

/**
 * Enlace normal que ademas registra un evento en GA4.
 *
 * Aisla la unica parte que necesita ejecutarse en el navegador, de modo que
 * las secciones que lo usan siguen siendo Server Components. Sigue siendo un
 * `<a>` real: funciona con el teclado, con clic central y sin JavaScript.
 */
export function TrackedLink({
  event,
  params,
  children,
  onClick,
  ...props
}: TrackedLinkProps) {
  return (
    <a
      {...props}
      onClick={(nativeEvent) => {
        track(event, params);
        onClick?.(nativeEvent);
      }}
    >
      {children}
    </a>
  );
}
