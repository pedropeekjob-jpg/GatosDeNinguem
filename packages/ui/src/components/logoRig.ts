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
/** The invisible circle around the words, that the cat hides behind. */
/** A rounded chin for the head on its own (peeking and leaping). */
const JAW = "M0 0H520V280C500 340 420 368 300 368C180 368 60 348 0 300Z";
const CIRCLE = { x: 752, y: 597, r: 268 };
/** Two front paws holding on to the edge of that circle while the cat peeks. */
const GRIP = `<g class="gnc-ink"><ellipse cx="1020" cy="530" rx="26" ry="40"/><ellipse cx="1020" cy="662" rx="26" ry="40"/></g>`
  + `<path class="gnc-cut" style="stroke-width:5" d="M1030 518h14M1030 540h14M1030 650h14M1030 672h14"/>`;
/** The right eye wide open, before the wink. */
const OPEN_EYE = `<ellipse class="gnc-bg" cx="396" cy="236" rx="25" ry="21"/><circle class="gnc-ink" cx="400" cy="238" r="11"/>`;
/** The body in mid-leap (logo coordinates, so it lands where the logo's body is): legs stretched, tail up. */
const LEAP_BODY = `<g class="gnc-ink"><ellipse cx="480" cy="300" rx="270" ry="125" transform="rotate(-16 480 300)"/>`
  + `<ellipse cx="300" cy="300" rx="125" ry="112"/></g>`
  + `<g fill="none" stroke="var(--gn-alogo-ink,#221e20)" stroke-linecap="round">`
  + `<path stroke-width="64" d="M250 360L110 470M330 385L205 505"/>`
  + `<path stroke-width="72" d="M650 320L840 395M670 260L880 285"/>`
  + `<path stroke-width="50" d="M720 175C800 110 860 40 965 30"/></g>`;
/** The middle of the tail ring, from its root round to its tip: drawing it in reveals the tail. */
const SWEEP = "M600 1090C780 1110 1000 1070 1105 880C1185 720 1160 480 1010 365C880 270 690 285 600 370C565 405 548 440 560 470";
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
.gnc .gnc-arm{transform-origin:340px 505px;transform:scaleX(.2);opacity:0}
.gnc .gnc-tail{transform-origin:610px 1095px}
.gnc .gnc-tip{transform-origin:785px 312px}
.gnc .gnc-ball{transform:translate(739px,586px);opacity:0}

/* Intro, 4.6s: only "Gat s de Ninguém" at first; a cat peeks out from behind the (invisible) circle around
   the words; a ball comes bouncing in; the cat leaps forward after it, lands in the logo's pose and bats the
   ball, which drops into place as the "O" while the tail sweeps round the words; then the cat winks. */
.gnc .gns-peek,.gnc .gns-grip,.gnc .gns-leap,.gnc .gns-open{opacity:0}
.gnc .gns-look{transform-origin:250px 330px}
.gnc .gns-open{transform-origin:396px 236px}
.gnc .gns-sweep{stroke-dasharray:1;stroke-dashoffset:0}
.gnc--intro .gnc-letters{animation:gns-letters 4.6s ease-out both}
.gnc--intro .gnc-o{animation:gns-o 4.6s linear both}
.gnc--intro .gns-peek{animation:gns-peek 4.6s ease-in-out both}
.gnc--intro .gns-look{animation:gns-look 4.6s ease-in-out both}
.gnc--intro .gns-grip{animation:gns-grip 4.6s ease-out both}
.gnc--intro .gns-leap{animation:gns-leap 4.6s linear both}
.gnc--intro .gnc-cat{animation:gns-land 4.6s ease-out both}
.gnc--intro .gnc-head{animation:gns-head 4.6s ease-in-out both}
.gnc--intro .gnc-face{animation:gns-face 4.6s ease-in-out both}
.gnc--intro .gnc-ear-r{animation:gns-ear 4.6s ease-in-out both}
.gnc--intro .gnc-tip{animation:gns-tip 4.6s ease-in-out both}
.gnc--intro .gns-sweep{animation:gns-sweep 4.6s ease-in-out both}
.gnc--intro .gns-open{animation:gns-wink 4.6s linear both}
.gnc--intro .gnc-arm{animation:gns-arm 4.6s ease-in-out both}
.gnc--intro .gnc-ball{animation:gns-ball 4.6s linear both}
.gnc--intro .gnc-yarn{animation:gns-yarn 4.6s ease-in-out both}
/* Inline, the intro waits until the logo is on screen. */
.gnc[data-armed]:not([data-play]) *{animation-play-state:paused!important}

@keyframes gns-letters{from{opacity:0}9%{opacity:1}}
@keyframes gns-o{0%,77%{opacity:0}81%,100%{opacity:1}}
@keyframes gns-peek{
  0%,12%{transform:translate(690px,415px) scale(.55);opacity:1}
  21%{transform:translate(925px,415px) scale(.55)}
  24%{transform:translate(900px,415px) scale(.55)}
  27%{transform:translate(912px,415px) scale(.55)}
  45%{transform:translate(912px,415px) scale(.55)}
  49.9%{transform:translate(890px,430px) scale(.55);opacity:1}
  50%,100%{transform:translate(890px,430px) scale(.55);opacity:0}}
