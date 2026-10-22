import { LOGO_EYE, LOGO_EYE_LID, LOGO_LEG, LOGO_LETTERS, LOGO_MOUTH, LOGO_O, LOGO_PAWS, LOGO_SILHOUETTE, LOGO_VIEWBOX, LOGO_WINK } from "./logoPaths";

/*
 * The logo as a puppet. The solid silhouette is cut (with clip paths) into trunk, head, ears, tail and tail tip,
 * each turning on its own joint; neighbouring pieces overlap a little so no seam opens when they move.
 * The light details (eyes, mouth, paws, leg) are drawn on top in the background colour, so they can move too.
 * Depth comes from parallax: when the cat turns, the face slides more than the head and the tail slides the
 * other way. The ball of yarn ends up as the "O" of "Gatos".
 *
 * Everything is plain SVG + CSS, so the same markup works inline (AnimatedLogo) and as a standalone .svg file.
 * Coordinates are in the logo's own units (viewBox 0 0 1185 1234).
 */

const FULL = "M0 0H1185V1234H0Z";
const TAIL = "M470 270H1185V1140H600V1050L790 1035L800 960L700 490H470Z";
/** What the trunk leaves out: the tail minus a strip at its base, so the two overlap and no hairline shows. */
const TAIL_GAP = "M480 270H1185V1140H625V1060L790 1045L800 960L700 490H480Z";
const TAIL_TIP = "M470 270H800V490H470Z";
const TAIL_TIP_CORE = "M470 270H770V490H470Z";
const HEAD = "M0 0H520V350H0Z";
const HEAD_TOP = "M0 0H520V315H0Z";
const EAR_L = "M150 0H256V100H150Z";
const EAR_L_CORE = "M150 0H256V70H150Z";
const EAR_R = "M415 80H520V185H430Z";
const EAR_R_CORE = "M428 80H520V150H445Z";
/** A front paw that reaches out from behind the chest to bat the ball. At rest it is tucked inside the body. */
const ARM = "M335 468C400 452 470 455 515 468C558 480 568 527 532 540C482 555 405 550 335 542Z";
const TOES = "M534 482c10 8 12 20 5 32M512 476c10 9 12 24 4 38";
const YARN = "M-41-32Q0-62 41-37M-54 3Q0-32 54-3M-41 39Q0 8 41 31";

