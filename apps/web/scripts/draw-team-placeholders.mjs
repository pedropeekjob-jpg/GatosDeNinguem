// Draws the placeholder team portraits in public/equipa (flat, friendly, clearly not real people)
// until the association sends photos of its team. Run: node apps/web/scripts/draw-team-placeholders.mjs
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
// sharp comes with Next.js (image optimisation), so no extra dependency.
const sharp = createRequire(require.resolve("next/package.json"))("sharp");
const OUT = fileURLToPath(new URL("../public/equipa/", import.meta.url));

const HAIR = {
  long: (c) => `<path d="M140 250C128 150 170 104 240 104C310 104 352 150 340 250C340 330 330 380 318 400H162C150 380 140 330 140 250Z" fill="${c}"/>`,
  bob: (c) => `<path d="M150 240C146 152 186 110 240 110C294 110 334 152 330 240C330 280 322 300 312 306H168C158 300 150 280 150 240Z" fill="${c}"/>`,
  short: (c) => `<path d="M168 214C162 146 196 116 240 116C284 116 318 146 312 214C300 180 280 166 240 166C200 166 180 180 168 214Z" fill="${c}"/>`,
  bun: (c) => `<circle cx="240" cy="106" r="34" fill="${c}"/><path d="M166 222C160 152 194 124 240 124C286 124 320 152 314 222C302 184 280 170 240 170C200 170 178 184 166 222Z" fill="${c}"/>`,
  bald: () => "",
  curly: (c) => `<g fill="${c}">${[[178,170],[204,140],[240,128],[276,140],[302,170],[168,206],[312,206]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="30"/>`).join("")}</g>`,
};

function person(o) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 600">
  <rect width="480" height="600" fill="${o.bg}"/>
  ${o.hair === "long" ? HAIR.long(o.hairColor) : ""}
  <path d="M76 600C76 480 150 420 240 420C330 420 404 480 404 600Z" fill="${o.shirt}"/>
  <path d="M206 372H274V430C274 448 258 458 240 458C222 458 206 448 206 430Z" fill="${o.skinShade}"/>
  <ellipse cx="240" cy="250" rx="80" ry="98" fill="${o.skin}"/>
  <ellipse cx="160" cy="258" rx="14" ry="22" fill="${o.skin}"/><ellipse cx="320" cy="258" rx="14" ry="22" fill="${o.skin}"/>
  ${o.hair !== "long" ? HAIR[o.hair](o.hairColor) : `<path d="M162 230C170 170 204 146 240 146C276 146 310 170 318 230C296 196 270 184 240 184C210 184 184 196 162 230Z" fill="${o.hairColor}"/>`}
  ${o.beard ? `<path d="M168 280C176 340 206 356 240 356C274 356 304 340 312 280C298 312 276 318 240 318C204 318 182 312 168 280Z" fill="${o.hairColor}"/>` : ""}
  <g fill="#1c1a1b"><ellipse cx="210" cy="252" rx="7" ry="9"/><ellipse cx="270" cy="252" rx="7" ry="9"/></g>
  <path d="M214 302Q240 322 266 302" fill="none" stroke="#1c1a1b" stroke-width="6" stroke-linecap="round"/>
  ${o.glasses ? `<g fill="none" stroke="#1c1a1b" stroke-width="5"><circle cx="210" cy="252" r="24"/><circle cx="270" cy="252" r="24"/><path d="M234 252H246"/></g>` : ""}
  <path d="M200 432Q240 462 280 432" fill="none" stroke="${o.collar}" stroke-width="8" stroke-linecap="round"/>
</svg>`;
}

const SKIN = [["#f2c9a8", "#dcae8c"], ["#c68a62", "#ac7350"], ["#8d5a3c", "#774a30"], ["#e8b991", "#cf9f78"]];
const people = [
  { file: "pessoa-1", bg: "#f5f3f1", skin: SKIN[0], hair: "long", hairColor: "#5b3a24", shirt: "#1c1a1b", collar: "#ffc83d" },
  { file: "pessoa-2", bg: "#ece8e4", skin: SKIN[1], hair: "short", hairColor: "#2b2422", shirt: "#57524f", collar: "#f5f3f1", beard: true, glasses: true },
  { file: "pessoa-3", bg: "#fff3cf", skin: SKIN[3], hair: "bun", hairColor: "#b5651d", shirt: "#1c1a1b", collar: "#ffffff" },
  { file: "pessoa-4", bg: "#f5f3f1", skin: SKIN[2], hair: "curly", hairColor: "#1c1a1b", shirt: "#8a8380", collar: "#1c1a1b" },
  { file: "pessoa-5", bg: "#ece8e4", skin: SKIN[0], hair: "bob", hairColor: "#d9b26a", shirt: "#1c1a1b", collar: "#ffc83d", glasses: true },
  { file: "pessoa-6", bg: "#fff3cf", skin: SKIN[3], hair: "bald", hairColor: "#8a8380", shirt: "#57524f", collar: "#ffffff", beard: true },
];

for (const p of people) {
  const svg = person({ ...p, skin: p.skin[0], skinShade: p.skin[1] });
  await sharp(Buffer.from(svg)).resize(480, 600).webp({ quality: 82 }).toFile(`${OUT}${p.file}.webp`);
}
console.log(`Drew ${people.length} placeholder portraits in ${OUT}`);
