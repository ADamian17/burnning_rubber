// Burning Rubber — original top-down vehicle fleet.
//
// Two rules drive every shape here:
//   1. FOOTPRINT IS GAMEPLAY. Traffic varies by width and length, not paint,
//      because those decide whether a gap is passable. Colour is decoration.
//   2. Width is a player stat. A narrow car physically fits gaps a wide one
//      cannot, so the garage is a strategic choice rather than a cosmetic one.
//
// Style is heightened arcade: stubby bodies, fat wheels poking well past the
// panels, thick black outlines, oversized wings and scoops. Readability at
// speed beats realism every time.
//
// Every vehicle is one chassis function plus a single body hex — all shading is
// derived, so a new colourway costs one line and no new artwork.
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = new URL('./cars/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

/* ---------- colour ---------- */
const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgb2hex = (r) => '#' + r.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
/** amt > 0 mixes toward white, amt < 0 toward black. */
const shade = (hex, amt) => {
  const t = amt > 0 ? 255 : 0, p = Math.abs(amt);
  return rgb2hex(hex2rgb(hex).map((c) => c + (t - c) * p));
};

const GLASS = '#161F27', GLASS_HI = '#415866', TYRE = '#121010', TREAD = '#2E2926';
const OUTLINE = 2.9;

/* ---------- parts ---------- */
const grads = (id, body) => `
  <defs>
    <linearGradient id="b${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="${shade(body, .38)}"/>
      <stop offset="20%"  stop-color="${body}"/>
      <stop offset="68%"  stop-color="${body}"/>
      <stop offset="100%" stop-color="${shade(body, -.40)}"/>
    </linearGradient>
    <linearGradient id="g${id}" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0%"   stop-color="${GLASS_HI}"/>
      <stop offset="52%"  stop-color="${GLASS}"/>
      <stop offset="100%" stop-color="${shade(GLASS, .18)}"/>
    </linearGradient>
  </defs>`;

/** Fat cartoon tyre. Pokes well past the body — that overhang is the silhouette. */
const wheel = (x, y, w, h) => `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w * 0.30}" fill="${TYRE}"/>
  <rect x="${x + w * 0.22}" y="${y + h * 0.16}" width="${w * 0.56}" height="${h * 0.68}" rx="${w * 0.16}"
        fill="none" stroke="${TREAD}" stroke-width="1.5" stroke-dasharray="2.6 3"/>`;

const lamp = (x, y, w, h, fill) => `
  <rect x="${x - 1.4}" y="${y - 1.4}" width="${w + 2.8}" height="${h + 2.8}" rx="${(h + 2.8) / 2}" fill="${fill}" opacity=".32"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2.1}" fill="${fill}" stroke="#000" stroke-width="1.2"/>
  <rect x="${x + 1.6}" y="${y + 1.1}" width="${w - 3.2}" height="${h / 2.8}" rx="${h / 6}" fill="#FFF" opacity=".6"/>`;

const glassPane = (id, x1, x2, yTop, x3, x4, yBot) =>
  `<path d="M${x1} ${yTop}L${x2} ${yTop}L${x4} ${yBot}L${x3} ${yBot}Z" fill="url(#g${id})"
         stroke="#000" stroke-width="1.9" stroke-linejoin="round"/>`;

/** Side shading strip, clipped to the body so the car reads as a rounded volume. */
const volume = (w, h, inset) => `
  <rect x="0" y="0" width="${inset}" height="${h}" fill="#FFF" opacity=".13"/>
  <rect x="${w - inset}" y="0" width="${inset}" height="${h}" fill="#000" opacity=".22"/>`;

/** Oversized rear wing — the loudest arcade cue on the player cars.
 *  Deliberately darker than the body: at speed the wing has to read as a
 *  separate object stuck on the back, not as more bodywork. */
const wing = (cx, y, span, body, accent) => `
  <rect x="${cx - span / 2 + 6}" y="${y - 7}" width="8" height="14" rx="2.4" fill="${shade(body, -.52)}" stroke="#000" stroke-width="1.8"/>
  <rect x="${cx + span / 2 - 14}" y="${y - 7}" width="8" height="14" rx="2.4" fill="${shade(body, -.52)}" stroke="#000" stroke-width="1.8"/>
  <rect x="${cx - span / 2}" y="${y}" width="${span}" height="12" rx="3.8" fill="${shade(body, -.40)}" stroke="#000" stroke-width="${OUTLINE}"/>
  ${accent ? `<rect x="${cx - span / 2 + 4}" y="${y + 3.4}" width="${span - 8}" height="4" rx="2" fill="${accent}" opacity=".9"/>` : ''}
  <rect x="${cx - span / 2 + 4}" y="${y + 1.6}" width="${span - 8}" height="2" rx="1" fill="#FFF" opacity=".3"/>`;

/* =========================================================================
   PLAYER CHASSIS
   ========================================================================= */

/* Starter muscle — stubby, wide hips, big scoop, modest wing. 60 × 122 */
const muscle = (p) => { const W = 60, H = 122, id = 'muscle'; return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  ${grads(id, p.body)}
  ${wheel(0, 20, 13, 26)}${wheel(47, 20, 13, 26)}
  ${wheel(0, 78, 13, 29)}${wheel(47, 78, 13, 29)}
  <rect x="7" y="4" width="46" height="114" rx="17" fill="url(#b${id})" stroke="#000" stroke-width="${OUTLINE}"/>
  <clipPath id="k${id}"><rect x="7" y="4" width="46" height="114" rx="17"/></clipPath>
  <g clip-path="url(#k${id})">
    ${p.stripe ? `<rect x="${W / 2 - 8.5}" y="0" width="6.5" height="${H}" fill="${p.stripe}"/>
      <rect x="${W / 2 + 2}" y="0" width="6.5" height="${H}" fill="${p.stripe}"/>` : ''}
    ${volume(W, H, 9)}
  </g>
  <rect x="19" y="14" width="22" height="17" rx="4" fill="${shade(p.body, -.48)}" stroke="#000" stroke-width="1.8"/>
  <rect x="22" y="17.5" width="16" height="10" rx="2.6" fill="#070605"/>
  ${glassPane(id, 18, 42, 38, 14.5, 45.5, 53)}
  <rect x="14" y="53" width="32" height="27" rx="6" fill="none" stroke="${shade(p.body, -.36)}" stroke-width="1.7"/>
  ${glassPane(id, 15, 45, 80, 18, 42, 91)}
  ${wing(W / 2, 99, 52, p.body, p.stripe)}
  ${lamp(11, 7, 14, 6.4, '#FFF6DC')}${lamp(35, 7, 14, 6.4, '#FFF6DC')}
  ${lamp(11, 111, 14, 6.4, '#F0402F')}${lamp(35, 111, 14, 6.4, '#F0402F')}
</svg>`; };

/* Needle — narrow single-seater. Fits gaps nothing else can. 46 × 112 */
const needle = (p) => { const W = 46, H = 112, id = 'needle'; return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  ${grads(id, p.body)}
  ${wheel(0, 18, 11, 24)}${wheel(35, 18, 11, 24)}
  ${wheel(0, 72, 11, 26)}${wheel(35, 72, 11, 26)}
  <path d="M23 3C29 3 33 7 34 14L34.5 96C34.5 104 30 109 23 109C16 109 11.5 104 11.5 96L12 14C13 7 17 3 23 3Z"
        fill="url(#b${id})" stroke="#000" stroke-width="${OUTLINE}" stroke-linejoin="round"/>
  <clipPath id="k${id}"><path d="M23 3C29 3 33 7 34 14L34.5 96C34.5 104 30 109 23 109C16 109 11.5 104 11.5 96L12 14C13 7 17 3 23 3Z"/></clipPath>
  <g clip-path="url(#k${id})">
    ${p.stripe ? `<rect x="${W / 2 - 3.2}" y="0" width="6.4" height="${H}" fill="${p.stripe}"/>` : ''}
    ${volume(W, H, 7)}
  </g>
  <ellipse cx="23" cy="52" rx="9.5" ry="13" fill="url(#g${id})" stroke="#000" stroke-width="1.9"/>
  <rect x="13" y="30" width="20" height="7" rx="3" fill="${shade(p.body, -.46)}" stroke="#000" stroke-width="1.6"/>
  ${wing(W / 2, 92, 42, p.body, p.stripe)}
  ${lamp(9, 6, 11, 5.4, '#FFF6DC')}${lamp(26, 6, 11, 5.4, '#FFF6DC')}
  ${lamp(9, 101, 11, 5.4, '#F0402F')}${lamp(26, 101, 11, 5.4, '#F0402F')}
</svg>`; };

/* Widebody — fastest, but almost fills a lane. 72 × 128 */
const widebody = (p) => { const W = 72, H = 128, id = 'wide'; return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  ${grads(id, p.body)}
  ${wheel(0, 22, 15, 28)}${wheel(57, 22, 15, 28)}
  ${wheel(0, 82, 15, 31)}${wheel(57, 82, 15, 31)}
  <rect x="8" y="5" width="56" height="118" rx="16" fill="url(#b${id})" stroke="#000" stroke-width="${OUTLINE}"/>
  <clipPath id="k${id}"><rect x="8" y="5" width="56" height="118" rx="16"/></clipPath>
  <g clip-path="url(#k${id})">
    ${p.stripe ? `<rect x="0" y="46" width="${W}" height="9" fill="${p.stripe}"/>
      <rect x="0" y="59" width="${W}" height="4.5" fill="${p.stripe}" opacity=".7"/>` : ''}
    ${volume(W, H, 11)}
  </g>
  <rect x="21" y="15" width="30" height="15" rx="4" fill="${shade(p.body, -.48)}" stroke="#000" stroke-width="1.8"/>
  <rect x="24.5" y="18.5" width="23" height="8" rx="2.4" fill="#070605"/>
  ${glassPane(id, 21, 51, 38, 16, 56, 55)}
  <rect x="16" y="55" width="40" height="28" rx="6" fill="none" stroke="${shade(p.body, -.36)}" stroke-width="1.7"/>
  ${glassPane(id, 17, 55, 83, 21, 51, 95)}
  ${wing(W / 2, 103, 66, p.body, p.stripe)}
  ${lamp(12, 8, 17, 6.6, '#FFF6DC')}${lamp(43, 8, 17, 6.6, '#FFF6DC')}
  ${lamp(12, 116, 17, 6.6, '#F0402F')}${lamp(43, 116, 17, 6.6, '#F0402F')}
</svg>`; };

/* Hauler — heavy pickup. Slow, enormous grip, open bed. 68 × 142 */
const hauler = (p) => { const W = 68, H = 142, id = 'hauler'; return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  ${grads(id, p.body)}
  ${wheel(0, 24, 14, 28)}${wheel(54, 24, 14, 28)}
  ${wheel(0, 96, 14, 30)}${wheel(54, 96, 14, 30)}
  <rect x="8" y="4" width="52" height="134" rx="13" fill="url(#b${id})" stroke="#000" stroke-width="${OUTLINE}"/>
  <clipPath id="k${id}"><rect x="8" y="4" width="52" height="134" rx="13"/></clipPath>
  <g clip-path="url(#k${id})">${volume(W, H, 10)}</g>
  <rect x="20" y="14" width="28" height="12" rx="3.4" fill="${shade(p.body, -.44)}" stroke="#000" stroke-width="1.7"/>
  ${glassPane(id, 21, 47, 34, 16, 52, 50)}
  <rect x="16" y="50" width="36" height="24" rx="5" fill="none" stroke="${shade(p.body, -.36)}" stroke-width="1.7"/>
  ${glassPane(id, 17, 51, 74, 21, 47, 84)}
  <rect x="13" y="90" width="42" height="42" rx="5" fill="${shade(p.body, -.50)}" stroke="#000" stroke-width="2.2"/>
  ${[97, 105, 113, 121].map((y) => `<rect x="16.5" y="${y}" width="35" height="2.6" rx="1.3" fill="${shade(p.body, -.64)}"/>`).join('')}
  ${p.cargo ? `<rect x="17" y="94" width="34" height="19" rx="3" fill="${p.cargo}" stroke="#000" stroke-width="1.8"/>
    <rect x="17" y="101" width="34" height="2.6" fill="${shade(p.cargo, -.34)}"/>` : ''}
  ${lamp(12, 7, 16, 6.4, '#FFF6DC')}${lamp(40, 7, 16, 6.4, '#FFF6DC')}
  ${lamp(12, 130, 16, 6.4, '#F0402F')}${lamp(40, 130, 16, 6.4, '#F0402F')}
</svg>`; };

/* =========================================================================
   TRAFFIC CHASSIS — ordered by footprint, which is the whole point
   ========================================================================= */

/* Compact bubble — narrow enough to squeeze past inside its own lane. 46 × 96 */
const compact = (p) => { const W = 46, H = 96, id = 'compact'; return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  ${grads(id, p.body)}
  ${wheel(0, 16, 11, 22)}${wheel(35, 16, 11, 22)}
  ${wheel(0, 60, 11, 23)}${wheel(35, 60, 11, 23)}
  <rect x="5.5" y="4" width="35" height="88" rx="16" fill="url(#b${id})" stroke="#000" stroke-width="${OUTLINE}"/>
  <clipPath id="k${id}"><rect x="5.5" y="4" width="35" height="88" rx="16"/></clipPath>
  <g clip-path="url(#k${id})">${volume(W, H, 7)}</g>
  ${glassPane(id, 15, 31, 30, 11, 35, 43)}
  <rect x="11" y="43" width="24" height="18" rx="5" fill="none" stroke="${shade(p.body, -.36)}" stroke-width="1.6"/>
  ${glassPane(id, 11.5, 34.5, 61, 15, 31, 70)}
  ${lamp(9, 7, 11, 5.2, '#FFF6DC')}${lamp(26, 7, 11, 5.2, '#FFF6DC')}
  ${lamp(9, 85, 11, 5.2, '#F0402F')}${lamp(26, 85, 11, 5.2, '#F0402F')}
</svg>`; };

/* Commuter sedan — the baseline threat. 62 × 128 */
const sedan = (p) => { const W = 62, H = 128, id = 'sedan'; return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  ${grads(id, p.body)}
  ${wheel(0, 22, 12, 25)}${wheel(50, 22, 12, 25)}
  ${wheel(0, 82, 12, 26)}${wheel(50, 82, 12, 26)}
  <rect x="7" y="4" width="48" height="120" rx="18" fill="url(#b${id})" stroke="#000" stroke-width="${OUTLINE}"/>
  <clipPath id="k${id}"><rect x="7" y="4" width="48" height="120" rx="18"/></clipPath>
  <g clip-path="url(#k${id})">
    ${p.livery ? `<rect x="0" y="42" width="${W}" height="44" fill="${p.livery}"/>
      <rect x="0" y="38" width="${W}" height="4.5" fill="${shade(p.livery, -.34)}"/>
      <rect x="0" y="85" width="${W}" height="4.5" fill="${shade(p.livery, -.34)}"/>` : ''}
    ${volume(W, H, 9)}
  </g>
  ${glassPane(id, 20, 42, 40, 15, 47, 56)}
  <rect x="15" y="56" width="32" height="26" rx="6" fill="none" stroke="${shade(p.body, -.36)}" stroke-width="1.7"/>
  ${glassPane(id, 16, 46, 82, 20, 42, 93)}
  ${p.lightbar ? `<rect x="14" y="60" width="34" height="11" rx="3" fill="#3D7BFF" opacity=".22"/>
    <rect x="15" y="62" width="32" height="9" rx="2.8" fill="#0D0B0A" stroke="#000" stroke-width="1.5"/>
    <rect x="17" y="64" width="13" height="5.2" rx="1.8" fill="#3D7BFF"/>
    <rect x="32" y="64" width="13" height="5.2" rx="1.8" fill="#F0402F"/>` : ''}
  ${lamp(11, 7, 15, 6, '#FFF6DC')}${lamp(36, 7, 15, 6, '#FFF6DC')}
  ${lamp(11, 116, 15, 6, '#F0402F')}${lamp(36, 116, 15, 6, '#F0402F')}
</svg>`; };

/* Parcel van — wide. Nearly fills a lane. 70 × 158 */
const van = (p) => { const W = 70, H = 158, id = 'van'; return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  ${grads(id, p.body)}
  ${wheel(0, 24, 13, 26)}${wheel(57, 24, 13, 26)}
  ${wheel(0, 112, 13, 27)}${wheel(57, 112, 13, 27)}
  <rect x="7" y="4" width="56" height="150" rx="14" fill="url(#b${id})" stroke="#000" stroke-width="${OUTLINE}"/>
  <clipPath id="k${id}"><rect x="7" y="4" width="56" height="150" rx="14"/></clipPath>
  <g clip-path="url(#k${id})">${volume(W, H, 10)}</g>
  ${glassPane(id, 22, 48, 12, 16, 54, 28)}
  <rect x="11" y="34" width="48" height="112" rx="7" fill="${shade(p.body, p.boxTone ?? .13)}" stroke="#000" stroke-width="2.2"/>
  ${p.decal ? `<rect x="17" y="62" width="36" height="46" rx="4" fill="${p.decal}"/>` : ''}
  ${[46, 76, 106, 134].map((y) => `<rect x="15" y="${y}" width="40" height="2.2" rx="1.1" fill="${shade(p.body, -.28)}" opacity=".65"/>`).join('')}
  ${lamp(12, 7, 15, 5.8, '#FFF6DC')}${lamp(43, 7, 15, 5.8, '#FFF6DC')}
  ${lamp(12, 146, 15, 5.8, '#F0402F')}${lamp(43, 146, 15, 5.8, '#F0402F')}
</svg>`; };

/* Box truck — long block, slow to clear. 74 × 182 */
const boxTruck = (p) => { const W = 74, H = 182, id = 'box'; return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  ${grads(id, p.body)}
  ${wheel(0, 20, 13, 26)}${wheel(61, 20, 13, 26)}
  ${wheel(0, 126, 13, 25)}${wheel(61, 126, 13, 25)}
  ${wheel(0, 150, 13, 25)}${wheel(61, 150, 13, 25)}
  <rect x="9" y="4" width="56" height="42" rx="12" fill="url(#b${id})" stroke="#000" stroke-width="${OUTLINE}"/>
  ${glassPane(id, 23, 51, 12, 17, 57, 28)}
  <rect x="6" y="40" width="62" height="138" rx="8" fill="${shade(p.body, p.boxTone ?? .16)}" stroke="#000" stroke-width="${OUTLINE}"/>
  <rect x="12" y="47" width="50" height="124" rx="4" fill="none" stroke="${shade(p.body, -.28)}" stroke-width="1.7"/>
  ${[60, 86, 112, 138, 160].map((y) => `<rect x="12" y="${y}" width="50" height="2.4" rx="1.2" fill="${shade(p.body, -.24)}" opacity=".6"/>`).join('')}
  ${p.decal ? `<rect x="17" y="76" width="40" height="52" rx="4" fill="${p.decal}"/>` : ''}
  <rect x="6" y="40" width="10" height="138" fill="#FFF" opacity=".10"/>
  <rect x="58" y="40" width="10" height="138" fill="#000" opacity=".18"/>
  ${lamp(13, 6, 16, 6, '#FFF6DC')}${lamp(45, 6, 16, 6, '#FFF6DC')}
  ${lamp(13, 169, 16, 6.2, '#F0402F')}${lamp(45, 169, 16, 6.2, '#F0402F')}
</svg>`; };

/* Semi — absurdly long. The wall. 76 × 234 */
const semi = (p) => { const W = 76, H = 234, id = 'semi'; return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  ${grads(id, p.body)}
  ${wheel(0, 176, 13, 26)}${wheel(63, 176, 13, 26)}
  ${wheel(0, 202, 13, 26)}${wheel(63, 202, 13, 26)}
  <rect x="5" y="70" width="66" height="160" rx="8" fill="${shade(p.body, p.boxTone ?? .22)}" stroke="#000" stroke-width="${OUTLINE}"/>
  <rect x="11" y="77" width="54" height="146" rx="4" fill="none" stroke="${shade(p.body, -.26)}" stroke-width="1.7"/>
  ${[92, 118, 144, 170, 196].map((y) => `<rect x="11" y="${y}" width="54" height="2.4" rx="1.2" fill="${shade(p.body, -.22)}" opacity=".6"/>`).join('')}
  ${p.decal ? `<rect x="16" y="108" width="44" height="60" rx="4" fill="${p.decal}"/>` : ''}
  <rect x="5" y="70" width="11" height="160" fill="#FFF" opacity=".10"/>
  <rect x="60" y="70" width="11" height="160" fill="#000" opacity=".18"/>
  <rect x="27" y="60" width="22" height="14" rx="3" fill="#171412" stroke="#000" stroke-width="1.8"/>
  ${wheel(0, 20, 14, 28)}${wheel(62, 20, 14, 28)}
  <rect x="8" y="4" width="60" height="60" rx="13" fill="url(#b${id})" stroke="#000" stroke-width="${OUTLINE}"/>
  <clipPath id="k${id}"><rect x="8" y="4" width="60" height="60" rx="13"/></clipPath>
  <g clip-path="url(#k${id})">${volume(W, H, 11)}</g>
  ${glassPane(id, 23, 53, 12, 16, 60, 30)}
  <rect x="17" y="34" width="42" height="24" rx="6" fill="none" stroke="${shade(p.body, -.36)}" stroke-width="1.7"/>
  <rect x="2" y="30" width="7" height="28" rx="3.4" fill="#96938C" stroke="#000" stroke-width="1.7"/>
  <rect x="67" y="30" width="7" height="28" rx="3.4" fill="#78756F" stroke="#000" stroke-width="1.7"/>
  ${lamp(13, 6, 17, 6.2, '#FFF6DC')}${lamp(46, 6, 17, 6.2, '#FFF6DC')}
  ${lamp(13, 220, 17, 6.4, '#F0402F')}${lamp(46, 220, 17, 6.4, '#F0402F')}
</svg>`; };

/* =========================================================================
   FLEET
   ========================================================================= */
const CHASSIS = { muscle, needle, widebody, hauler, compact, sedan, van, box: boxTruck, semi };

/** Lane width at 393pt / 4 lanes. Slack = how much room a vehicle leaves. */
export const LANE = 98.25;

export const FLEET = [
  /* --- player cars: width is a stat --- */
  { slug: 'straycat', name: 'STRAY CAT', chassis: 'muscle', kind: 'player',
    p: { body: '#D8362B', stripe: '#F5EFE4' }, w: 60, len: 122, cost: 0,
    stats: { speed: 3, handling: 4, grip: 4 },
    note: 'The starter. Balanced, forgiving, nothing special.' },
  { slug: 'hatpin', name: 'HATPIN', chassis: 'needle', kind: 'player',
    p: { body: '#35D6F2', stripe: '#0B2E38' }, w: 46, len: 112, cost: 600,
    stats: { speed: 3, handling: 6, grip: 2 },
    note: 'Skinniest car in the game. Slides through gaps that stop everything else.' },
  { slug: 'boarhound', name: 'BOARHOUND', chassis: 'widebody', kind: 'player',
    p: { body: '#F28D35', stripe: '#241A0E' }, w: 72, len: 128, cost: 1200,
    stats: { speed: 6, handling: 3, grip: 4 },
    note: 'Fastest thing you can buy — and almost too wide for the gaps it reaches.' },
  { slug: 'donkeywork', name: 'DONKEY WORK', chassis: 'hauler', kind: 'player',
    p: { body: '#3B9E58', cargo: '#7A5A2E' }, w: 68, len: 142, cost: 1800,
    stats: { speed: 2, handling: 3, grip: 6 },
    note: 'Slow and heavy, but it holds a lane through anything.' },

  /* --- traffic: ordered by footprint, which is the difficulty curve --- */
  { slug: 'traffic-compact', name: 'FLEA', chassis: 'compact', kind: 'traffic',
    p: { body: '#E4C63C' }, w: 46, len: 96, threat: 1,
    note: 'Leaves real room. You can take the same lane if your car is narrow enough.' },
  { slug: 'traffic-sedan', name: 'COMMUTER', chassis: 'sedan', kind: 'traffic',
    p: { body: '#2F5AA8' }, w: 62, len: 128, threat: 2,
    note: 'The baseline. Everything else is measured against this.' },
  { slug: 'traffic-patrol', name: 'PATROL', chassis: 'sedan', kind: 'traffic',
    p: { body: '#15181C', livery: '#E8E3D8', lightbar: true }, w: 62, len: 128, threat: 2,
    note: 'Same footprint as a commuter. Reads as a bigger deal than it is — deliberately.' },
  { slug: 'traffic-van', name: 'PARCEL', chassis: 'van', kind: 'traffic',
    p: { body: '#D6D0C4', boxTone: .05, decal: '#F28D35' }, w: 70, len: 158, threat: 3,
    note: 'Wide. Leaves 28pt of lane — a Hatpin fits, a Boarhound does not.' },
  { slug: 'traffic-box', name: 'COLD STORE', chassis: 'box', kind: 'traffic',
    p: { body: '#8FB4C4', boxTone: .10, decal: '#E8E3D8' }, w: 74, len: 182, threat: 4,
    note: 'Long. Committing to a lane beside it is a long commitment.' },
  { slug: 'traffic-semi', name: 'LEVIATHAN', chassis: 'semi', kind: 'traffic',
    p: { body: '#B0332B', boxTone: .24, decal: '#E8E3D8' }, w: 76, len: 234, threat: 5,
    note: 'The wall. Two lanes of it and the run is over.' }
];

export const svgFor = (car) => CHASSIS[car.chassis](car.p);

let n = 0;
for (const car of FLEET) { writeFileSync(`${OUT}${car.slug}.svg`, svgFor(car)); n++; }
writeFileSync(`${OUT}fleet.json`, JSON.stringify(
  FLEET.map(({ slug, name, kind, w, len, cost, stats, threat, note }) => ({
    slug, name, kind, w, len, cost, stats, threat, note,
    laneSlack: +(LANE - w).toFixed(1)
  })), null, 2));
console.log(`wrote ${n} vehicles + fleet.json to ${OUT}`);
