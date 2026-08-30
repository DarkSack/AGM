/**
 * Next enmascara los errores de render de componentes de servidor en
 * produccion: solo deja un `digest`, que no dice nada. Esto los vuelve a
 * imprimir con su mensaje y su traza en los registros del servidor y del
 * build, que es donde hacen falta cuando un prerender falla en el deploy y
 * no se reproduce en local.
 *
 * No expone nada al navegador: `onRequestError` corre solo en el servidor.
 */
export async function onRequestError(
  error: unknown,
  request: { path?: string },
  context: { routePath?: string; renderSource?: string },
): Promise<void> {
  const e = error as Error & { digest?: string };
  console.error(
    `[error] ${context.routePath ?? request.path ?? "?"} (${context.renderSource ?? "?"})` +
      `${e?.digest ? ` digest=${e.digest}` : ""}\n${e?.stack ?? String(error)}`,
  );
}

export async function register(): Promise<void> {
  // Sin instrumentacion adicional; el fichero existe por `onRequestError`.
}
