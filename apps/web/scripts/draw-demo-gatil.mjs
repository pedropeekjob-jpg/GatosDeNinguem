// Draws placeholder photos of the shelter for the home page carousel (public/demo/gatil-*.svg).
// Same flat style as draw-demo-cats.mjs. Replace them with real photos in the back office (Fotos do gatil).
// Run: node apps/web/scripts/draw-demo-gatil.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const OUT = fileURLToPath(new URL("../public/demo/", import.meta.url));
const INK = "#1c1a1b";

const HEAD = "M138 140C136 112 140 88 146 62C148 54 156 53 162 59L186 84C195 82 205 82 214 84L238 59C244 53 252 54 254 62C260 88 264 112 262 140C262 178 234 197 200 197C166 197 138 178 138 140Z";
const BODY = "M146 268C140 214 160 174 200 172C240 174 260 214 254 268C254 274 249 277 241 277H159C151 277 146 274 146 268Z";
const TAIL = "M238 266C292 270 318 238 302 198C295 180 279 177 272 188";
const LOAF = "M120 268C110 222 150 196 200 196C262 196 300 222 290 268C288 276 282 278 272 278H136C126 278 122 276 120 268Z";

/** A cat standing (or loafing) with its feet at (x, y). */
function cat({ x, y, s = 1, coat, eye = "#f2c14e", flip, sleepy, loaf, patch }) {
  const t = `translate(${x} ${y}) scale(${flip ? -s : s} ${s}) translate(-200 -278)`;
  const eyes = sleepy
    ? `<path d="M166 142q10 8 20 0M214 142q10 8 20 0" fill="none" stroke="${coat === INK ? "#ffffff" : INK}" stroke-width="3.5" stroke-linecap="round"/>`
    : `<g fill="${eye}"><ellipse cx="176" cy="140" rx="10" ry="12"/><ellipse cx="224" cy="140" rx="10" ry="12"/></g><g fill="${INK}"><ellipse cx="176" cy="141" rx="3.6" ry="9"/><ellipse cx="224" cy="141" rx="3.6" ry="9"/></g>`;
  const line = coat === "#ffffff" ? `stroke="${INK}" stroke-width="2.5"` : "";
  return `<g transform="${t}">
    <ellipse cx="200" cy="279" rx="${loaf ? 100 : 80}" ry="8" fill="${INK}" opacity=".08"/>
    <path d="${TAIL}" fill="none" stroke="${coat === "#ffffff" ? "#e6e2df" : coat}" stroke-width="17" stroke-linecap="round"/>
    <path d="${loaf ? LOAF : BODY}" fill="${coat}" ${line}/>
    <g transform="${loaf ? "translate(-30 34)" : ""}"><path d="${HEAD}" fill="${coat}" ${line}/>${patch ?? ""}${eyes}
    <path d="M195 160h10l-5 6z" fill="#e79a9a"/></g>
  </g>`;
}

const frame = (bg, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><rect width="1600" height="900" fill="${bg}"/>${body}</svg>`;
const floor = (c, y = 690) => `<rect y="${y}" width="1600" height="${900 - y}" fill="${c}"/>`;
const windowAt = (x, y, w, h, sky = "#cfe4ef") => `<rect x="${x - 14}" y="${y - 14}" width="${w + 28}" height="${h + 28}" rx="10" fill="#ffffff"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${sky}"/><path d="M${x + w / 2} ${y}v${h}M${x} ${y + h / 2}h${w}" stroke="#ffffff" stroke-width="12"/>`;
const shelf = (x, y, w) => `<rect x="${x}" y="${y}" width="${w}" height="22" rx="6" fill="#c9a77c"/>`;
const bowl = (x, y, c) => `<path d="M${x - 46} ${y - 30}h92l-12 30h-68z" fill="${c}"/><ellipse cx="${x}" cy="${y - 30}" rx="46" ry="9" fill="#8a5a3b"/>`;
const post = (x) => `<rect x="${x - 26}" y="360" width="52" height="330" fill="#d8c3a0"/><path d="M${x - 26} 400h52M${x - 26} 440h52M${x - 26} 480h52M${x - 26} 520h52M${x - 26} 560h52M${x - 26} 600h52" stroke="#bfa47c" stroke-width="5"/><rect x="${x - 110}" y="330" width="220" height="40" rx="12" fill="#f5f3f1"/><rect x="${x - 120}" y="680" width="240" height="24" rx="8" fill="#f5f3f1"/>`;
const ball = (x, y, c) => `<circle cx="${x}" cy="${y}" r="26" fill="${c}"/><path d="M${x - 22} ${y - 10}q22 18 44 0" fill="none" stroke="#ffffff" stroke-width="5" opacity=".7"/>`;
const tabbyStripes = `<path d="M184 74l6 22M200 70v24M216 74l-6 22" stroke="#9a6a3a" stroke-width="7" stroke-linecap="round"/>`;

const scenes = {
  "gatil-sala": frame("#efe9e2", `${floor("#e2d6c6")}${windowAt(1060, 140, 360, 300)}${shelf(160, 300, 380)}${post(1240)}
    ${cat({ x: 330, y: 300, s: 0.8, coat: INK, sleepy: true, loaf: true })}
    ${cat({ x: 640, y: 700, s: 1.2, coat: "#e39a4f", patch: tabbyStripes })}
    ${cat({ x: 1240, y: 340, s: 0.75, coat: "#ffffff", eye: "#7fb3d5", loaf: true })}
    ${cat({ x: 920, y: 712, s: 1, coat: "#8d8580", flip: true })}`),
  "gatil-refeicao": frame("#f3efe9", `${floor("#dcd2c4")}<rect x="0" y="560" width="1600" height="16" fill="#ffffff"/>
    ${cat({ x: 560, y: 708, s: 1.15, coat: "#e39a4f", patch: tabbyStripes, sleepy: true })}
    ${cat({ x: 1040, y: 708, s: 1.15, coat: INK, flip: true, sleepy: true })}
    ${bowl(720, 760, "#f2c14e")}${bowl(880, 760, "#ffffff")}`),
  "gatil-janela": frame("#e9e4de", `${floor("#d9cdbd", 720)}${windowAt(420, 110, 760, 470, "#bcdcf0")}<circle cx="980" cy="240" r="70" fill="#f9d66b"/>
    <rect x="380" y="600" width="840" height="36" rx="10" fill="#ffffff"/>
    <path d="M420 580l300 140h-300z" fill="#f9d66b" opacity=".18"/>
    ${cat({ x: 800, y: 606, s: 1.05, coat: "#ffffff", eye: "#9ccf8f", sleepy: true, loaf: true })}`),
  "gatil-brincar": frame("#f1ece6", `${floor("#e0d4c3")}${post(330)}
    <path d="M760 120c0 160 60 260 120 330" fill="none" stroke="${INK}" stroke-width="4"/><path d="M880 450l-26 46 52 0z" fill="#f2c14e"/>
    ${ball(1180, 700, "#e86a5c")}${ball(540, 712, "#5c9ce8")}
    ${cat({ x: 900, y: 712, s: 1.25, coat: "#8d8580" })}
    ${cat({ x: 1340, y: 712, s: 0.9, coat: INK, flip: true })}
    ${cat({ x: 330, y: 340, s: 0.7, coat: "#e39a4f", patch: tabbyStripes, sleepy: true, loaf: true })}`),
};

for (const [name, svg] of Object.entries(scenes)) writeFileSync(OUT + name + ".svg", svg);
console.log(`Wrote ${Object.keys(scenes).length} shelter scenes to ${OUT}`);
