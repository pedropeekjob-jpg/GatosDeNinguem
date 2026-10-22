import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/main.ts"],
  format: ["esm"],
  platform: "node",
  target: "node22",
  // Workspace packages are TypeScript sources, so bundle them in.
  noExternal: [/^@gn\//],
});
