// Burning Rubber — pickups scattered on the road.
//
// Same rules as the fleet: footprint is gameplay, colour is decoration, and
// readability at speed beats realism. A pickup is seen from directly above at
// 980pt/s, so it has to read as a shape in peripheral vision — a bright disc
// against dark asphalt — long before any detail on it registers.
//
// Deliberately much smaller than the narrowest car (46pt) so it never reads as
// traffic. Mistaking a coin for a car costs the player a swerve they did not
// need to make.
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = new URL('./pickups/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

/* ---------- colour ---------- */
const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgb2hex = (r) =>
  '#' + r.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
/** amt > 0 mixes toward white, amt < 0 toward black. */
const shade = (hex, amt) => {
  const t = amt > 0 ? 255 : 0,
    p = Math.abs(amt);
  return rgb2hex(hex2rgb(hex).map((c) => c + (t - c) * p));
};

const GOLD = '#FFC93C';
/* Straight off PowerUpActive.dc.html: the shield bubble and the SHIELD pill's
 * glow are both #35D6F2, and the SLOW-MO pill glows the paler #8BE9FA. */
const CYAN = '#35D6F2';
const PALE = '#8BE9FA';
const MAGENTA = '#F2359B';
const OUTLINE = 2.9;
const INK = '#0A0806';

/**
 * A struck coin, face-on.
 *
 * Drawn as concentric discs rather than a rotated ellipse: the road scrolls
 * beneath a fixed camera, so a coin lying on the asphalt keeps its full circle
 * the whole way down the screen. An ellipse would read as a coin standing on
 * edge and rolling, which is not what it is doing.
 */
const coin = (size) => {
  const c = size / 2;
  const r = c - OUTLINE;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="face" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0%"   stop-color="${shade(GOLD, 0.42)}"/>
      <stop offset="46%"  stop-color="${GOLD}"/>
      <stop offset="100%" stop-color="${shade(GOLD, -0.34)}"/>
    </linearGradient>
  </defs>

  <!-- rim: the dark ring is what separates it from the cream lane markings -->
  <circle cx="${c}" cy="${c}" r="${r}" fill="url(#face)" stroke="${INK}" stroke-width="${OUTLINE}"/>
  <circle cx="${c}" cy="${c}" r="${r * 0.74}" fill="none"
          stroke="${shade(GOLD, -0.34)}" stroke-width="${OUTLINE * 0.62}"/>

  <!-- struck bar, the fleet's decal motif at coin scale -->
  <rect x="${c - r * 0.34}" y="${c - r * 0.12}" width="${r * 0.68}" height="${r * 0.24}"
        rx="${r * 0.08}" fill="${shade(GOLD, -0.46)}"/>

  <!-- single specular hit; two highlights read as noise at speed -->
  <ellipse cx="${c - r * 0.34}" cy="${c - r * 0.40}" rx="${r * 0.26}" ry="${r * 0.17}"
           fill="${shade(GOLD, 0.66)}" opacity="0.9"/>
</svg>`;
};

/**
 * A power-up token: the same struck disc as the coin, in its own colour, with
 * one glyph punched through it.
 *
 * Shape is deliberately shared with the coin. At 980pt/s the player reads
 * "round bright thing = drive over it" long before any glyph resolves; colour
 * then says which one it was. Giving each power a distinct silhouette would
 * make them read as obstacles for the first few frames, which is the one thing
 * a collectible must never do.
 */
const token = (size, tone, glyph) => {
  const c = size / 2;
  const r = c - OUTLINE;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="f" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0%"   stop-color="${shade(tone, 0.46)}"/>
      <stop offset="46%"  stop-color="${tone}"/>
      <stop offset="100%" stop-color="${shade(tone, -0.36)}"/>
    </linearGradient>
  </defs>

  <circle cx="${c}" cy="${c}" r="${r}" fill="url(#f)" stroke="${INK}" stroke-width="${OUTLINE}"/>
  <circle cx="${c}" cy="${c}" r="${r * 0.76}" fill="none"
          stroke="${shade(tone, -0.36)}" stroke-width="${OUTLINE * 0.55}"/>
  <g transform="translate(${c} ${c}) scale(${r / 12})" fill="${INK}" stroke="${INK}"
     stroke-width="0.9" stroke-linejoin="round" stroke-linecap="round">${glyph}</g>
  <ellipse cx="${c - r * 0.34}" cy="${c - r * 0.42}" rx="${r * 0.24}" ry="${r * 0.15}"
           fill="${shade(tone, 0.7)}" opacity="0.85"/>
</svg>`;
};

/* Glyphs are drawn in a 24x24 box centred on the origin, so -12..12 each way. */
const GLYPHS = {
  // a crest: the one shape that already means "this absorbs a hit"
  shield: '<path d="M0 -8 L7 -5 V1 C7 5 3.6 7.6 0 8.6 C-3.6 7.6 -7 5 -7 1 V-5 Z" fill="none" stroke-width="2.6"/>',
  // hourglass, not a clock face: hands are unreadable at this size
  slowmo:
    '<path d="M-5.6 -7.4 H5.6 M-5.6 7.4 H5.6 M-5.6 -7.4 L5.6 7.4 M5.6 -7.4 L-5.6 7.4" fill="none" stroke-width="2.4"/>',
  // horseshoe magnet, poles down
  magnet:
    '<path d="M-6 6 V-1 A6 6 0 0 1 6 -1 V6" fill="none" stroke-width="3.2"/><path d="M-6 6 V8.6 M6 6 V8.6" fill="none" stroke-width="3.2"/>'
};

export const PICKUPS = [
  {
    slug: 'coin',
    name: 'COIN',
    size: 34,
    svg: coin(34),
    note: 'Banked the instant it is taken, so a short run still pays.'
  },
  {
    slug: 'shield',
    name: 'SHIELD',
    size: 36,
    svg: token(36, CYAN, GLYPHS.shield),
    note: 'Eats one crash. Cyan to match the bubble it puts around the car.'
  },
  {
    slug: 'slowmo',
    name: 'SLOW-MO',
    size: 36,
    svg: token(36, PALE, GLYPHS.slowmo),
    note: 'The paler cyan of its pill; the real cue is the full-screen wash.'
  },
  {
    slug: 'magnet',
    name: 'MAGNET',
    size: 36,
    svg: token(36, MAGENTA, GLYPHS.magnet),
    note: 'The only pickup that acts on other pickups.'
  }
];

let n = 0;
for (const p of PICKUPS) {
  writeFileSync(`${OUT}${p.slug}.svg`, p.svg);
  n++;
}
writeFileSync(
  `${OUT}pickups.json`,
  JSON.stringify(
    PICKUPS.map(({ slug, name, size, note }) => ({ slug, name, size, note })),
    null,
    2
  )
);
console.log(`wrote ${n} pickups + pickups.json to ${OUT}`);
