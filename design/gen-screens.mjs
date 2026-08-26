// Converts the standalone artboards into Claude Design multi-screen canvases.
//
// Each artboard is authored as its own .dc.html with its own <helmet><style>.
// Claude Design puts several screens in ONE file on a canvas, so combining them
// means resolving three collisions:
//   1. Class names repeat across artboards with different rules -> scope every
//      rule under a per-screen wrapper class.
//   2. @keyframes names repeat (sweep, pulse) -> rename per screen.
//   3. Sprites are <img src="x.svg"> but the design project has no such files
//      -> inline each SVG ONCE as a CSS background data URI and swap the tag.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const OUT = new URL('./screens/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const FILES = {
  'Menu.dc.html': [
    ['Splash.dc.html', 'splash', 'Splash'],
    ['MainMenu.dc.html', 'menu', 'Main menu'],
    ['Onboarding.dc.html', 'onboard', 'Onboarding'],
    ['Settings.dc.html', 'settings', 'Settings'],
    ['Credits.dc.html', 'credits', 'Credits'],
    ['ResetConfirm.dc.html', 'reset', 'Reset confirm']
  ],
  'Run.dc.html': [
    ['Main.dc.html', 'hud', 'In-run HUD'],
    ['PowerUpActive.dc.html', 'power', 'HUD · power-ups active'],
    ['Pause.dc.html', 'pause', 'Pause'],
    ['RunSummary.dc.html', 'summary', 'Run summary'],
    ['Countdown.dc.html', 'countdown', 'Countdown']
  ],
  'States.dc.html': [
    ['CantAfford.dc.html', 'cantafford', 'Garage · not enough coins'],
    ['Unlock.dc.html', 'unlock', 'Car unlocked'],
    ['DailyResult.dc.html', 'daily', 'Daily challenge complete']
  ]
};

/* ---------- css scoping ---------- */
/** Split a stylesheet into top-level blocks, keeping @keyframes intact. */
const blocks = (css) => {
  const out = []; let buf = '', depth = 0;
  for (const ch of css) {
    buf += ch;
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { out.push(buf); buf = ''; } }
  }
  if (buf.trim()) out.push(buf);
  return out;
};

const HOIST = /^\s*(:root|\*|a|a:hover|a:visited|a:link)\s*$/;

/** Returns { scoped, hoisted, frames } for one screen's stylesheet. */
const scopeCss = (css, slug) => {
  let hoisted = '', scoped = '';
  const renamed = new Set();
  // pass 1: rename keyframes so two screens can't fight over "sweep"
  css = css.replace(/@keyframes\s+([\w-]+)/g, (m, n) => { renamed.add(n); return `@keyframes ${slug}_${n}`; });
  for (const n of renamed) {
    css = css.replace(new RegExp(`(animation(?:-name)?\\s*:[^;}]*?)\\b${n}\\b`, 'g'), `$1${slug}_${n}`);
  }
  for (const b of blocks(css)) {
    const t = b.trim();
    if (!t) continue;
    if (t.startsWith('@keyframes')) { hoisted += t + '\n'; continue; }
    const i = t.indexOf('{');
    const sels = t.slice(0, i), body = t.slice(i);
    // :root tokens and element resets are identical across artboards — emit once
    if (sels.split(',').every((s) => HOIST.test(s))) { hoisted += t + '\n'; continue; }
    if (/^\s*body\s*$/.test(sels)) continue; // body styling belongs to the host page
    scoped += sels.split(',').map((s) => `.s-${slug} ${s.trim()}`).join(',') + body + '\n';
  }
  return { scoped, hoisted };
};

/* ---------- sprite inlining ---------- */
const sprites = new Map();
const spriteClass = (file) => {
  const slug = file.replace(/\.svg$/, '');
  if (!sprites.has(slug)) {
    const b64 = Buffer.from(readFileSync(`cars/${file}`, 'utf8')).toString('base64');
    sprites.set(slug, `.car-${slug}{background-image:url("data:image/svg+xml;base64,${b64}");` +
      `background-size:100% 100%;background-repeat:no-repeat;}`);
  }
  return `car-${slug}`;
};

/* ---------- per-artboard extraction ---------- */
const build = (src, slug, label) => {
  const raw = readFileSync(src, 'utf8');
  const css = raw.match(/<style>([\s\S]*?)<\/style>/)[1];
  // the artboard's single root element is the screen
  const m = raw.match(/<\/helmet>\s*([\s\S]*?)\s*<\/x-dc>/);
  let body = m[1];
  // <img src="x.svg" ... style="..."> -> <div class="car-x" style="..."> (deduped)
  body = body.replace(/<img\s+src="([a-z-]+\.svg)"[^>]*?style="([^"]*)"[^>]*>/g,
    (_, file, style) => `<div class="${spriteClass(file)}" style="${style}"></div>`);
  const { scoped, hoisted } = scopeCss(css, slug);
  return { css: scoped, hoisted, html:
`<div style="display:flex;flex-direction:column;gap:12px;">
<div style="font-size:9.5px;font-weight:900;letter-spacing:3px;color:#6A6058;">${label.toUpperCase()}</div>
<div class="s-${slug}" data-screen-label="${label}">
${body}
</div>
</div>` };
};

/* ---------- emit ---------- */
for (const [outFile, members] of Object.entries(FILES)) {
  const parts = members.map(([f, s, l]) => build(f, s, l));
  const seen = new Set(); let hoist = '';
  for (const p of parts) for (const line of p.hoisted.split(/\n(?=[.@:*a-z])/)) {
    const k = line.trim(); if (k && !seen.has(k)) { seen.add(k); hoist += k + '\n'; }
  }
  writeFileSync(OUT + outFile, `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<meta name="design_doc_mode" content="canvas">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Underdog&family=Outfit:wght@400;500;600;700;800;900&display=swap">
<style>
${hoist}
body{margin:0;background:#070605;}
${[...sprites.values()].join('\n')}
${parts.map((p) => p.css).join('\n')}
</style>
</helmet>
<div style="display:flex;gap:56px;padding:44px;background:#070605;align-items:flex-start;font-family:'Outfit','Avenir Next',system-ui,sans-serif;">
${parts.map((p) => p.html).join('\n')}
</div>
</x-dc>
<script data-dc-script data-props='{"$preview":{"width":${members.length * 449 + 88},"height":940}}'>
class Component extends DCLogic {}
</script>
</body>
</html>
`);
  console.log(`${outFile}: ${members.length} screens, ${(readFileSync(OUT + outFile).length / 1024).toFixed(0)}KB`);
  sprites.clear();
}