const STYLE = `
.gnc{overflow:visible}
.gnc g{transform-box:view-box;transform-origin:0 0}
.gnc-ink{fill:var(--gn-alogo-ink,#221e20)}
.gnc-bg{fill:var(--gn-alogo-bg,#fff)}
.gnc-cut{fill:none;stroke:var(--gn-alogo-bg,#fff);stroke-width:7;stroke-linecap:round}
.gnc .gnc-cat{transform-origin:300px 1150px}
.gnc .gnc-body{transform-origin:250px 1180px}
.gnc .gnc-head{transform-origin:230px 332px}
.gnc .gnc-face{transform-origin:300px 240px}
.gnc .gnc-eye{transform-origin:246px 194px}
.gnc .gnc-ear-l{transform-origin:220px 85px}
.gnc .gnc-ear-r{transform-origin:450px 150px}
.gnc .gnc-paws{transform-origin:230px 480px}
.gnc .gnc-arm{transform-origin:340px 505px;transform:scaleX(.2)}
.gnc .gnc-tail{transform-origin:610px 1095px}
.gnc .gnc-tip{transform-origin:785px 312px}
.gnc .gnc-ball{transform:translate(739px,586px);opacity:0}

/* Intro: the cat steps forward turning towards us, spots the ball, bats it into place and winks. */
.gnc--intro .gnc-letters{animation:gnc-letters 3.4s ease-out both}
.gnc--intro .gnc-o{animation:gnc-o-in 3.4s linear both}
.gnc--intro .gnc-cat{animation:gnc-cat-in 3.4s cubic-bezier(.3,.7,.4,1) both}
.gnc--intro .gnc-body{animation:gnc-breathe 1.7s ease-in-out 2 both}
.gnc--intro .gnc-head{animation:gnc-head-in 3.4s ease-in-out both}
.gnc--intro .gnc-face{animation:gnc-face-in 3.4s ease-in-out both}
.gnc--intro .gnc-eye{animation:gnc-blink-in 3.4s linear both}
.gnc--intro .gnc-ear-l{animation:gnc-ear-l-in 3.4s ease-in-out both}
.gnc--intro .gnc-ear-r{animation:gnc-ear-r-in 3.4s ease-in-out both}
.gnc--intro .gnc-paws{animation:gnc-paws-in 3.4s ease-in-out both}
.gnc--intro .gnc-arm{animation:gnc-arm-in 3.4s ease-in-out both}
.gnc--intro .gnc-tail{animation:gnc-tail-in 3.4s ease-in-out both}
.gnc--intro .gnc-tip{animation:gnc-tip-in 3.4s ease-in-out both}
.gnc--intro .gnc-ball{animation:gnc-ball-in 3.4s linear both}
.gnc--intro .gnc-yarn{animation:gnc-yarn-in 3.4s ease-in-out both}
/* Inline, the intro waits until the logo is on screen. */
.gnc[data-armed]:not([data-play]) *{animation-play-state:paused!important}

@keyframes gnc-letters{from{opacity:0}15%{opacity:1}}
@keyframes gnc-o-in{0%,73%{opacity:0}78%,100%{opacity:1}}
@keyframes gnc-cat-in{
  0%{transform:translate(110px,110px) scale(.55,.8);opacity:0}
  10%{opacity:1}
  27%{transform:translate(-8px,-14px) scale(1.04,1.01)}
  35%{transform:none}
  48%{transform:scale(.95,1)}
  62%{transform:scale(.97,1.01)}
  76%,100%{transform:none}}
@keyframes gnc-breathe{0%,100%{transform:none}50%{transform:scale(1.012,1.018)}}
@keyframes gnc-head-in{
  0%{transform:rotate(-7deg)}
  27%{transform:rotate(3deg)}
  35%{transform:rotate(0)}
  44%{transform:rotate(6deg)}
  50%{transform:rotate(6deg)}
  58%{transform:rotate(-4deg)}
  68%{transform:rotate(3deg)}
  82%,100%{transform:none}}
@keyframes gnc-face-in{
  0%{transform:translate(-60px,0) scale(.7,1)}
  30%{transform:translate(6px,0)}
  44%,50%{transform:translate(44px,14px) scale(.82,1)}
  58%{transform:translate(34px,-18px) scale(.85,1)}
  68%{transform:translate(48px,6px) scale(.82,1)}
  82%,100%{transform:none}}
@keyframes gnc-blink-in{0%,85%,91%,100%{transform:none}88%{transform:scale(1,.1)}}
@keyframes gnc-ear-l-in{0%,37%,45%,100%{transform:none}40%{transform:rotate(-16deg)}42%{transform:rotate(-6deg)}}
@keyframes gnc-ear-r-in{0%,69%,77%,100%{transform:none}72%{transform:rotate(14deg)}74%{transform:rotate(5deg)}}
@keyframes gnc-paws-in{0%,34%,54%,100%{transform:none}43%{transform:translate(6px,-8px) rotate(-4deg)}}
@keyframes gnc-arm-in{
  0%,40%{transform:scaleX(.2)}
  46%{transform:scaleX(1) rotate(-16deg)}
  50%{transform:scaleX(1.04) rotate(7deg)}
  53%{transform:scaleX(1) rotate(4deg)}
  60%,100%{transform:scaleX(.2)}}
@keyframes gnc-tail-in{
  0%{transform:translate(30px,0) rotate(-7deg)}
  27%{transform:rotate(3deg)}
  48%{transform:translate(-8px,0) rotate(-2.5deg)}
  70%{transform:rotate(2deg)}
  100%{transform:none}}
@keyframes gnc-tip-in{0%{transform:rotate(12deg)}22%{transform:rotate(-9deg)}42%{transform:rotate(7deg)}62%{transform:rotate(-11deg)}80%{transform:rotate(5deg)}100%{transform:none}}
@keyframes gnc-ball-in{
  0%,29%{transform:translate(790px,800px);opacity:0}
  32%{opacity:1;animation-timing-function:ease-out}
  37%{transform:translate(690px,600px);animation-timing-function:ease-in}
  44%{transform:translate(585px,535px);animation-timing-function:ease-out}
  47%{transform:translate(570px,505px)}
  50%{transform:translate(566px,505px);animation-timing-function:ease-out}
  61%{transform:translate(655px,320px);animation-timing-function:ease-in}
  71%{transform:translate(739px,586px);opacity:1}
  79%,100%{transform:translate(739px,586px);opacity:0}}
@keyframes gnc-yarn-in{
  0%,29%{transform:none}
  44%{transform:rotate(-500deg)}
  50%{transform:rotate(-500deg) scale(1)}
  70%{transform:rotate(-140deg) scale(1)}
  73%{transform:rotate(-140deg) scale(1.3,.7)}
  78%,100%{transform:rotate(-140deg) scale(.4,1)}}

/* Loader: the ball bounces between the "O" and the cat's paw, and the cat follows it with its head. */
.gnc--loader .gnc-o{animation:gnc-o-loop 2.4s linear infinite}
.gnc--loader .gnc-body{animation:gnc-breathe 2.4s ease-in-out infinite}
.gnc--loader .gnc-cat{animation:gnc-cat-loop 2.4s ease-in-out infinite}
.gnc--loader .gnc-head{animation:gnc-head-loop 2.4s ease-in-out infinite}
.gnc--loader .gnc-face{animation:gnc-face-loop 2.4s ease-in-out infinite}
.gnc--loader .gnc-eye{animation:gnc-blink-loop 4.8s linear infinite}
.gnc--loader .gnc-ear-r{animation:gnc-ear-r-loop 2.4s ease-in-out infinite}
.gnc--loader .gnc-arm{animation:gnc-arm-loop 2.4s ease-in-out infinite}
.gnc--loader .gnc-paws{animation:gnc-paws-loop 2.4s ease-in-out infinite}
.gnc--loader .gnc-tail{animation:gnc-tail-loop 2.4s ease-in-out infinite}
.gnc--loader .gnc-tip{animation:gnc-tip-loop 1.2s ease-in-out infinite}
.gnc--loader .gnc-ball{animation:gnc-ball-loop 2.4s linear infinite}
.gnc--loader .gnc-yarn{animation:gnc-yarn-loop 2.4s ease-in-out infinite}

@keyframes gnc-o-loop{0%,5%{opacity:1}9%,86%{opacity:0}92%,100%{opacity:1}}
@keyframes gnc-cat-loop{0%,100%{transform:scale(.98,1)}40%{transform:scale(.95,1)}60%{transform:none}}
@keyframes gnc-head-loop{0%,100%{transform:rotate(3deg)}22%{transform:rotate(-4deg)}40%{transform:rotate(5deg)}62%{transform:rotate(-3deg)}82%{transform:rotate(3deg)}}
@keyframes gnc-face-loop{0%,100%{transform:translate(46px,6px) scale(.82,1)}22%{transform:translate(30px,-18px) scale(.86,1)}40%{transform:translate(40px,14px) scale(.82,1)}62%{transform:translate(30px,-18px) scale(.86,1)}82%{transform:translate(48px,4px) scale(.82,1)}}
@keyframes gnc-blink-loop{0%,60%,64%,100%{transform:none}62%{transform:scale(1,.1)}}
@keyframes gnc-ear-r-loop{0%,20%,30%,100%{transform:none}24%{transform:rotate(14deg)}}
@keyframes gnc-arm-loop{0%,30%{transform:scaleX(.2)}37%{transform:scaleX(1) rotate(-16deg)}42%{transform:scaleX(1.04) rotate(7deg)}45%{transform:scaleX(1) rotate(4deg)}54%,100%{transform:scaleX(.2)}}
@keyframes gnc-paws-loop{0%,26%,48%,100%{transform:none}36%{transform:translate(6px,-8px) rotate(-4deg)}}
@keyframes gnc-tail-loop{0%,100%{transform:rotate(-2.5deg)}50%{transform:rotate(2.5deg)}}
@keyframes gnc-tip-loop{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(7deg)}}
@keyframes gnc-ball-loop{
  0%,5%{transform:translate(739px,586px);opacity:0}
  9%{opacity:1;animation-timing-function:ease-out}
  22%{transform:translate(655px,320px);animation-timing-function:ease-in}
  42%{transform:translate(566px,505px);animation-timing-function:ease-out}
  62%{transform:translate(655px,320px);animation-timing-function:ease-in}
  82%{transform:translate(739px,586px);opacity:1}
  92%,100%{transform:translate(739px,586px);opacity:0}}
@keyframes gnc-yarn-loop{
  0%,5%{transform:scale(.4,1)}
  10%{transform:scale(1)}
  42%{transform:rotate(-300deg)}
  81%{transform:rotate(0) scale(1)}
  85%{transform:scale(1.3,.7)}
  90%,100%{transform:scale(.4,1)}}

@media (prefers-reduced-motion:reduce){
  .gnc g{animation:none!important}
  .gnc--loader .gnc-o{animation:gnc-pulse 1.6s ease-in-out infinite!important}
}
@keyframes gnc-pulse{50%{opacity:.35}}
`;

