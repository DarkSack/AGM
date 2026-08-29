import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // `next-env.d.ts` lo genera Next en cada build y no se edita a mano.
    ignores: [".next/**", "node_modules/**", "out/**", "next-env.d.ts"],
  },
];

export default config;