@keyframes gns-look{
  0%,24%{transform:rotate(-8deg)}
  31%{transform:rotate(8deg) translate(0,10px)}
  37%{transform:rotate(-14deg)}
  43%{transform:rotate(-26deg)}
  48%{transform:rotate(-30deg) translate(0,10px)}
  100%{transform:rotate(-30deg) translate(0,10px)}}
@keyframes gns-grip{
  0%,15%{transform:translate(-70px,0);opacity:1}
  20%{transform:none}
  48%{transform:none;opacity:1}
  49.9%{transform:translate(-30px,0);opacity:1}
  50%,100%{opacity:0}}
@keyframes gns-leap{
  0%,49.9%{opacity:0;transform:translate(890px,430px) scale(.55)}
  50%{opacity:1;transform:translate(890px,400px) scale(.55) rotate(6deg);animation-timing-function:ease-out}
  56.5%{transform:translate(430px,40px) scale(.82) rotate(-8deg);animation-timing-function:ease-in}
  62.9%{opacity:1;transform:translate(-10px,30px) scale(1.02,.98)}
  63%,100%{opacity:0;transform:none}}
@keyframes gns-land{
  0%,62.9%{opacity:0;transform:scale(1.07,.9)}
  63%{opacity:1;transform:scale(1.07,.9)}
  66%{transform:scale(.97,1.04)}
  69%,100%{transform:none}}
@keyframes gns-head{
  0%,64%{transform:rotate(-4deg)}
  67%{transform:rotate(3deg)}
  71%{transform:rotate(-4deg)}
  76%{transform:rotate(3deg)}
  82%,100%{transform:none}}
@keyframes gns-face{
  0%,64%{transform:translate(-20px,6px) scale(.9,1)}
  67%{transform:translate(40px,10px) scale(.84,1)}
  71%{transform:translate(30px,-16px) scale(.86,1)}
  76%{transform:translate(44px,8px) scale(.84,1)}
  84%,100%{transform:none}}
@keyframes gns-ear{0%,79%,85%,100%{transform:none}81.5%{transform:rotate(14deg)}83%{transform:rotate(5deg)}}
@keyframes gns-tip{0%,63%{transform:rotate(-30deg)}74%{transform:rotate(9deg)}82%{transform:rotate(-5deg)}90%,100%{transform:none}}
@keyframes gns-sweep{0%,63%{stroke-dashoffset:1}79%,100%{stroke-dashoffset:0}}
@keyframes gns-wink{0%,62.9%{opacity:0}63%,86%{opacity:1;transform:none}89%{opacity:1;transform:scale(1,.08)}89.1%,100%{opacity:0;transform:scale(1,.08)}}
@keyframes gns-arm{
  0%,63%{transform:scaleX(.2);opacity:0}
  63.5%{transform:scaleX(.2);opacity:1}
  65%{transform:scaleX(1) rotate(-16deg)}
  66.5%{transform:scaleX(1.04) rotate(7deg)}
  68%{transform:scaleX(1) rotate(4deg)}
  71%{transform:scaleX(.2);opacity:1}
  71.5%,100%{transform:scaleX(.2);opacity:0}}
@keyframes gns-ball{
  0%,28%{transform:translate(1260px,880px);opacity:0}
  28.3%{transform:translate(1250px,880px);opacity:1;animation-timing-function:ease-in}
  33.7%{transform:translate(1085px,1060px);animation-timing-function:ease-out}
  42.4%{transform:translate(800px,170px);animation-timing-function:ease-in}
  50%{transform:translate(470px,600px);animation-timing-function:ease-out}
  55.4%{transform:translate(515px,470px);animation-timing-function:ease-in}
  59.8%{transform:translate(566px,505px)}
  65.5%{transform:translate(566px,505px);animation-timing-function:ease-out}
  70.6%{transform:translate(655px,320px);animation-timing-function:ease-in}
  75%{transform:translate(739px,586px);opacity:1}
  80%,100%{transform:translate(739px,586px);opacity:0}}
@keyframes gns-yarn{
  0%,28%{transform:none}
  33.5%{transform:rotate(-200deg) scale(1)}
  34.5%{transform:rotate(-210deg) scale(1.2,.8)}
  36%{transform:rotate(-230deg) scale(1)}
  49.5%{transform:rotate(-520deg) scale(1)}
  50.5%{transform:rotate(-530deg) scale(1.2,.8)}
  52%{transform:rotate(-550deg) scale(1)}
  59.8%{transform:rotate(-760deg)}
  65.5%{transform:rotate(-760deg) scale(1)}
  74.5%{transform:rotate(-400deg) scale(1)}
  76.5%{transform:rotate(-400deg) scale(1.3,.7)}
  80%,100%{transform:rotate(-400deg) scale(.4,1)}}
