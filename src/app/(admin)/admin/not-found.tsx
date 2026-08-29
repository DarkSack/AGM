import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-svh items-center justify-center px-5">
      <div className="max-w-md text-center">
        <p className="text-xs tracking-[0.14em] text-fg-subtle uppercase">404</p>
        <h1 className="mt-3 text-xl font-semibold text-fg">
          Esa página del panel no existe
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">
          Puede que el proyecto se haya eliminado o que la dirección esté mal
          escrita.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-flex h-10 items-center rounded-[3px] border border-line-strong px-4 text-sm text-fg transition-colors hover:bg-fg hover:text-bg"
        >
          Volver al panel
        </Link>
      </div>
    </div>
  );
}
