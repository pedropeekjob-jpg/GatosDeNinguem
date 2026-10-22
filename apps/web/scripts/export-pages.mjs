// Builds the public site as plain files for GitHub Pages (demo content, no server).
// Usage: BASE_PATH=/GatosDeNinguem node scripts/export-pages.mjs  → out/
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const base = (process.env.BASE_PATH ?? "").replace(/\/$/, "");
const stash = ".pages-stash";
// Server-only parts: form endpoints and DB-driven redirects. Static hosting cannot run them.
const serverOnly = ["app/api", "middleware.ts"];

rmSync(stash, { recursive: true, force: true });
mkdirSync(stash);
for (const p of serverOnly) if (existsSync(p)) renameSync(p, join(stash, p.replace("/", "__")));

let status = 1;
try {
  const env = { ...process.env, STATIC_EXPORT: "1", NEXT_PUBLIC_STATIC_DEMO: "1", NEXT_PUBLIC_BASE_PATH: base, API_URL: "", ALLOW_INDEXING: "false" };
  status = spawnSync("pnpm", ["exec", "next", "build"], { env, stdio: "inherit", shell: process.platform === "win32" }).status ?? 1;
} finally {
  for (const p of serverOnly) {
    const from = join(stash, p.replace("/", "__"));
    if (existsSync(from)) renameSync(from, p);
  }
  rmSync(stash, { recursive: true, force: true });
}
if (status !== 0) process.exit(status);

if (base) {
  // Our components write plain links like "/adotar". Under a sub-path they need the prefix:
  // fixed in the HTML for crawlers and no-JS readers, and live in the browser for content drawn by scripts.
  const fixer = `<script>(function(b){function f(e){var a=e.tagName==="A"?"href":e.tagName==="IMG"?"src":null;if(!a)return;var v=e.getAttribute(a);if(v&&v[0]==="/"&&v[1]!=="/"&&v!==b&&v.indexOf(b+"/")!==0)e.setAttribute(a,b+v)}function s(n){if(n.querySelectorAll){f(n);n.querySelectorAll('a[href^="/"],img[src^="/"]').forEach(f)}}new MutationObserver(function(m){m.forEach(function(r){r.type==="attributes"?f(r.target):r.addedNodes.forEach(s)})}).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:["href","src"]})})(${JSON.stringify(base)});</script>`;
  const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const attr = new RegExp(`(\\s(?:href|src)=")/(?!/|${escaped.slice(1)}/)`, "g");
  const walk = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(join(dir, d.name)) : d.name.endsWith(".html") ? [join(dir, d.name)] : []));
  for (const file of walk("out")) {
    const html = readFileSync(file, "utf8").replace(attr, `$1${base}/`).replace("<head>", `<head>${fixer}`);
    writeFileSync(file, html);
  }
}
writeFileSync("out/.nojekyll", "");
console.log(`Static demo ready in apps/web/out${base ? ` (served under ${base})` : ""}`);
