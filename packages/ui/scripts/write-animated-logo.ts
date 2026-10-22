// Writes the animated logo as standalone SVG files (they play on their own, e.g. in <img> or opened in a browser).
// Run: pnpm --filter @gn/ui logo:svg
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { animatedLogoSvg } from "../src/components/logoRig";

const pub = (app: string, name: string) => fileURLToPath(new URL(`../../../apps/${app}/public/${name}`, import.meta.url));
const files = {
  "logo-animado.svg": animatedLogoSvg({ variant: "intro", label: "Gatos de Ninguém" }),
  "logo-a-carregar.svg": animatedLogoSvg({ variant: "loader", label: "A carregar…" }),
};
for (const app of ["web", "backoffice"]) {
  for (const [name, svg] of Object.entries(files)) writeFileSync(pub(app, name), svg + "\n");
}
console.log("Wrote", Object.keys(files).join(", "));
