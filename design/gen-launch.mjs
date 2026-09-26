// Burning Rubber — launch assets: app icon and native splash.
//
// Three rules shaped this:
//
//   1. IT HAS TO SURVIVE 60x60. The wordmark cannot: "BURNING RUBBER" over two
//      lines is unreadable below about 180px, and the tagline sooner. So the
//      icon is one object, not a lockup.
//   2. IT IS THE GAME'S OWN GLYPH. The tyre already appears in the tagline, as
//      the O of "FEAR THE R(O)AD", and it is drawn from the same top-down view
//      the whole game is played in. Reusing it costs nothing and means the icon
//      is not a separate piece of art to keep in sync.
//   3. THE TITLE IS A VERB. Rubber that is burning, not a tyre at rest — hence
//      the heat under it and the smoke coming off it.
//
// iOS masks the icon to a squircle and applies its own rounding, so there is no
// corner radius and no transparency here: the art is full-bleed and everything
// that matters stays inside the middle ~78%.
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = new URL('./launch/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const S = 1024;
const C = S / 2;
/** The tyre sits above centre, leaving room for the mark to recede. */
const CY = S * 0.42;

const INK = '#0A0806';
const HOT = '#f77503';
const GOLD = '#FFC93C';
const RED = '#E4322B';
const TYRE = '#131110';
const TREAD = '#46403A';
const HUB = '#B7B1A8';
const SPOKE = '#544E45';

/** Tyre radius. Everything else is sized off it. */
const r0 = S * 0.212;

/** Tread blocks around the rim, as a dashed ring like the in-game glyph. */
const treadRing = (r, width) =>
  `<circle cx="${C}" cy="${CY}" r="${r}" fill="none" stroke="${TREAD}" stroke-width="${width}"
           stroke-dasharray="${r * 0.30} ${r * 0.44}" stroke-linecap="butt"/>`;

/** Four spokes, the same cross the tagline glyph uses. */
const spokes = (r) => {
  const d = r * 0.72;
  const k = d * Math.SQRT1_2;
  return `<g stroke="${SPOKE}" stroke-width="${r * 0.15}" stroke-linecap="round">
    <line x1="${C}" y1="${CY - d}" x2="${C}" y2="${CY + d}"/>
    <line x1="${C - d}" y1="${CY}" x2="${C + d}" y2="${CY}"/>
    <line x1="${C - k}" y1="${CY - k}" x2="${C + k}" y2="${CY + k}"/>
    <line x1="${C + k}" y1="${CY - k}" x2="${C - k}" y2="${CY + k}"/>
  </g>`;
};

/**
 * The stripe of rubber the tyre is laying down behind it.
 *
 * Third attempt at this mark and the first that works. Separate teardrop flames
 * read as candles standing on a wheel. A procedural flame mass built from sine
 * harmonics came out as a daisy, because anything radiating evenly in every
 * direction is a flower and fire does not do that. Skid marks solve it by being
 * literal: the title is what a tyre does, and black on hot survives 60px in a
 * way that licking flame never will.
 *
 * One stripe, not two. A pair looked right at a glance and is wrong on a second
 * look — one tyre leaves one mark, and the two splayed bands read as legs under
 * a round head.
 *
 * It runs the tyre's full width and fades rather than stopping, so the tyre is
 * the near end and the rubber recedes behind it.
 */
const skid = () => {
  const top = CY;
  const half = r0 * 0.92;
  const halfEnd = r0 * 0.66;
  return `<path d="M${C - half} ${top}
                   L${C + half} ${top}
                   L${C + halfEnd} ${S}
                   L${C - halfEnd} ${S} Z" fill="url(#mark)"/>`;
};

/**
 * @param ground  Background treatment, or '' for the transparent dark variant.
 * @param mono    True to drop all colour — iOS tints that variant itself.
 */
const icon = ({ ground, mono = false }) => {
  const heat = mono ? '#8E8E8E' : HOT;
  const spark = mono ? '#C9C9C9' : GOLD;
  const ember = mono ? '#6E6E6E' : RED;
  const r = r0;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>
    <!-- hot at the tyre, cooling to the corners: the heat has a source -->
    <radialGradient id="ground" cx="50%" cy="40%" r="76%">
      <stop offset="0%"   stop-color="${mono ? '#D8D8D8' : spark}"/>
      <stop offset="34%"  stop-color="${mono ? '#9A9A9A' : heat}"/>
      <stop offset="76%"  stop-color="${mono ? '#4A4A4A' : ember}"/>
      <stop offset="100%" stop-color="${mono ? '#1A1A1A' : '#6E1410'}"/>
    </radialGradient>
    <!-- marks fade out rather than stopping, so they recede instead of ending -->
    <linearGradient id="mark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#000000" stop-opacity="0.95"/>
      <stop offset="58%"  stop-color="#0A0806" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="#0A0806" stop-opacity="0.12"/>
    </linearGradient>
    <linearGradient id="rubber" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0%"   stop-color="${mono ? '#4A4A4A' : '#3A3431'}"/>
      <stop offset="46%"  stop-color="${mono ? '#242424' : TYRE}"/>
      <stop offset="100%" stop-color="#000000"/>
    </linearGradient>
  </defs>

  ${ground}

  <!-- the rubber it is laying, behind and below -->
  ${skid()}

  <!-- the tyre, straight from the tagline glyph -->
  <circle cx="${C}" cy="${CY}" r="${r}" fill="url(#rubber)"/>
  ${treadRing(r * 0.84, r * 0.26)}
  <!-- hub kept dark and small: a pale one turns the tyre into a target, and at
       60px the eye needs one dark disc rather than a ring around a bullseye -->
  <circle cx="${C}" cy="${CY}" r="${r * 0.32}" fill="${mono ? '#3C3C3C' : '#39332C'}"/>
  ${spokes(r * 0.32)}

  <!-- rim highlight, so the tyre does not read as a flat hole -->
  <circle cx="${C}" cy="${CY}" r="${r}" fill="none"
          stroke="${mono ? '#5E5E5E' : '#40382F'}" stroke-width="${S * 0.008}" opacity="0.8"/>
</svg>`;
};

/**
 * The native splash the webview sits behind until boot finishes.
 *
 * Deliberately carries no wordmark. The in-app splash route draws its own, and
 * two wordmarks at different scales would visibly jump at the handoff — the
 * native image is scaled to fill the screen, the HTML one is laid out for
 * 393x852, so they cannot be made to line up across every device.
 *
 * Instead this is exactly what sits behind that wordmark in the app: --ink,
 * with the same warm radial glow from .glow in ui.css, at the same 14% opacity.
 * When the splash lifts, the wordmark simply appears on a ground that never
 * changed. capacitor.config.ts sets the same #0A0806 behind it.
 *
 * Square because iOS scales one image to fill any screen: the glow is placed
 * slightly above centre so it lands near where .glow sits in portrait.
 */
const splash = (px) => {
  const c = px / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${px} ${px}">
  <defs>
    <radialGradient id="warm" cx="50%" cy="50%" r="50%">
      <stop offset="0%"  stop-color="#F28D35" stop-opacity="0.14"/>
      <stop offset="62%" stop-color="#F28D35" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${px}" height="${px}" fill="${INK}"/>
  <circle cx="${c}" cy="${px * 0.44}" r="${px * 0.34}" fill="url(#warm)"/>
</svg>`;
};

const FULL = `<rect width="${S}" height="${S}" fill="url(#ground)"/>`;
/* Dimmed for dark mode, but still a ground: the mark is black on hot, so a
 * transparent field would leave the skids invisible against the system's own
 * dark backdrop. */
const DARK = `<rect width="${S}" height="${S}" fill="url(#ground)"/>
  <rect width="${S}" height="${S}" fill="#0A0806" opacity="0.34"/>`;

const VARIANTS = [
  {
    slug: 'icon',
    note: 'Default. Full-bleed, no transparency — iOS applies its own mask.',
    svg: icon({ ground: FULL })
  },
  {
    slug: 'icon-dark',
    note: 'iOS 18 dark. Keeps its ground — black marks on a transparent field would vanish.',
    svg: icon({ ground: DARK })
  },
  {
    slug: 'icon-tinted',
    note: 'iOS 18 tinted. Greyscale by luminance; iOS supplies the colour.',
    svg: icon({ ground: FULL, mono: true })
  },
  {
    slug: 'splash',
    note: 'Native splash. Ink and glow only — the wordmark belongs to the web layer.',
    svg: splash(2732)
  }
];

let n = 0;
for (const v of VARIANTS) {
  writeFileSync(`${OUT}${v.slug}.svg`, v.svg);
  n++;
}
writeFileSync(
  `${OUT}launch.json`,
  JSON.stringify(
    VARIANTS.map(({ slug, note }) => ({ slug, note })),
    null,
    2
  )
);
console.log(`wrote ${n} launch assets + launch.json to ${OUT}`);
