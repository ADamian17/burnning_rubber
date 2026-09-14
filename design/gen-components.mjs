// Combines the design-system previews into one Claude Design canvas.
//
// The previews in ds/ are standalone pages, one per component, each with the
// same token block inlined so it renders on its own as a card. That is right
// for the Design System pane, which shows them individually — but it means
// there is no single place to look at the kit as a whole.
//
// Combining them is easier than combining the screens was. gen-screens.mjs has
// to scope every rule and rename every @keyframes, because two artboards use
// the same class name for different things. Here every preview shares one
// token block byte for byte, so the rules cannot disagree: emit it once, drop
// the bodies in, done.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const OUT = new URL('./screens/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

/** Grouped the way the Design System pane groups them. */
const GROUPS = [
  ['Foundations', [
    ['foundations/colors.html', 'Colours'],
    ['foundations/type.html', 'Type']
  ]],
  ['Buttons', [
    ['buttons/primary.html', 'Primary'],
    ['buttons/secondary.html', 'Secondary'],
    ['buttons/icon.html', 'Icon']
  ]],
  ['Controls', [
    ['controls/toggle.html', 'Toggle'],
    ['controls/segmented.html', 'Segmented']
  ]],
  ['HUD', [
    ['hud/plates.html', 'Plates'],
    ['hud/powerup-pill.html', 'Power-up pill'],
    ['hud/combo.html', 'Combo']
  ]],
  ['Cards', [
    ['cards/car-card.html', 'Car card'],
    ['cards/stat-meter.html', 'Stat meter']
  ]],
  ['Game objects', [
    ['game/pickups.html', 'Pickups'],
    ['game/road.html', 'Road'],
    ['game/fleet.html', 'Fleet']
  ]]
];

const read = (path) => readFileSync(new URL(`./ds/${path}`, import.meta.url).pathname, 'utf8');

/**
 * The <style> blocks in a preview's head — hoisted, because every preview
 * repeats the same token block and this page only needs it once.
 *
 * Head only, deliberately. ds/game/pickups.html keeps a second block inside its
 * body, holding the classes only it uses; that one rides along with the body
 * content below. Hoisting every block in the file instead would emit it twice.
 */
const headStylesOf = (html) =>
  [...html.slice(0, html.indexOf('<body>')).matchAll(/<style>([\s\S]*?)<\/style>/g)].map(
    (m) => m[1]
  );

/** Everything inside <body>, which is the component itself. */
const bodyOf = (html) => html.match(/<body>([\s\S]*?)<\/body>/)[1].trim();

/*
 * Deduped by exact content: today all 15 previews share one token block, so
 * this collapses to a single copy. It is written as a dedupe rather than
 * "read the first file" so that a preview adding its own head styles keeps
 * them instead of having them silently dropped.
 */
const paths = GROUPS.flatMap(([, members]) => members.map(([path]) => path));
const tokens = [...new Set(paths.flatMap((path) => headStylesOf(read(path))))].join('\n');

/**
 * How wide to draw a card.
 *
 * The previews were authored as standalone pages, so each assumes block flow
 * hands it a width. Neither obvious sizing works alone:
 *
 * - Shrink-wrapping alone breaks buttons/secondary.html. Its row caps itself at
 *   `max-width:360px`, but shrink-wrapped it gets ~180px instead, and the two
 *   `flex:1 1 0` buttons inside collapse to half that — so the GARAGE labels
 *   render outside their own buttons.
 * - Taking each preview's declared `max-width` alone breaks game/fleet.html,
 *   where those caps sit on the prose underneath, not on the artwork. Its widest
 *   car row wants 808px and would be cut off at 600px.
 *
 * So: shrink-wrap, with the declared cap as a floor. Whichever is genuinely
 * wider wins, and neither preview has to be special-cased.
 */
const PAD = 20;

/** The widest cap a preview declares, plus padding, since `*` is border-box. */
const floorOf = (html) => {
  const caps = [...bodyOf(html).matchAll(/max-width:(\d+)px/g)].map((m) => Number(m[1]));
  return caps.length ? Math.max(...caps) + PAD * 2 : 0;
};

/* `flex:none` so the row never squeezes a card below the size settled above. */
const card = (label, html) => `
<figure style="margin:0;display:flex;flex-direction:column;gap:10px;flex:none;">
  <figcaption style="font-size:9.5px;font-weight:900;letter-spacing:3px;color:#6A6058;">
    ${label.toUpperCase()}
  </figcaption>
  <div style="border:2px solid #2A2119;border-radius:12px;background:#0A0806;padding:${PAD}px;width:max-content;min-width:${floorOf(html)}px;">
    ${bodyOf(html)}
  </div>
</figure>`;

const section = (title, members) => `
<section style="display:flex;flex-direction:column;gap:18px;">
  <h2 style="margin:0;font-size:11px;font-weight:900;letter-spacing:3.6px;color:#F28D35;">
    ${title.toUpperCase()}
  </h2>
  <div style="display:flex;flex-wrap:wrap;gap:28px;align-items:flex-start;">
    ${members.map(([path, label]) => card(label, read(path))).join('\n')}
  </div>
</section>`;

/*
 * Sized to the widest card rather than to a screen. game/fleet.html needs 852px
 * for its car row, which with the page padding is what sets this floor; a
 * wider canvas just leaves the other groups hugging the left edge.
 */
const WIDTH = 1000;
/*
 * Measured from the rendered page, not guessed — it sets the thumbnail frame,
 * and a value short of the real height crops the game-objects row out of it.
 * Re-measure if previews are added.
 */
const HEIGHT = 5050;
const body = GROUPS.map(([title, members]) => section(title, members)).join('\n');

writeFileSync(`${OUT}Components.dc.html`, `<!DOCTYPE html>
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
${tokens}
/* the previews each set their own body padding; here they are nested, so the
   page owns the outer spacing instead */
body{margin:0;padding:0;background:#070605;}
</style>
</helmet>
<div style="display:flex;flex-direction:column;gap:44px;padding:44px;background:#070605;width:${WIDTH}px;box-sizing:border-box;font-family:'Outfit','Avenir Next',system-ui,sans-serif;">
${body}
</div>
</x-dc>
<script data-dc-script data-props='{"$preview":{"width":${WIDTH},"height":${HEIGHT}}}'>
class Component extends DCLogic {}
</script>
</body>
</html>
`);

const count = GROUPS.reduce((n, [, members]) => n + members.length, 0);
console.log(
  `Components.dc.html: ${count} components in ${GROUPS.length} groups, ` +
    `${(readFileSync(`${OUT}Components.dc.html`).length / 1024).toFixed(0)}KB`
);
