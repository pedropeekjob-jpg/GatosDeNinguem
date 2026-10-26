// Draws the placeholder group picture for "Quem somos" (public/equipa/grupo.webp): the volunteers side by side
// with a few cats, flat and friendly, clearly not real people. Swap it for a real group photo when the association
// sends one (docs/equipa-origem/ORIGEM.md). Run: node apps/web/scripts/draw-team-banner.mjs
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
// sharp comes with Next.js (image optimisation), so no extra dependency.
const sharp = createRequire(require.resolve("next/package.json"))("sharp");
const OUT = fileURLToPath(new URL("../public/equipa/", import.meta.url));

const HAIR = {
  long: (c) => `<path d="M162 230C170 170 204 146 240 146C276 146 310 170 318 230C296 196 270 184 240 184C210 184 184 196 162 230Z" fill="${c}"/>`,
  bob: (c) => `<path d="M150 240C146 152 186 110 240 110C294 110 334 152 330 240C330 280 322 300 312 306H168C158 300 150 280 150 240Z" fill="${c}"/>`,
  short: (c) => `<path d="M168 214C162 146 196 116 240 116C284 116 318 146 312 214C300 180 280 166 240 166C200 166 180 180 168 214Z" fill="${c}"/>`,
  bun: (c) => `<circle cx="240" cy="106" r="34" fill="${c}"/><path d="M166 222C160 152 194 124 240 124C286 124 320 152 314 222C302 184 280 170 240 170C200 170 178 184 166 222Z" fill="${c}"/>`,
  bald: () => "",
  curly: (c) => `<g fill="${c}">${[[178, 170], [204, 140], [240, 128], [276, 140], [302, 170], [168, 206], [312, 206]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="30"/>`).join("")}</g>`,
};

/** One person, head and shoulders, in a 480×600 box (head centre at 240,250). */
function person(o) {
  const longBack = o.hair === "long" ? `<path d="M140 250C128 150 170 104 240 104C310 104 352 150 340 250C340 330 330 380 318 400H162C150 380 140 330 140 250Z" fill="${o.hairColor}"/>` : "";
  return `${longBack}
  <path d="M76 1400V600C76 480 150 420 240 420C330 420 404 480 404 600V1400Z" fill="${o.shirt}"/>
  <path d="M206 372H274V430C274 448 258 458 240 458C222 458 206 448 206 430Z" fill="${o.skin[1]}"/>
  <ellipse cx="240" cy="250" rx="80" ry="98" fill="${o.skin[0]}"/>
  <ellipse cx="160" cy="258" rx="14" ry="22" fill="${o.skin[0]}"/><ellipse cx="320" cy="258" rx="14" ry="22" fill="${o.skin[0]}"/>
  ${HAIR[o.hair](o.hairColor)}
  ${o.beard ? `<path d="M168 280C176 340 206 356 240 356C274 356 304 340 312 280C298 312 276 318 240 318C204 318 182 312 168 280Z" fill="${o.hairColor}"/>` : ""}
  <g fill="#1c1a1b"><path d="M200 254q10 -12 20 0" stroke="#1c1a1b" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M260 254q10 -12 20 0" stroke="#1c1a1b" stroke-width="6" fill="none" stroke-linecap="round"/></g>
  <path d="M206 296Q240 336 274 296Z" fill="#1c1a1b"/><path d="M216 302Q240 314 264 302" fill="#fff" />
  <g fill="#e88f7a" opacity=".35"><circle cx="190" cy="290" r="14"/><circle cx="290" cy="290" r="14"/></g>
  ${o.glasses ? `<g fill="none" stroke="#1c1a1b" stroke-width="5"><circle cx="210" cy="252" r="24"/><circle cx="270" cy="252" r="24"/><path d="M234 252H246"/></g>` : ""}`;
}

/** A sitting cat seen from the front, about 200×220, sitting on y=0 at x=0 (centre). */
function cat(o) {
  return `<g>
  <path d="M60 -10C110 -10 130 -60 104 -90" fill="none" stroke="${o.coat}" stroke-width="18" stroke-linecap="round"/>
  <path d="M-70 0C-76 -70 -50 -120 0 -122C50 -120 76 -70 70 0Z" fill="${o.coat}"/>
  <path d="M-62 -150C-64 -176 -60 -198 -54 -220L-26 -194C-10 -198 10 -198 26 -194L54 -220C60 -198 64 -176 62 -150C62 -112 34 -96 0 -96C-34 -96 -62 -112 -62 -150Z" fill="${o.coat}"/>
  ${o.chest ? `<ellipse cx="0" cy="-60" rx="26" ry="40" fill="${o.chest}"/>` : ""}
  <g fill="${o.eye}"><ellipse cx="-24" cy="-152" rx="9" ry="11"/><ellipse cx="24" cy="-152" rx="9" ry="11"/></g>
  <g fill="#1c1a1b"><ellipse cx="-24" cy="-151" rx="3.4" ry="8"/><ellipse cx="24" cy="-151" rx="3.4" ry="8"/></g>
  <path d="M-7 -132h14l-7 7z" fill="#d98c8c"/>
  </g>`;
}

const SKIN = [["#f2c9a8", "#dcae8c"], ["#c68a62", "#ac7350"], ["#8d5a3c", "#774a30"], ["#e8b991", "#cf9f78"]];
// Back row first (drawn behind), then the front row; x is the person's centre, s the scale.
const people = [
  { x: 330, y: 70, s: 0.78, skin: SKIN[1], hair: "short", hairColor: "#2b2422", shirt: "#57524f", beard: true, glasses: true },
  { x: 640, y: 40, s: 0.8, skin: SKIN[3], hair: "bun", hairColor: "#b5651d", shirt: "#ffc83d" },
  { x: 960, y: 60, s: 0.8, skin: SKIN[2], hair: "curly", hairColor: "#1c1a1b", shirt: "#8a8380" },
  { x: 1270, y: 80, s: 0.78, skin: SKIN[3], hair: "bald", hairColor: "#8a8380", shirt: "#57524f", beard: true },
  { x: 480, y: 250, s: 0.86, skin: SKIN[0], hair: "long", hairColor: "#5b3a24", shirt: "#1c1a1b" },
  { x: 1110, y: 250, s: 0.86, skin: SKIN[0], hair: "bob", hairColor: "#d9b26a", shirt: "#1c1a1b", glasses: true },
  { x: 800, y: 300, s: 0.66, skin: SKIN[1], hair: "curly", hairColor: "#3b2a20", shirt: "#e5e1dd" }, // a child in front
];

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
  <rect width="1600" height="900" fill="#f5f3f1"/>
  <circle cx="800" cy="520" r="520" fill="#fff3cf"/>
  ${people.map((p) => `<g transform="translate(${p.x - 240 * p.s} ${p.y}) scale(${p.s})">${person(p)}</g>`).join("\n")}
  <g transform="translate(150 900) scale(1.1)">${cat({ coat: "#1c1a1b", eye: "#ffc83d" })}</g>
  <g transform="translate(1460 900) scale(1.05)">${cat({ coat: "#E8995A", chest: "#F7D9B8", eye: "#7FB069" })}</g>
  <g transform="translate(800 900) scale(0.8)">${cat({ coat: "#A39C95", chest: "#E5E0DA", eye: "#C9B44B" })}</g>
</svg>`;

await sharp(Buffer.from(svg)).resize(1600, 900).webp({ quality: 82 }).toFile(`${OUT}grupo.webp`);
console.log(`Drew the placeholder group picture in ${OUT}grupo.webp`);
