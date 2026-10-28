import { CHROMA, CHROMA_ORDER } from '@ilker/shared';

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

[data-fx~="aurora"]{overflow:hidden;background-image:linear-gradient(180deg,#EEF2FF 0%,#F7F8FE 260px,#FFFFFF 520px);}
[data-fx~="aurora"]::before{content:"";position:absolute;left:-30%;top:-160px;width:160%;height:420px;filter:blur(70px);opacity:.42;pointer-events:none;will-change:transform;
  background:linear-gradient(100deg,transparent 10%,#C9D4FF 32%,#E3D9FF 52%,#FFD9E4 72%,transparent 90%);transform:rotate(-8deg);animation:ribbonA 26s ease-in-out infinite alternate;}
@keyframes ribbonA{0%{transform:translate3d(-5%,0,0) rotate(-8deg)}100%{transform:translate3d(6%,20px,0) rotate(-3deg)}}

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
  [data-fx~="aurora"]::before,[data-fx~="sheen"]::after,[data-fx~="float"],[data-fx~="pulse"],[data-fx~="pulse-red"]{animation:none!important;}
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
  fonts.href = FONTS;
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
