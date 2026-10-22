import { defineConfig } from "tsup";

export default defineConfig({
  // seed-db is built too, so a deploy can load the demo content without dev tools.
  entry: ["src/main.ts", "src/seed-db.ts"],
  format: ["esm"],
  platform: "node",
  target: "node22",
  // Workspace packages are TypeScript sources, so bundle them in.
  noExternal: [/^@gn\//],
});
