import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import globals from "globals";

export default defineConfig([
  globalIgnores([
    ".next/**",
    ".next-dev/**",
    "out/**",
    ".tools/**",
    ".venv-security/**",
    "backend/.venv/**",
    "backend/runtime/**",
    "memory/**",
    ".claude/**",
    "next-env.d.ts",
    "test-results/**",
  ]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  jsxA11y.flatConfigs.recommended,
  // Private Windows browser drivers use the CommonJS file protocol.
  { files: ["**/*.cjs"], rules: { "@typescript-eslint/no-require-imports": "off" } },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
]);
