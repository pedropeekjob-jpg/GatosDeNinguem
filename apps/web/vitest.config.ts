import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)), "server-only": fileURLToPath(new URL("./test/server-only.ts", import.meta.url)) } },
  test: { environment: "jsdom", globals: true, setupFiles: ["./vitest.setup.ts"], exclude: ["e2e/**", "node_modules/**"] },
});
