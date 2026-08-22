import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  { rules: { "@next/next/no-html-link-for-pages": "off", "@next/next/no-img-element": "off", "import/no-anonymous-default-export": "off" } },
  globalIgnores([".next/**", "storybook-static/**", "coverage/**", "next-env.d.ts"]),
]);
