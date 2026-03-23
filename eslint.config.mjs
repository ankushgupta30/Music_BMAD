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
    // BMAD / Cursor skill templates (not app code; may reference missing eslint plugins)
    "_bmad/**",
    ".agent/**",
    ".agents/**",
    ".cursor/skills/**",
  ]),
  {
    rules: {
      // False positives for syncing UI to props, auth hash cleanup, matchMedia, Supabase session.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
