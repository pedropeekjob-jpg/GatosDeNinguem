import { LOGO_EYE, LOGO_EYE_LID, LOGO_MOUTH, LOGO_WINK } from "./logoPaths";

/*
 * The logo's cat walking, seen from the side and facing left: the logo's own head (winking, looking at us) on a
 * body drawn in the same style (solid ink, soft curves, one light line for the back leg). The legs, the tail and
 * the bob of the body are SVG path animations (SMIL), so the legs bend at the knee and the tail waves instead of
 * swinging stiffly; they run in every browser, inline or as a file. Coordinates: viewBox 0 0 1300 820, drawn
 * facing right and mirrored, except the head, which keeps the logo's wink on the same side as the logo.
 */

export const WALKING_CAT_VIEWBOX = "0 0 1300 820";

const INK = "var(--gn-walk-ink, #221e20)";
const BG = "var(--gn-walk-bg, #fff)";
/** The head in the logo's own coordinates: its ears (the left one tall, with a light inside) around the logo's face. */
const HEAD = "M150 255C140 180 165 135 195 120L245 15L290 105C340 100 390 112 425 138L485 92L465 190C482 245 465 310 405 342C345 372 232 374 186 340C162 320 152 290 150 255Z";
const EAR = "M222 105L244 50L262 103Z";
const BODY = "M905 290C850 330 780 345 700 340C560 330 420 300 320 315C220 330 175 410 195 500C210 570 260 610 330 615C420 620 470 560 560 548C650 538 720 580 820 590C900 598 960 560 985 480C1005 410 990 330 950 290Z";
/** The light line of the back leg, as in the logo. */
const LEG_LINE = "M300 400C380 380 430 450 410 560";

/** One step, in four poses: reaching forward, under the body, pushing back, lifted while it swings forward. */
const FRONT = ["M880 570Q930 690 960 795", "M880 570Q895 690 880 800", "M880 570Q860 690 800 790", "M880 570Q940 660 905 745"];
const BACK = ["M330 560Q290 690 410 795", "M330 560Q280 690 335 800", "M330 560Q290 680 250 790", "M330 560Q270 660 320 745"];
const TAIL = [
  "M220 390C120 380 60 300 80 200C100 110 190 70 250 110",
  "M220 390C140 360 110 260 150 180C185 110 270 100 300 150",
  "M220 390C110 400 30 320 40 220C50 130 120 80 190 90",
];
const SPLINE = ".45 0 .55 1";
const FAR = "translate(-50 -12)";

const loop = (values: string[], dur: number, begin = 0) =>
  `<animate attributeName="d" dur="${dur}s" begin="${-begin}s" repeatCount="indefinite" calcMode="spline" values="${[...values, values[0]].join(";")}" keyTimes="${values.map((_, i) => i / values.length).concat(1).join(";")}" keySplines="${values.map(() => SPLINE).join(";")}"/>`;

const leg = (poses: string[], walking: boolean, step: number, begin: number) =>
  `<path d="${poses[1]}" fill="none" stroke="${INK}" stroke-width="54" stroke-linecap="round">${walking ? loop(poses, step, begin) : ""}</path>`;

/**
 * The walking cat as a complete <svg> string. `walking` false: it stands still, tail waving slowly.
 * `step` is the length of one full stride in seconds (match it to the speed it crosses the screen, so the feet do
 * not slide).
 */
export function walkingCatSvg({ walking = true, step = 0.8, width, height }: {
  walking?: boolean; step?: number; width?: number; height?: number;
} = {}): string {
  const size = `${width ? ` width="${width}"` : ""}${height ? ` height="${height}"` : ""}`;
  const half = step / 2;
  const bob = walking
    ? `<animateTransform attributeName="transform" type="translate" dur="${half}s" repeatCount="indefinite" calcMode="spline" values="0 0;0 -12;0 0" keyTimes="0;.5;1" keySplines="${SPLINE};${SPLINE}"/>`
    : `<animateTransform attributeName="transform" type="scale" dur="3.2s" repeatCount="indefinite" calcMode="spline" values="1 1;1 1.015;1 1" keyTimes="0;.5;1" keySplines="${SPLINE};${SPLINE}" additive="sum"/>`;
  const nod = walking
    ? `<animateTransform attributeName="transform" type="rotate" dur="${step}s" repeatCount="indefinite" calcMode="spline" values="-2 300 330;2.5 300 330;-2 300 330" keyTimes="0;.5;1" keySplines="${SPLINE};${SPLINE}" additive="sum"/>`
    : `<animateTransform attributeName="transform" type="rotate" dur="4s" repeatCount="indefinite" calcMode="spline" values="0 300 330;-6 300 330;-6 300 330;0 300 330" keyTimes="0;.3;.7;1" keySplines="${SPLINE};${SPLINE};${SPLINE}" additive="sum"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${WALKING_CAT_VIEWBOX}"${size} aria-hidden="true" focusable="false">`
    + `<g>${bob}`
    // Body, legs and tail, drawn facing right and mirrored so the cat walks to the left.
    + `<g transform="translate(1300 0) scale(-1 1)">`
    + `<g transform="${FAR}">${leg(FRONT, walking, step, half)}${leg(BACK, walking, step, 0)}</g>`
    + `<path d="${TAIL[0]}" fill="none" stroke="${INK}" stroke-width="34" stroke-linecap="round">${loop(TAIL, walking ? step * 2 : 3.6)}</path>`
    + `<path d="${BODY}" fill="${INK}"/>`
    + leg(FRONT, walking, step, 0) + leg(BACK, walking, step, half)
    + `<path d="${LEG_LINE}" fill="none" stroke="${BG}" stroke-width="9" stroke-linecap="round"/>`
    + `</g>`
    // The logo's head, at the front (now on the left), bobbing a little with each step.
    + `<g transform="translate(-66 -3) scale(1.15)"><g>${nod}`
    + `<path d="${HEAD}" fill="${INK}"/><path d="${EAR}" fill="${BG}"/>`
    + `<path d="${LOGO_EYE}" fill="${BG}"/><path d="${LOGO_EYE_LID}" fill="${INK}"/><path d="${LOGO_WINK}" fill="${BG}"/><path d="${LOGO_MOUTH}" fill="${BG}"/>`
    + `</g></g></g></svg>`;
}
