import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Desde Next 16, `eslint-config-next` exporta configuracion "flat" nativa.
 * Antes se cargaba a traves de `FlatCompat`, que con la version 16 falla al
 * validar los plugins.
 */
const config = defineConfig([
  ...nextVitals,
  ...nextTs,
  // `next-env.d.ts` lo genera Next en cada build y no se edita a mano.
  globalIgnores([".next/**", "node_modules/**", "out/**", "next-env.d.ts"]),
]);

export default config;
