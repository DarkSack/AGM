import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

/**
 * Las pruebas cubren logica pura: normalizacion de slugs, resolucion de los
 * datos de contacto, el mapeo de lo que viene de la base de datos y los
 * esquemas de validacion. Nada de esto necesita navegador ni servidor, asi
 * que corre en el entorno `node` y sin arrancar Next.
 *
 * `vite-tsconfig-paths` es lo unico que hace falta para que el alias `@/`
 * funcione igual que en la aplicacion.
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
