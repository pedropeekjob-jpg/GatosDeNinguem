// Renders the strolling cat (gato.html, the logo's cat as a 3D cartoon) into one sprite strip per action:
// apps/web/public/gato/<action>.webp, frames side by side, and gato/acoes.json with each action's frame count and
// length, which components/client/StrollingCat.tsx plays with CSS steps(). Run after changing gato.html:
//   node apps/web/scripts/gato-3d/render-gato-3d.mjs [--frames dir]   (--frames also keeps every frame as PNG)
// It needs Playwright's Chromium (WebGL in software is enough; a frame takes about a second).
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { mkdirSync, writeFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve("next/package.json"))("sharp");
const { chromium } = require("playwright");
const OUT = fileURLToPath(new URL("../../public/gato/", import.meta.url));
const PAGE = new URL("./gato.html", import.meta.url).href;
const FPS = 12;
/** Each frame, in pixels: 1.5 times the cat's size on a computer screen, sharp enough and light. */
const FW = 228, FH = 161;
const framesDir = process.argv.includes("--frames") ? process.argv[process.argv.indexOf("--frames") + 1] : null;

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage();
page.on("pageerror", (e) => { console.error(e); process.exit(1); });
await page.goto(PAGE);
const actions = await page.evaluate(() => window.ACTIONS);
const only = process.argv.slice(2).filter((a) => actions[a]);
mkdirSync(OUT, { recursive: true });
const meta = {};
for (const [name, { s, loop }] of Object.entries(actions)) {
  const n = Math.round(s * FPS);
  meta[name] = { frames: n, seconds: s, loop };
  if (only.length && !only.includes(name)) continue;
  const frames = [];
  for (let i = 0; i < n; i++) {
    // a loop ends just before its first frame comes round again; a one-off ends on its last pose
    const t = loop ? i / n : i / (n - 1);
    const url = await page.evaluate(([a, t]) => window.frame(a, t), [name, Math.min(t, 0.99999)]);
    frames.push(await sharp(Buffer.from(url.split(",")[1], "base64")).resize(FW, FH).png().toBuffer());
    if (framesDir) { mkdirSync(`${framesDir}/${name}`, { recursive: true }); writeFileSync(`${framesDir}/${name}/${String(i).padStart(3, "0")}.png`, frames[i]); }
  }
  await sharp({ create: { width: FW * n, height: FH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(frames.map((input, i) => ({ input, left: i * FW, top: 0 })))
    .webp({ quality: 74, alphaQuality: 80, effort: 6 })
    .toFile(`${OUT}${name}.webp`);
  console.log(name, n, "frames");
}
writeFileSync(`${OUT}acoes.json`, JSON.stringify({ width: FW, height: FH, fps: FPS, actions: meta }, null, 2) + "\n");
await browser.close();