export type LogoVariant = "intro" | "loader";

/** The animated logo as a complete <svg> string. `id` keeps clip-path ids unique when several logos share a page. */
export function animatedLogoSvg({ variant, id = "gnc", label, armed = false, width, height }: {
  variant: LogoVariant; id?: string; label?: string; armed?: boolean; width?: number; height?: number;
}): string {
  const clip = (name: string, d: string, evenodd = false) =>
    `<clipPath id="${id}-${name}"><path d="${d}"${evenodd ? ' clip-rule="evenodd"' : ""}/></clipPath>`;
  const piece = (name: string) => `<g clip-path="url(#${id}-${name})"><use href="#${id}-cat" class="gnc-ink"/></g>`;
  const a11y = label ? `role="img" aria-label="${label.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")}"` : 'aria-hidden="true"';
  const size = `${width ? ` width="${width}"` : ""}${height ? ` height="${height}"` : ""}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOGO_VIEWBOX}"${size} class="gnc gnc--${variant}" ${a11y}${armed ? " data-armed" : ""} focusable="false">`
    + `<style>${STYLE}</style>`
    + `<defs><path id="${id}-cat" d="${LOGO_SILHOUETTE}"/>`
    + clip("trunk", FULL + TAIL_GAP + HEAD_TOP, true)
    + clip("tail", TAIL + TAIL_TIP_CORE, true)
    + clip("tip", TAIL_TIP)
    + clip("head", HEAD + EAR_L_CORE + EAR_R_CORE, true)
    + clip("ear-l", EAR_L)
    + clip("ear-r", EAR_R)
    + `</defs>`
    + `<g class="gnc-letters"><path class="gnc-ink" d="${LOGO_LETTERS}"/></g>`
    + `<g class="gnc-o"><path class="gnc-ink" d="${LOGO_O}"/></g>`
    + `<g class="gnc-cat"><g class="gnc-body">`
    + `<g class="gnc-tail"><g clip-path="url(#${id}-tail)"><use href="#${id}-cat" class="gnc-ink"/></g><g class="gnc-tip">${piece("tip")}</g></g>`
    + piece("trunk")
    + `<path class="gnc-bg" d="${LOGO_LEG}"/>`
    + `<g class="gnc-paws"><path class="gnc-bg" d="${LOGO_PAWS}"/></g>`
    + `<g class="gnc-arm"><path class="gnc-ink" d="${ARM}"/><path class="gnc-cut" d="${TOES}"/></g>`
    + `<g class="gnc-head">${piece("head")}<g class="gnc-ear-l">${piece("ear-l")}</g><g class="gnc-ear-r">${piece("ear-r")}</g>`
    + `<g class="gnc-face"><g class="gnc-eye"><path class="gnc-bg" d="${LOGO_EYE}"/><path class="gnc-ink" d="${LOGO_EYE_LID}"/></g>`
    + `<path class="gnc-bg" d="${LOGO_WINK}"/><path class="gnc-bg" d="${LOGO_MOUTH}"/></g></g>`
    + `</g></g>`
    + `<g class="gnc-ball"><g class="gnc-yarn"><circle class="gnc-ink" r="58"/><path class="gnc-cut" d="${YARN}"/></g></g>`
    + `</svg>`;
}
