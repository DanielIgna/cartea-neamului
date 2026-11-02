import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { env: { PGLITE_DIR: "memory" }, testTimeout: 30000, exclude: ["node_modules", ".claude"] },
});
