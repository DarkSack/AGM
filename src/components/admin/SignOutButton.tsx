"use client";

import { useTransition } from "react";
import { signOut } from "@/lib/admin/actions";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => void signOut())}
      className="rounded-[3px] border border-line px-3 py-1.5 text-xs text-fg-muted transition-colors hover:border-line-strong hover:text-fg disabled:opacity-60"
    >
      {pending ? "Saliendo…" : "Cerrar sesión"}
    </button>
  );
}
