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

export const PICKUPS = [
  {
    slug: 'coin',
    name: 'COIN',
    size: 34,
    svg: coin(34),
    note: 'Banked the instant it is taken, so a short run still pays.'
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
