"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { ADMIN_NAV } from "./nav-items";

/**
 * Navegacion lateral. Es cliente solo para resaltar la seccion actual.
 */
export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Secciones del panel">
      <ul className="flex flex-col gap-0.5">
        {ADMIN_NAV.map((item) => {
          const active =
            "exact" in item && item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block rounded-[3px] px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-fg text-bg"
                    : "text-fg-muted hover:bg-bg-alt hover:text-fg",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
