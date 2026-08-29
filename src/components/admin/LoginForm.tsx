"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "signIn" | "reset";

/**
 * Acceso al panel.
 *
 * Autentica contra Supabase Auth. La contrasena viaja del navegador a Supabase
 * y nunca pasa por nuestro servidor ni se guarda en ninguna parte del codigo.
 *
 * Los errores se muestran genericos a proposito: distinguir "ese correo no
 * existe" de "la contrasena no es correcta" permitiria averiguar que cuentas
 * hay dadas de alta.
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("signIn");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<
    { kind: "error" | "info"; text: string } | null
  >(() =>
    searchParams.get("error") === "sin-perfil"
      ? {
          kind: "error",
          text: "Tu cuenta existe pero todavía no tiene acceso al panel. Pide a un administrador que te dé de alta.",
        }
      : null,
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    setPending(true);
    setMessage(null);

    try {
      const supabase = createClient();

      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/admin/login`,
        });
        // Se responde igual exista o no la cuenta, para no revelar cuales hay.
        setMessage({
          kind: error ? "error" : "info",
          text: error
            ? "No se pudo enviar el correo. Inténtalo de nuevo."
            : "Si esa dirección tiene acceso, recibirás un correo para restablecer la contraseña.",
        });
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage({
          kind: "error",
          text: "Correo o contraseña incorrectos.",
        });
        return;
      }

      const next = searchParams.get("next");
      // Solo rutas internas del panel: un `next` con URL absoluta seria un
      // redirect abierto.
      const target = next?.startsWith("/admin") ? next : "/admin";
      router.replace(target);
      router.refresh();
    } catch {
      setMessage({
        kind: "error",
        text: "No se pudo conectar con el servidor. Revisa tu conexión.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email"
          className="text-xs font-medium tracking-[0.06em] text-fg-muted uppercase"
        >
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
          className="w-full rounded-[3px] border border-line bg-surface px-3 py-2.5 text-sm text-fg focus:border-accent focus:outline-none"
        />
      </div>

      {mode === "signIn" ? (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="text-xs font-medium tracking-[0.06em] text-fg-muted uppercase"
          >
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-[3px] border border-line bg-surface px-3 py-2.5 text-sm text-fg focus:border-accent focus:outline-none"
          />
        </div>
      ) : null}

      {message ? (
        <p
          role="alert"
          className={
            message.kind === "error"
              ? "border-l-2 border-accent pl-3 text-sm leading-relaxed text-fg"
              : "border-l-2 border-line-strong pl-3 text-sm leading-relaxed text-fg-muted"
          }
        >
          {message.text}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center justify-center rounded-[3px] bg-fg px-6 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-accent-fg disabled:opacity-60"
      >
        {pending
          ? "Un momento…"
          : mode === "signIn"
            ? "Entrar"
            : "Enviar enlace"}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signIn" ? "reset" : "signIn");
          setMessage(null);
        }}
        className="self-start text-xs text-fg-subtle underline underline-offset-4 transition-colors hover:text-fg"
      >
        {mode === "signIn"
          ? "He olvidado mi contraseña"
          : "Volver al inicio de sesión"}
      </button>
    </form>
  );
}
