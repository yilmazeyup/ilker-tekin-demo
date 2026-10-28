import { CHROMA, CHROMA_ORDER } from '@ilker/shared';

import { rtl } from '../i18n';

/**
 * The web layer of the look: liquid glass, dye gradients, grain and the slow colour ribbons behind every screen.
 * Elements opt in with `fx('…')` (a data attribute), so React Native's own styles stay untouched.
 */

const FONTS =
  'https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Inter+Tight:ital,wght@0,300..800;1,400..700&family=DM+Mono:wght@400;500&display=swap';

const NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

const inks = CHROMA_ORDER.map((id) => {
  const [a, b, c] = CHROMA[id].stops;
  return `[data-fx~="ink-${id}"]{background-image:linear-gradient(100deg,${b} 0%,${c} 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
[data-fx~="dye-${id}"]{background-image:linear-gradient(135deg,${a} 0%,${b} 100%)}`;
}).join('\n');

const CSS = `
html,body,#root{background:#FFFFFF;}
body{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;overscroll-behavior:none;}
::selection{background:#2741D6;color:#FFFFFF;}
*{scrollbar-width:none;-webkit-tap-highlight-color:transparent;}
*::-webkit-scrollbar{width:0;height:0;display:none;}
:focus-visible{outline:2px solid #2741D6;outline-offset:3px;border-radius:12px;}

[data-fx~="glass"]{-webkit-backdrop-filter:blur(20px) saturate(160%);backdrop-filter:blur(20px) saturate(160%);
  background-image:linear-gradient(160deg,rgba(255,255,255,0.92) 0%,rgba(250,251,255,0.8) 100%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.9),0 1px 2px rgba(16,28,72,0.04),0 14px 34px -18px rgba(30,50,130,0.22);}
[data-fx~="glass-strong"]{-webkit-backdrop-filter:blur(26px) saturate(170%);backdrop-filter:blur(26px) saturate(170%);
  background-image:linear-gradient(180deg,rgba(255,255,255,0.86) 0%,rgba(248,250,255,0.9) 100%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.95),0 18px 44px -14px rgba(30,50,130,0.28);}
[data-fx~="glass-light"]{-webkit-backdrop-filter:blur(18px) saturate(160%);backdrop-filter:blur(18px) saturate(160%);
  background-image:linear-gradient(160deg,rgba(255,255,255,0.95),rgba(255,255,255,0.8));}
[data-fx~="glass-edge"]{-webkit-backdrop-filter:blur(14px) saturate(150%);backdrop-filter:blur(14px) saturate(150%);
  background-image:linear-gradient(180deg,rgba(255,255,255,0.9) 0%,rgba(255,255,255,0.6) 60%,rgba(255,255,255,0) 100%);
  -webkit-mask-image:linear-gradient(180deg,#000 55%,transparent);mask-image:linear-gradient(180deg,#000 55%,transparent);}
[data-fx~="grain"]{position:relative;}
[data-fx~="grain"]::after{content:"";position:absolute;inset:0;background-image:${NOISE};opacity:.05;mix-blend-mode:soft-light;pointer-events:none;border-radius:inherit;}

[data-fx~="aurora"]{overflow:hidden;background-color:#FBFCFF;}
[data-fx~="aurora"]::before,[data-fx~="aurora"]::after,[data-fx~="flow"]::before,[data-fx~="flow"]::after{content:"";position:absolute;pointer-events:none;will-change:transform;}
[data-fx~="aurora"]::before{left:-35%;top:-30%;width:130%;height:95%;opacity:.95;
  background:radial-gradient(closest-side,rgba(196,210,255,0.85),rgba(196,210,255,0) 72%) 0% 0%/62% 70% no-repeat,
             radial-gradient(closest-side,rgba(232,214,255,0.8),rgba(232,214,255,0) 72%) 100% 18%/58% 62% no-repeat;
  animation:meshA 26s ease-in-out infinite alternate;}
[data-fx~="aurora"]::after{left:-20%;bottom:-18%;width:140%;height:84%;opacity:.85;
  background:radial-gradient(closest-side,rgba(255,224,206,0.75),rgba(255,224,206,0) 72%) 0% 92%/58% 62% no-repeat,
             radial-gradient(closest-side,rgba(206,240,228,0.7),rgba(206,240,228,0) 72%) 100% 58%/54% 58% no-repeat;
  animation:meshB 32s ease-in-out infinite alternate;}
[data-fx~="flow"]{position:absolute;inset:0;overflow:hidden;pointer-events:none;}
[data-fx~="flow"]::before{left:-60%;top:18%;width:220%;height:46%;opacity:.5;
  background:linear-gradient(100deg,transparent 18%,rgba(186,204,255,0.55) 38%,rgba(255,214,232,0.45) 54%,rgba(214,206,255,0.5) 68%,transparent 86%);
  filter:blur(28px);transform:rotate(-9deg);animation:ribbon 22s ease-in-out infinite alternate;}
[data-fx~="flow"]::after{left:-30%;top:-10%;width:90%;height:70%;opacity:.55;
  background:radial-gradient(closest-side,rgba(255,255,255,0.95),rgba(255,255,255,0) 70%);
  animation:glow 18s ease-in-out infinite alternate;}
@keyframes meshA{0%{transform:translate3d(0,0,0) rotate(0deg) scale(1)}50%{transform:translate3d(8%,6%,0) rotate(8deg) scale(1.08)}100%{transform:translate3d(14%,-4%,0) rotate(-6deg) scale(1.02)}}
@keyframes meshB{0%{transform:translate3d(0,0,0) rotate(0deg)}50%{transform:translate3d(-10%,-6%,0) rotate(-7deg) scale(1.1)}100%{transform:translate3d(6%,-10%,0) rotate(5deg)}}
@keyframes ribbon{0%{transform:translate3d(-8%,0,0) rotate(-9deg)}100%{transform:translate3d(10%,12%,0) rotate(-2deg)}}
@keyframes glow{0%{transform:translate3d(0,0,0)}100%{transform:translate3d(70%,55%,0)}}

[data-fx~="ink-chroma"]{background-image:linear-gradient(100deg,#2741D6 0%,#4C5FE8 45%,#7A5AE0 100%);
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;}
[data-fx~="dye-chroma"]{background-image:linear-gradient(120deg,#3B57F0 0%,#2741D6 100%);}
${inks}

[data-fx~="sheen"]{overflow:hidden;position:relative;}
[data-fx~="sheen"]::after{content:"";position:absolute;top:-20%;bottom:-20%;width:40%;left:-60%;transform:skewX(-20deg);
  background:linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent);animation:sheen 5s cubic-bezier(.4,0,.2,1) infinite;pointer-events:none;}
@keyframes sheen{0%,70%{left:-60%}100%{left:130%}}

[data-fx~="pulse"]{animation:pulse 1.8s ease-out infinite;}
@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(19,158,106,.5)}80%,100%{box-shadow:0 0 0 8px rgba(19,158,106,0)}}
[data-fx~="pulse-red"]{animation:pulseRed 1.6s ease-out infinite;}
@keyframes pulseRed{0%{box-shadow:0 0 0 0 rgba(224,24,45,.5)}80%,100%{box-shadow:0 0 0 9px rgba(224,24,45,0)}}

[data-fx~="float"]{animation:float 6s ease-in-out infinite;}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}

[data-fx~="lift"]{transition:transform .35s cubic-bezier(.2,.9,.25,1.15),box-shadow .35s ease;}
@media (hover:hover){[data-fx~="lift"]:hover{transform:translateY(-3px);}}
[data-fx~="pointer"]{cursor:pointer;}
[data-fx~="tabular"]{font-variant-numeric:tabular-nums;}
@keyframes hairIn{from{opacity:0;transform:scale(1.03)}to{opacity:1;transform:none}}
[data-fx~="balance"]{text-wrap:balance;}
[data-fx~="nosel"]{user-select:none;-webkit-user-select:none;}

@media (prefers-reduced-motion:reduce){
  [data-fx~="aurora"]::before,[data-fx~="aurora"]::after,[data-fx~="flow"]::before,[data-fx~="flow"]::after,[data-fx~="sheen"]::after,[data-fx~="float"],[data-fx~="pulse"],[data-fx~="pulse-red"]{animation:none!important;}
}
`;

