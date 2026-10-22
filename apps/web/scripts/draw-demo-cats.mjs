// Draws the demo cat illustrations in public/demo (one per seed cat), in the flat, friendly style of the logo.
// Run: node apps/web/scripts/draw-demo-cats.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const OUT = fileURLToPath(new URL("../public/demo/", import.meta.url));

const HEAD = "M138 140C136 112 140 88 146 62C148 54 156 53 162 59L186 84C195 82 205 82 214 84L238 59C244 53 252 54 254 62C260 88 264 112 262 140C262 178 234 197 200 197C166 197 138 178 138 140Z";
const BODY = "M146 268C140 214 160 174 200 172C240 174 260 214 254 268C254 274 249 277 241 277H159C151 277 146 274 146 268Z";
const TAIL = "M238 266C292 270 318 238 302 198C295 180 279 177 272 188";

function cat(o) {
  const line = o.line ?? "none";
  const lw = o.line ? 2.5 : 0;
  const eyes = o.sleepy
    ? `<path d="M166 142q10 8 20 0M214 142q10 8 20 0" fill="none" stroke="${o.ink}" stroke-width="3.5" stroke-linecap="round"/>`
    : `<g fill="${o.eye}"><ellipse cx="176" cy="140" rx="10" ry="12"/><ellipse cx="224" cy="140" rx="10" ry="12"/></g>
  <g fill="#1c1a1b"><ellipse cx="176" cy="141" rx="3.6" ry="9"/><ellipse cx="224" cy="141" rx="3.6" ry="9"/></g>
  <g fill="#fff"><circle cx="179" cy="135" r="2.6"/><circle cx="227" cy="135" r="2.6"/></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <defs><clipPath id="coat"><path d="${HEAD}"/><path d="${BODY}"/></clipPath></defs>
  <rect width="400" height="300" fill="${o.bg}"/>
  ${o.back ?? `<circle cx="200" cy="168" r="112" fill="${o.blob}"/>`}
  ${o.under ?? `<ellipse cx="200" cy="278" rx="96" ry="9" fill="#1c1a1b" opacity=".07"/>`}
  <path d="${TAIL}" fill="none" stroke="${o.line ?? o.coat}" stroke-width="${o.line ? 21 : 17}" stroke-linecap="round"/>
  ${o.line ? `<path d="${TAIL}" fill="none" stroke="${o.coat}" stroke-width="16" stroke-linecap="round"/>` : ""}
  <path d="${BODY}" fill="${o.coat}" stroke="${line}" stroke-width="${lw}"/>
  <path d="${HEAD}" fill="${o.coat}" stroke="${line}" stroke-width="${lw}"/>
  <g clip-path="url(#coat)">${o.patches ?? ""}
    ${o.chest ? `<ellipse cx="200" cy="222" rx="27" ry="40" fill="${o.chest}"/><ellipse cx="200" cy="176" rx="34" ry="16" fill="${o.chest}"/>` : ""}
  </g>
  <g fill="${o.innerEar}" opacity=".9"><path d="M154 72L177 90C168 93 160 99 155 106C152 94 152 82 154 72Z"/><path d="M246 72L223 90C232 93 240 99 245 106C248 94 248 82 246 72Z"/></g>
  ${eyes}
  <path d="M193 158h14l-7 7.5z" fill="${o.nose}"/>
  <path d="M200 165q-6 8-13 4M200 165q6 8 13 4" fill="none" stroke="${o.ink}" stroke-width="2.5" stroke-linecap="round"/>
  <g stroke="${o.whisker ?? o.ink}" stroke-width="1.8" stroke-linecap="round" opacity=".45"><path d="M160 160L124 154M160 167L126 170M240 160L276 154M240 167L274 170"/></g>
  <g fill="${o.paw ?? o.coat}" stroke="${o.pawLine ?? o.line ?? "none"}" stroke-width="${o.pawLine || o.line ? 2.5 : 0}"><ellipse cx="182" cy="271" rx="17" ry="10"/><ellipse cx="218" cy="271" rx="17" ry="10"/></g>
  <path d="M182 263v8M218 263v8" stroke="${o.ink}" stroke-width="1.8" stroke-linecap="round" opacity=".25"/>
  ${o.front ?? ""}
</svg>
`;
}

const stripes = (c) => `<g fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round">
    <path d="M200 92v18M186 96l4 14M214 96l-4 14"/><path d="M140 128h14M140 142h12M260 128h-14M260 142h-12"/>
    <path d="M150 214q14 6 26 0M150 236q14 6 26 0M224 214q14 6 26 0M224 236q14 6 26 0M152 256q12 5 22 0M226 256q12 5 22 0"/></g>`;

