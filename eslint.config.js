import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import path from "path";
import process from "process";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["dist/**", "node_modules/**", "supabase/**"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: path.resolve("./tsconfig.json"),
        tsconfigRootDir: process.cwd(),
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
      },
    },
    plugins: [tseslint.plugin],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  }
);