let installed = false;

/** Adds the fonts and the stylesheet to the page once. */
export function installWebStyles() {
  if (installed || typeof document === 'undefined') return;
  installed = true;
  for (const href of ['https://fonts.googleapis.com', 'https://fonts.gstatic.com']) {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = href;
    if (href.includes('gstatic')) link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }
  const fonts = document.createElement('link');
  fonts.rel = 'stylesheet';
  fonts.href = rtl() ? `${FONTS}&family=Noto+Naskh+Arabic:wght@400..700&family=IBM+Plex+Sans+Arabic:wght@400;500;600` : FONTS;
  document.head.appendChild(fonts);
  const style = document.createElement('style');
  style.id = 'chroma-fx';
  style.textContent = CSS;
  document.head.appendChild(style);
}

/** Resolves when the display font is ready (or after a short wait), so the intro never flashes a fallback font. */
export function fontsReady(timeout = 1600): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) return Promise.resolve();
  const load = Promise.all([
    document.fonts.load('italic 600 48px "Bodoni Moda"'),
    document.fonts.load('500 16px "Inter Tight"'),
    document.fonts.load('400 12px "DM Mono"'),
  ]).then(() => undefined);
  return Promise.race([load, new Promise<void>((resolve) => setTimeout(resolve, timeout))]).catch(() => undefined);
}