const cats = {
  // Tobias: ginger, lying on a checked blanket.
  "gato-laranja": cat({
    bg: "#FBF4EC", blob: "#F6E3CF", coat: "#E8995A", chest: "#F7D9B8", innerEar: "#F2B48A", eye: "#7FB069", nose: "#D77A7A", ink: "#6B3B17",
    patches: stripes("#D27E3C"), paw: "#F7D9B8",
    under: `<rect x="92" y="258" width="216" height="34" rx="10" fill="#B9C7D8"/><g stroke="#93A5BC" stroke-width="5"><path d="M128 258v34M164 258v34M200 258v34M236 258v34M272 258v34"/><path d="M92 274h216"/></g>`,
  }),
  // Mia: grey tabby looking straight at you.
  "gato-tigrado": cat({
    bg: "#F2F4F5", blob: "#E1E6E9", coat: "#A39C95", chest: "#E5E0DA", innerEar: "#D9A9A4", eye: "#C9B44B", nose: "#C98585", ink: "#3D3834",
    patches: stripes("#6E6760"), paw: "#E5E0DA",
  }),
  // Carvão: black, amber eyes.
  "gato-preto": cat({
    bg: "#F3F0EA", blob: "#E7E0D3", coat: "#262224", innerEar: "#5A4A4E", eye: "#F0C340", nose: "#8C5A64", ink: "#F3F0EA", whisker: "#F3F0EA",
  }),
  // Estrela: white with grey patches.
  "gato-branco": cat({
    bg: "#EEF3F7", blob: "#DCE6EE", coat: "#FFFFFF", line: "#C9D3DB", innerEar: "#F2C4C4", eye: "#7BA9D6", nose: "#E39A9A", ink: "#4A4A52",
    patches: `<path d="M138 60h62v58c-22 6-44 2-62-10Z" fill="#B8BEC4"/><ellipse cx="236" cy="236" rx="30" ry="22" fill="#B8BEC4"/>`,
  }),
  // Pimenta: calico with a bandaged paw.
  "gato-tricolor": cat({
    bg: "#FAF3EE", blob: "#F1E2D8", coat: "#FFFDFB", line: "#E2D6CC", innerEar: "#F0BDB0", eye: "#9BB86A", nose: "#E09090", ink: "#4D3A30",
    patches: `<path d="M138 50h58c4 24-6 46-30 52-12 3-24 0-28-8Z" fill="#E59A55"/><path d="M212 50h52v70c-18 2-36-6-46-22-8-14-10-32-6-48Z" fill="#2A2527"/><path d="M226 180c22-6 40 10 36 40-14 8-34 6-44-8-6-12-2-26 8-32Z" fill="#E59A55"/><path d="M140 222c14-8 32-2 34 16 2 14-10 26-34 28Z" fill="#2A2527"/>`,
    front: `<g><rect x="203" y="258" width="30" height="20" rx="8" fill="#FFFFFF" stroke="#CFC4BA" stroke-width="2"/><path d="M211 259v18M219 259v18M227 259v18" stroke="#E0D6CD" stroke-width="2"/></g>`,
  }),
  // Bolacha: calico on a round cushion.
  "gato-tricolor-almofada": cat({
    bg: "#F4F1F8", blob: "#E5DFEE", coat: "#FFFDFB", line: "#E2D6CC", innerEar: "#F0BDB0", eye: "#D9A441", nose: "#E09090", ink: "#4D3A30",
    patches: `<path d="M140 50h70v40c-20 16-50 14-70-2Z" fill="#2A2527"/><path d="M230 52h40v80c-20-4-38-20-42-40-2-14-1-28 2-40Z" fill="#E59A55"/><path d="M150 196c26-8 40 14 30 42-10 4-24 2-34-6Z" fill="#E59A55"/><path d="M226 224c16-6 34 2 34 22v24h-40c-6-18-6-36 6-46Z" fill="#2A2527"/>`,
    under: `<ellipse cx="200" cy="278" rx="118" ry="20" fill="#B6A3D0"/><ellipse cx="200" cy="272" rx="104" ry="13" fill="#C9BADD"/>`,
  }),
  // Lua: senior white cat dozing in the sun by a window.
  "gato-branco-janela": cat({
    bg: "#FBF6E9", blob: "#FBF6E9", coat: "#FFFFFF", line: "#D9D0C2", innerEar: "#F2C4C4", nose: "#E39A9A", ink: "#5A524A", sleepy: true,
    back: `<rect x="40" y="26" width="320" height="236" rx="14" fill="#DCEAF3"/><circle cx="300" cy="80" r="30" fill="#F6D27A"/><path d="M200 26v236M40 144h320" stroke="#FBF6E9" stroke-width="10"/><rect x="40" y="26" width="320" height="236" rx="14" fill="none" stroke="#E6DCC8" stroke-width="10"/>`,
    under: `<rect x="20" y="262" width="360" height="38" fill="#E6DCC8"/>`,
    patches: `<ellipse cx="164" cy="80" rx="26" ry="30" fill="#E9E4DC"/>`,
  }),
};

for (const [name, svg] of Object.entries(cats)) writeFileSync(OUT + name + ".svg", svg);
console.log(`Wrote ${Object.keys(cats).length} illustrations to ${OUT}`);