@keyframes gnc-breathe{0%,100%{transform:none}50%{transform:scale(1.012,1.018)}}

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
@keyframes gnc-arm-loop{0%,30%{transform:scaleX(.2);opacity:0}31%,53%{opacity:1}37%{transform:scaleX(1) rotate(-16deg)}42%{transform:scaleX(1.04) rotate(7deg)}45%{transform:scaleX(1) rotate(4deg)}54%,100%{transform:scaleX(.2);opacity:0}}
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
  const intro = variant === "intro";
  const clip = (name: string, d: string, evenodd = false) =>
    `<clipPath id="${id}-${name}"><path d="${d}"${evenodd ? ' clip-rule="evenodd"' : ""}/></clipPath>`;
  const piece = (name: string) => `<g clip-path="url(#${id}-${name})"><use href="#${id}-cat" class="gnc-ink"/></g>`;
  const a11y = label ? `role="img" aria-label="${label.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")}"` : 'aria-hidden="true"';
  const size = `${width ? ` width="${width}"` : ""}${height ? ` height="${height}"` : ""}`;
  const leftEye = `<g class="gnc-eye"><path class="gnc-bg" d="${LOGO_EYE}"/><path class="gnc-ink" d="${LOGO_EYE_LID}"/></g>`;
  const mouth = `<path class="gnc-bg" d="${LOGO_MOUTH}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOGO_VIEWBOX}"${size} class="gnc gnc--${variant}" ${a11y}${armed ? " data-armed" : ""} focusable="false">`
    + `<style>${STYLE}</style>`
    + `<defs><path id="${id}-cat" d="${LOGO_SILHOUETTE}"/>`
    + clip("trunk", FULL + TAIL_GAP + HEAD_TOP, true)
    + clip("tail", TAIL + TAIL_TIP_CORE, true)
    + clip("tip", TAIL_TIP)
    + clip("head", HEAD + EAR_L_CORE + EAR_R_CORE, true)
    + clip("ear-l", EAR_L)
    + clip("ear-r", EAR_R)
    + (intro ? clip("jaw", JAW) : "")
    + (intro
      // The young cat of the story: the logo's head (both eyes open) on a body drawn for the leap.
      ? `<g id="${id}-head-open"><g clip-path="url(#${id}-jaw)">${piece("head")}</g>${piece("ear-l")}${piece("ear-r")}${leftEye}${OPEN_EYE}${mouth}</g>`
        + `<mask id="${id}-behind" maskUnits="userSpaceOnUse" x="0" y="0" width="1185" height="1234"><rect width="1185" height="1234" fill="#fff"/><circle cx="${CIRCLE.x}" cy="${CIRCLE.y}" r="${CIRCLE.r}"/></mask>`
        + `<mask id="${id}-sweep" maskUnits="userSpaceOnUse" x="0" y="0" width="1185" height="1234"><path class="gns-sweep" d="${SWEEP}" pathLength="1" fill="none" stroke="#fff" stroke-width="170" stroke-linecap="round"/><rect width="1185" height="1234" fill="#fff" clip-path="url(#${id}-trunk)"/></mask>`
      : "")
    + `</defs>`
    + `<g class="gnc-letters"><path class="gnc-ink" d="${LOGO_LETTERS}"/></g>`
    + `<g class="gnc-o"><path class="gnc-ink" d="${LOGO_O}"/></g>`
    + (intro
      ? `<g mask="url(#${id}-behind)"><g class="gns-peek"><g class="gns-look"><use href="#${id}-head-open"/></g></g>`
        + `<g class="gns-grip">${GRIP}</g></g>`
        + `<g class="gns-leap">${LEAP_BODY}<use href="#${id}-head-open"/></g>`
      : "")
    + `<g class="gnc-cat"><g class="gnc-body">`
    + `<g class="gnc-tail"${intro ? ` mask="url(#${id}-sweep)"` : ""}><g clip-path="url(#${id}-tail)"><use href="#${id}-cat" class="gnc-ink"/></g><g class="gnc-tip">${piece("tip")}</g></g>`
    + piece("trunk")
    + `<path class="gnc-bg" d="${LOGO_LEG}"/>`
    + `<g class="gnc-paws"><path class="gnc-bg" d="${LOGO_PAWS}"/></g>`
    + `<g class="gnc-arm"><path class="gnc-ink" d="${ARM}"/><path class="gnc-cut" d="${TOES}"/></g>`
    + `<g class="gnc-head">${piece("head")}<g class="gnc-ear-l">${piece("ear-l")}</g><g class="gnc-ear-r">${piece("ear-r")}</g>`
    + `<g class="gnc-face">${leftEye}<path class="gnc-bg" d="${LOGO_WINK}"/>${intro ? `<g class="gns-open">${OPEN_EYE}</g>` : ""}${mouth}</g></g>`
    + `</g></g>`
    + `<g class="gnc-ball"><g class="gnc-yarn"><circle class="gnc-ink" r="58"/><path class="gnc-cut" d="${YARN}"/></g></g>`
    + `</svg>`;
}
