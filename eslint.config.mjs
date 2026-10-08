import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Copiile de lucru ale agenților care lucrează la variante în paralel.
    // Fiecare are propriul `.next`, iar eslint raporta sute de probleme din
    // codul generat de Turbopack, nu din proiect.
    ".claude/**",
  ]),
]);

export default eslintConfig;
