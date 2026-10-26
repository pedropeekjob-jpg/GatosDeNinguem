import { LOGO_EYE, LOGO_EYE_LID, LOGO_MOUTH, LOGO_WINK } from "./logoPaths";

/*
 * The logo's cat walking, seen from the side and facing left. Like the logo it is one solid shape: the head flows
 * into the back in a single line, with only the logo's face (eye, wink, smile) and the light inside of the ear.
 * Walking, the legs bend at the knee, the hips sway and the tail waves; stopped, it head-butts the screen to get
 * our attention and rubs itself to and fro as a cat does against your legs, paws planted, tail up and quivering. Everything is SVG path animation (SMIL), so it runs
 * in every browser, inline or as a file. Coordinates: viewBox 0 0 1300 820, ground at y 800.
 */

export const WALKING_CAT_VIEWBOX = "0 0 1300 820";

const INK = "var(--gn-walk-ink, #221e20)";
const BG = "var(--gn-walk-bg, #fff)";
/** Head and body in one line, as in the logo: from the cheek up over the ears, down the neck along the back. */
const CAT = "M150 300C140 220 165 160 200 130L228 40L290 115C350 105 410 112 440 135L478 100L472 190C520 260 600 300 720 300"
  + "C880 300 1000 300 1080 340C1160 380 1180 470 1140 540C1100 610 1000 630 900 620C780 608 680 585 560 590"
  + "C470 595 420 610 360 600C260 585 200 520 175 440C165 400 155 350 150 300Z";
const EAR = "M222 112L232 70L262 108Z";
/** The logo's face, placed on the head. */
const FACE = "translate(-40 10) scale(1.1)";

/** One step, in four poses: reaching forward (left), under the body, pushing back, lifted while it swings forward. */
const FRONT = ["M430 580Q380 690 350 795", "M430 580Q415 690 430 800", "M430 580Q450 690 510 790", "M430 580Q370 660 400 745"];
const BACK = ["M1000 585Q1050 700 930 795", "M1000 585Q1050 690 1000 800", "M1000 585Q1040 680 1080 790", "M1000 585Q1060 660 1010 745"];
const FAR = "translate(45 -12)";
const TAIL = [
  "M1120 410C1220 390 1280 300 1250 200C1225 110 1130 80 1095 130",
  "M1120 410C1200 370 1240 270 1200 180C1170 115 1090 110 1070 160",
  "M1120 410C1230 400 1300 320 1290 210C1280 120 1200 70 1140 90",
];
/** Rubbing: the tail stands up and its tip quivers. */
const TAIL_UP = [
  "M1120 410C1150 330 1160 230 1130 150C1110 90 1060 80 1040 120",
  "M1120 410C1170 320 1190 220 1170 140C1155 80 1100 70 1075 100",
];
const SPLINE = ".45 0 .55 1";

const splines = (n: number) => Array.from({ length: n }, () => SPLINE).join(";");
const loop = (values: string[], dur: number, begin = 0) =>
  `<animate attributeName="d" dur="${dur}s" begin="${-begin}s" repeatCount="indefinite" calcMode="spline" values="${[...values, values[0]].join(";")}" keyTimes="${values.map((_, i) => i / values.length).concat(1).join(";")}" keySplines="${splines(values.length)}"/>`;
const move = (type: "translate" | "rotate", values: string[], dur: number) =>
  `<animateTransform attributeName="transform" type="${type}" dur="${dur}s" repeatCount="indefinite" calcMode="spline" values="${values.join(";")}" keyTimes="${values.map((_, i) => i / (values.length - 1)).join(";")}" keySplines="${splines(values.length - 1)}" additive="sum"/>`;

const leg = (poses: string[], walking: boolean, step: number, begin: number) =>
  `<path d="${poses[1]}" fill="none" stroke="${INK}" stroke-width="58" stroke-linecap="round">${walking ? loop(poses, step, begin) : ""}</path>`;

/** Where the cat's forehead meets the screen when it head-butts it. */
const BROW = "260 300";
/**
 * Stopped, in one loop: two head-butts against the screen (it leans in towards us, the head flattens a moment on
 * the glass, a faint ring shows where it touched), then it rubs itself to and fro as against your legs.
 */
const BONK = { dur: 4.2, times: "0;.1;.15;.26;.36;.41;.52;1" };
const bonk = () =>
  `<animateTransform attributeName="transform" type="scale" dur="${BONK.dur}s" repeatCount="indefinite" calcMode="spline" values="1 1;1.14 1.14;1.19 1.07;1 1;1.14 1.14;1.19 1.07;1 1;1 1" keyTimes="${BONK.times}" keySplines="${splines(7)}"/>`;
const ring = (at: number) =>
  `<circle cx="230" cy="300" r="40" fill="none" stroke="${INK}" stroke-width="10" opacity="0">`
  + `<animate attributeName="r" dur="${BONK.dur}s" repeatCount="indefinite" values="40;40;190;190" keyTimes="0;${at};${at + 0.12};1"/>`
  + `<animate attributeName="opacity" dur="${BONK.dur}s" repeatCount="indefinite" values="0;0;.28;0;0" keyTimes="0;${at - 0.001};${at};${at + 0.12};1"/></circle>`;

/**
 * The walking cat as a complete <svg> string. `walking` false: it head-butts the screen and rubs itself as against
 * your legs. `step` is one full stride in seconds (match it to the speed it crosses the screen, so the paws do not
 * slide).
 */
export function walkingCatSvg({ walking = true, step = 0.8, width, height }: {
  walking?: boolean; step?: number; width?: number; height?: number;
} = {}): string {
  const size = `${width ? ` width="${width}"` : ""}${height ? ` height="${height}"` : ""}`;
  const half = step / 2;
  const svg = (inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${WALKING_CAT_VIEWBOX}"${size} aria-hidden="true" focusable="false">${inner}</svg>`;
  const cat = `<path d="${CAT}" fill="${INK}"/><path d="${EAR}" fill="${BG}"/>`
    + `<g transform="${FACE}"><path d="${LOGO_EYE}" fill="${BG}"/><path d="${LOGO_EYE_LID}" fill="${INK}"/><path d="${LOGO_WINK}" fill="${BG}"/><path d="${LOGO_MOUTH}" fill="${BG}"/></g>`;
  if (walking) {
    // A soft bob with every step and a sway of the hips.
    const body = move("translate", ["0 0", "0 -10", "0 0"], half) + move("rotate", ["-1.2 700 800", "1.2 700 800", "-1.2 700 800"], step);
    return svg(`<g transform="${FAR}">${leg(FRONT, true, step, half)}${leg(BACK, true, step, 0)}</g>`
      + `<g>${body}<path d="${TAIL[0]}" fill="none" stroke="${INK}" stroke-width="36" stroke-linecap="round">${loop(TAIL, step * 2)}</path>`
      + cat + leg(FRONT, true, step, 0) + leg(BACK, true, step, half) + `</g>`);
  }
  // Rubbing after the head-butts: to and fro above planted paws, leaning into it.
  const rub = move("translate", ["0 0", "0 0", "-34 8", "-34 8", "0 0", "22 4", "0 0"], BONK.dur).replace(/keyTimes="[^"]*"/, 'keyTimes="0;.55;.66;.72;.82;.92;1"')
    + move("rotate", ["0 700 800", "0 700 800", "-3.5 700 800", "-3 700 800", "0 700 800", "2 700 800", "0 700 800"], BONK.dur).replace(/keyTimes="[^"]*"/, 'keyTimes="0;.55;.66;.72;.82;.92;1"');
  const [bx, by] = BROW.split(" ");
  return svg(`<g transform="translate(${bx} ${by})"><g>${bonk()}<g transform="translate(-${bx} -${by})">`
    + `<g transform="${FAR}">${leg(FRONT, false, step, 0)}${leg(BACK, false, step, 0)}</g>${leg(FRONT, false, step, 0)}${leg(BACK, false, step, 0)}`
    + `<g>${rub}<path d="${TAIL[0]}" fill="none" stroke="${INK}" stroke-width="36" stroke-linecap="round">${loop(TAIL_UP, 0.9)}</path>${cat}</g>`
    + `</g></g></g>` + ring(0.15) + ring(0.41));
}
