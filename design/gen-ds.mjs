// Generates the Burning Rubber design-system component previews.
// Each component is a standalone HTML page: tokens are inlined so a preview
// card renders correctly without resolving sibling stylesheets.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const OUT = new URL('./ds/', import.meta.url).pathname;

const TOKENS = `
  :root{
    --ink:#0A0806; --panel:#14100C; --panel2:#1E1813; --edge:#3A2E22;
    --orange:#F28D35; --hot:#f77503; --lite:#FFB765;
    --cream:#F5EFE4; --muted:#9C9184;
    --red:#E4322B; --gold:#FFC93C; --cyan:#35D6F2; --magenta:#F2359B;
    --asphalt:#26241F; --lane:#EFE9DC;
    --display:'Underdog','Chalkboard SE','Comic Sans MS',cursive;
    --ui:'Outfit','Avenir Next','Segoe UI',system-ui,sans-serif;
  }
  *{box-sizing:border-box;}
  body{margin:0;padding:28px;background:var(--ink);color:var(--cream);font-family:var(--ui);
       -webkit-font-smoothing:antialiased;}
  a{color:var(--orange);} a:hover{color:var(--hot);}
  .cap{font-size:8.5px;font-weight:900;letter-spacing:2.2px;color:#6A6058;margin-bottom:8px;}
  .grp{display:flex;flex-direction:column;gap:22px;}
  .rowx{display:flex;gap:14px;align-items:flex-start;}
  .b{border-radius:12px;border:3px solid #000;display:flex;align-items:center;justify-content:center;
     gap:10px;font-family:var(--display);letter-spacing:1.2px;}
  .b-primary{background:linear-gradient(180deg,#FFC684,var(--orange) 42%,var(--hot));color:#1A0F04;
     box-shadow:0 7px 0 #000, 0 12px 20px rgba(0,0,0,.5), inset 0 2px 0 rgba(255,255,255,.4);}
  .b-sec{background:linear-gradient(180deg,#241E17,#171310);color:var(--cream);
     box-shadow:0 6px 0 #000, inset 0 1px 0 rgba(255,183,101,.14);}
  .plate{background:rgba(10,8,6,.86);border:2px solid #000;border-radius:9px;
     box-shadow:0 3px 0 #000, inset 0 1px 0 rgba(255,183,101,.18);}
  .lbl{font-size:9.5px;font-weight:800;letter-spacing:2.3px;color:var(--muted);}
  .num{font-weight:900;font-variant-numeric:tabular-nums;color:var(--cream);text-shadow:0 2px 0 rgba(0,0,0,.9);}
  .chip{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:6px;
     border:2px solid #000;font-size:9px;font-weight:900;letter-spacing:1.9px;}
  .meter{display:flex;gap:3px;}
  .pip{width:12px;height:9px;border-radius:2px;background:#2B241D;border:1px solid #000;}
  .pip-on{background:linear-gradient(180deg,var(--lite),var(--hot));}
`;

const COIN = `<svg viewBox="0 0 24 24" width="19" height="19">
  <circle cx="12" cy="12" r="9.4" fill="#C98A0E"/><circle cx="12" cy="12" r="9.4" fill="none" stroke="#6B4708" stroke-width="1.6"/>
  <circle cx="12" cy="12" r="6.4" fill="#FFC93C"/><path d="M9.4 12h5.2M12 9.4v5.2" stroke="#8A5B08" stroke-width="1.9" stroke-linecap="round"/></svg>`;
const SHIELD = (c, w = 21) => `<svg viewBox="0 0 24 24" width="${w}" height="${w}"><path d="M12 3.2 19.4 6v6.1c0 4.5-3.1 7.3-7.4 8.7-4.3-1.4-7.4-4.2-7.4-8.7V6z" fill="none" stroke="${c}" stroke-width="2.2" stroke-linejoin="round"/></svg>`;
const CLOCK = (c, w = 21) => `<svg viewBox="0 0 24 24" width="${w}" height="${w}" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12.6" r="8.4"/><path d="M12 8.2v4.6l3 1.9"/><path d="M9.2 2.6h5.6"/></svg>`;
const MAGNET = (c, w = 21) => `<svg viewBox="0 0 24 24" width="${w}" height="${w}" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round"><path d="M6 4.6v7.8a6 6 0 0 0 12 0V4.6"/><path d="M6 9.4h4.4"/><path d="M13.6 9.4H18"/></svg>`;
const PAUSE = (c) => `<svg viewBox="0 0 24 24" width="21" height="21"><rect x="6.5" y="4.5" width="4.2" height="15" rx="1.6" fill="${c}"/><rect x="13.3" y="4.5" width="4.2" height="15" rx="1.6" fill="${c}"/></svg>`;
const LOCK = (c) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round"><rect x="4.6" y="10.4" width="14.8" height="10" rx="2"/><path d="M8.2 10.4V7.6a3.8 3.8 0 0 1 7.6 0v2.8"/></svg>`;

const pips = (on, total = 6) =>
  `<span class="meter">${Array.from({ length: total }, (_, i) => `<i class="pip${i < on ? ' pip-on' : ''}"></i>`).join('')}</span>`;

const swatch = (name, hex, note) => `
  <div style="flex:none;width:126px;">
    <div style="height:74px;border-radius:11px;border:3px solid #000;background:${hex};
                box-shadow:0 5px 0 #000, inset 0 1px 0 rgba(255,255,255,.18);"></div>
    <div style="margin-top:9px;font-size:11px;font-weight:900;letter-spacing:1.3px;">${name}</div>
    <div style="margin-top:2px;font-size:10.5px;color:var(--muted);font-variant-numeric:tabular-nums;">${hex}</div>
    <div style="margin-top:3px;font-size:10px;color:#6A6058;line-height:1.35;">${note}</div>
  </div>`;

const toggle = (on) => on
  ? `<div style="width:62px;height:34px;border-radius:17px;border:2px solid #000;position:relative;
        background:linear-gradient(180deg,var(--lite),var(--hot));box-shadow:inset 0 2px 5px rgba(0,0,0,.6);">
       <div style="position:absolute;top:3px;right:3px;width:24px;height:24px;border-radius:50%;border:2px solid #000;
            background:linear-gradient(180deg,#FFFDF8,#CFC7BB);box-shadow:0 2px 0 rgba(0,0,0,.6);"></div></div>`
  : `<div style="width:62px;height:34px;border-radius:17px;border:2px solid #000;position:relative;
        background:#241E18;box-shadow:inset 0 2px 5px rgba(0,0,0,.8);">
       <div style="position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;border:2px solid #000;
            background:linear-gradient(180deg,#6E655C,#4A433C);box-shadow:0 2px 0 rgba(0,0,0,.6);"></div></div>`;

const token = (t, c, s) => `
  <div class="tok" style="background:radial-gradient(circle at 36% 30%,${t});box-shadow:0 5px 0 #000, 0 0 26px 5px ${s};">
    <div style="position:absolute;left:50%;bottom:-13px;width:62px;height:14px;margin-left:-31px;border-radius:50%;
                background:radial-gradient(ellipse,rgba(0,0,0,.65),rgba(0,0,0,0) 72%);"></div>${c}</div>`;

const components = [
  {
    path: 'foundations/colors.html', group: 'Foundations',
    name: 'Color', subtitle: 'Core palette, power-up hues, road surfaces', w: 700, h: 460,
    body: `
      <div class="cap">CORE</div>
      <div class="rowx" style="flex-wrap:wrap;">
        ${swatch('ORANGE', '#F28D35', 'Primary. Buttons, focus, brand.')}
        ${swatch('HOT', '#f77503', 'Gradient floor, pressed states.')}
        ${swatch('LITE', '#FFB765', 'Gradient ceiling, display type.')}
        ${swatch('CREAM', '#F5EFE4', 'Body copy on dark.')}
        ${swatch('INK', '#0A0806', 'Ground. Warm, never pure black.')}
      </div>
      <div class="cap" style="margin-top:30px;">POWER-UPS &mdash; deliberately outside the orange family so they read as foreign objects</div>
      <div class="rowx" style="flex-wrap:wrap;">
        ${swatch('CYAN', '#35D6F2', 'Shield.')}
        ${swatch('ICE', '#8BE9FA', 'Slow-mo.')}
        ${swatch('MAGENTA', '#F2359B', 'Magnet.')}
        ${swatch('GOLD', '#FFC93C', 'Coins, new-best.')}
        ${swatch('RED', '#E4322B', 'Crash, destructive.')}
      </div>`
  },
  {
    path: 'foundations/type.html', group: 'Foundations',
    name: 'Typography', subtitle: 'Underdog display + Outfit UI, with the numerals rule', w: 700, h: 470,
    body: `
      <div class="cap">DISPLAY &mdash; UNDERDOG</div>
      <div style="font-family:var(--display);font-size:56px;line-height:1;color:var(--lite);text-shadow:4px 5px 0 #000;">BURNING RUBBER</div>
      <div style="margin-top:6px;font-size:11px;color:var(--muted);">Titles, button labels, score celebrations. Always with a hard black offset shadow.</div>

      <div class="cap" style="margin-top:32px;">UI &amp; NUMERALS &mdash; OUTFIT</div>
      <div style="display:flex;gap:34px;align-items:baseline;">
        <div><div class="lbl">SCORE</div>
          <div class="num" style="font-size:38px;color:var(--lite);">08,420</div></div>
        <div><div class="lbl">DIST</div>
          <div class="num" style="font-size:38px;">2.4</div></div>
        <div><div class="lbl">COINS</div>
          <div class="num" style="font-size:38px;color:var(--gold);">128</div></div>
      </div>
      <div style="margin-top:10px;font-size:11px;color:var(--muted);max-width:520px;line-height:1.5;">
        Every readout uses <b style="color:var(--cream);">tabular-nums</b> &mdash; without it the score jitters horizontally
        as digits change, which is unreadable at speed. Display type never carries numerals in the HUD.
      </div>

      <div class="cap" style="margin-top:30px;">SCALE</div>
      <div style="display:flex;flex-direction:column;gap:7px;font-size:13px;color:var(--muted);">
        <div><b style="color:var(--cream);">Display</b> 88 / 66 / 44 / 30 &mdash; Underdog</div>
        <div><b style="color:var(--cream);">Body</b> 15 / 13 / 11 &mdash; Outfit 400&ndash;600</div>
        <div><b style="color:var(--cream);">Label</b> 9.5&ndash;10, weight 800&ndash;900, letter-spacing 2&ndash;3.5px, uppercase</div>
      </div>`
  },
  {
    path: 'buttons/primary.html', group: 'Buttons',
    name: 'Primary button', subtitle: 'Default, pressed, disabled', w: 560, h: 400,
    body: `
      <div class="grp" style="max-width:360px;">
        <div><div class="cap">DEFAULT</div>
          <div class="b b-primary" style="height:64px;font-size:28px;">PLAY</div></div>
        <div><div class="cap">PRESSED &mdash; drops 5px into its own shadow</div>
          <div style="height:71px;position:relative;">
            <div class="b" style="position:absolute;top:5px;left:0;right:0;height:64px;font-size:28px;color:#1A0F04;
                 background:linear-gradient(180deg,var(--hot),#C95E02);
                 box-shadow:0 2px 0 #000, inset 0 3px 8px rgba(0,0,0,.45);">PLAY</div></div></div>
        <div><div class="cap">DISABLED &mdash; e.g. can&rsquo;t afford</div>
          <div class="b" style="height:64px;font-size:28px;color:#5A524A;
               background:linear-gradient(180deg,#211D19,#171310);box-shadow:0 4px 0 #000;">BUY</div></div>
      </div>
      <div style="margin-top:26px;font-size:11px;color:var(--muted);max-width:360px;line-height:1.5;">
        Minimum height 60px. One primary per screen &mdash; if two actions compete, one of them is secondary.
      </div>`
  },
  {
    path: 'buttons/secondary.html', group: 'Buttons',
    name: 'Secondary button', subtitle: 'Default and pressed, inline and stacked', w: 560, h: 340,
    body: `
      <div class="cap">DEFAULT / PRESSED</div>
      <div class="rowx" style="max-width:360px;">
        <div class="b b-sec" style="flex:1 1 0;height:56px;font-size:21px;">GARAGE</div>
        <div style="flex:1 1 0;height:62px;position:relative;">
          <div class="b" style="position:absolute;top:5px;left:0;right:0;height:56px;font-size:21px;color:var(--lite);
               background:linear-gradient(180deg,#171310,#241E17);
               box-shadow:0 1px 0 #000, inset 0 3px 7px rgba(0,0,0,.6);">GARAGE</div></div>
      </div>
      <div class="cap" style="margin-top:30px;">WITH ICON, STACKED</div>
      <div style="max-width:360px;display:flex;flex-direction:column;gap:12px;">
        <div class="b b-sec" style="height:62px;font-size:27px;">
          <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="#F28D35" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.4 11.6a8.4 8.4 0 1 1-2.6-6"/><path d="M20.6 3.6v5.4h-5.4"/></svg>RESTART</div>
        <div class="b b-sec" style="height:62px;font-size:27px;color:#C9BEB2;">
          <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="#8E8377" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9.4 20.4H5.6a2 2 0 0 1-2-2V5.6a2 2 0 0 1 2-2h3.8"/><path d="M15.4 16.4 20.4 12l-5-4.4"/><path d="M20.4 12H9.6"/></svg>QUIT</div>
      </div>`
  },
  {
    path: 'buttons/icon.html', group: 'Buttons',
    name: 'Icon button', subtitle: '48×48 — default, pressed, locked', w: 460, h: 260,
    body: `
      <div class="cap">48&times;48 &mdash; DEFAULT / PRESSED / LOCKED</div>
      <div class="rowx">
        <div style="width:48px;height:48px;border-radius:11px;border:2px solid #000;background:rgba(10,8,6,.9);
             box-shadow:0 4px 0 #000, inset 0 1px 0 rgba(255,183,101,.16);display:flex;align-items:center;justify-content:center;">${PAUSE('#F5EFE4')}</div>
        <div style="width:48px;height:53px;position:relative;">
          <div style="position:absolute;top:5px;width:48px;height:48px;border-radius:11px;border:2px solid #000;
               background:#0A0806;box-shadow:0 1px 0 #000, inset 0 3px 7px rgba(0,0,0,.7);
               display:flex;align-items:center;justify-content:center;">${PAUSE('#FFB765')}</div></div>
        <div style="width:48px;height:48px;border-radius:11px;border:2px solid #000;
             background:linear-gradient(180deg,#1A1613,#100D0B);box-shadow:0 4px 0 #000;
             display:flex;align-items:center;justify-content:center;">${LOCK('#5A524A')}</div>
      </div>
      <div style="margin-top:24px;font-size:11px;color:var(--muted);max-width:340px;line-height:1.5;">
        48&times;48 is the floor, above the 44pt minimum, because these sit near the screen edge where
        touch accuracy is worst.
      </div>`
  },
  {
    path: 'controls/toggle.html', group: 'Controls',
    name: 'Toggle', subtitle: 'On / off, with row anatomy', w: 560, h: 340,
    body: `
      <div class="cap">ON / OFF</div>
      <div class="rowx">${toggle(true)}${toggle(false)}</div>
      <div class="cap" style="margin-top:30px;">IN A SETTINGS ROW</div>
      <div style="max-width:380px;display:flex;flex-direction:column;gap:11px;">
        <div style="display:flex;align-items:center;gap:13px;height:62px;padding:0 16px;
             background:linear-gradient(180deg,#1C1712,#131009);border:2px solid #000;border-radius:12px;
             box-shadow:0 4px 0 #000, inset 0 1px 0 rgba(255,183,101,.12);">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#F28D35" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9.4 17.4V5.6l10-2v11.2"/><circle cx="6.6" cy="17.8" r="2.8"/><circle cx="16.6" cy="14.8" r="2.8"/></svg>
          <span style="flex:1 1 auto;font-size:15px;font-weight:800;">MUSIC</span>${toggle(true)}</div>
        <div style="display:flex;align-items:center;gap:13px;height:62px;padding:0 16px;
             background:linear-gradient(180deg,#1C1712,#131009);border:2px solid #000;border-radius:12px;
             box-shadow:0 4px 0 #000, inset 0 1px 0 rgba(255,183,101,.12);">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#7E736A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="8.4" y="3.4" width="7.2" height="17.2" rx="2.2"/><path d="M4.6 9.4v5.2M19.4 9.4v5.2"/></svg>
          <span style="flex:1 1 auto;font-size:15px;font-weight:800;color:#8E8377;">HAPTICS</span>${toggle(false)}</div>
      </div>
      <div style="margin-top:20px;font-size:11px;color:var(--muted);max-width:380px;line-height:1.5;">
        The off state greys the row&rsquo;s icon and label too, so the state is legible without reading the switch.
      </div>`
  },
  {
    path: 'controls/segmented.html', group: 'Controls',
    name: 'Segmented picker', subtitle: 'Steering scheme — one selected, rest inert', w: 560, h: 320,
    body: `
      <div class="cap">SELECTED / UNSELECTED</div>
      <div style="display:flex;gap:11px;max-width:380px;">
        <div style="flex:1 1 0;height:78px;border-radius:11px;border:2px solid #000;display:flex;flex-direction:column;
             align-items:center;justify-content:center;gap:7px;font-size:9.5px;font-weight:900;letter-spacing:1.6px;
             background:linear-gradient(180deg,#FFC684,var(--orange) 46%,var(--hot));color:#1A0F04;
             box-shadow:0 5px 0 #000, inset 0 2px 0 rgba(255,255,255,.4);">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#1A0F04" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 21.4c3.6-1.6 5.4-4.4 5.4-7.6V9.4"/><circle cx="12" cy="6.6" r="3.2"/><path d="M6.6 13.8v-4.4"/>
            <path d="M3.6 12.4 6.6 9.4l3 3"/><path d="M20.4 12.4l-3-3-3 3"/></svg><span>DRAG</span></div>
        <div style="flex:1 1 0;height:78px;border-radius:11px;border:2px solid #000;display:flex;flex-direction:column;
             align-items:center;justify-content:center;gap:7px;font-size:9.5px;font-weight:900;letter-spacing:1.6px;
             background:linear-gradient(180deg,#1C1712,#131009);color:var(--muted);
             box-shadow:0 5px 0 #000, inset 0 1px 0 rgba(255,183,101,.1);">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#9C9184" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3.4" y="3.4" width="7.2" height="17.2" rx="2"/><rect x="13.4" y="3.4" width="7.2" height="17.2" rx="2"/>
            <path d="M7 14.4v-4.8M17 14.4v-4.8"/></svg><span>TAP LANES</span></div>
        <div style="flex:1 1 0;height:78px;border-radius:11px;border:2px solid #000;display:flex;flex-direction:column;
             align-items:center;justify-content:center;gap:7px;font-size:9.5px;font-weight:900;letter-spacing:1.6px;
             background:linear-gradient(180deg,#1C1712,#131009);color:var(--muted);
             box-shadow:0 5px 0 #000, inset 0 1px 0 rgba(255,183,101,.1);">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#9C9184" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="6.6" y="2.6" width="10.8" height="18.8" rx="2.4" transform="rotate(-14 12 12)"/>
            <path d="M2.6 18.4c1.4-.7 2.4-1.5 3-2.4"/><path d="M21.4 18.4c-1.4-.7-2.4-1.5-3-2.4"/></svg><span>TILT</span></div>
      </div>
      <div style="margin-top:18px;font-size:11px;color:var(--muted);max-width:380px;line-height:1.5;">
        Selection is carried by fill, not by a check mark &mdash; readable at a glance mid-run.
        Each segment is 78px tall so all three clear the 44pt minimum even at three-up.
      </div>`
  },
  {
    path: 'hud/plates.html', group: 'HUD',
    name: 'HUD plates', subtitle: 'Score, distance, coins — contrast over any road', w: 620, h: 400,
    body: `
      <div class="cap">OVER DARK ASPHALT / OVER LIGHT CONCRETE</div>
      <div class="rowx">
        ${['linear-gradient(180deg,#1C1A17,#26241F)', 'linear-gradient(180deg,#8A8275,#B4AC9E)'].map(bg => `
        <div style="flex:none;width:250px;height:210px;border-radius:13px;border:2px solid #000;overflow:hidden;
             background:${bg};padding:16px;">
          <div class="plate" style="padding:9px 15px 10px;display:inline-block;">
            <div class="lbl">SCORE</div>
            <div class="num" style="font-size:32px;line-height:1.02;color:var(--lite);">08,420</div></div>
          <div class="plate" style="margin-top:8px;padding:7px 15px 8px;display:inline-block;">
            <span class="lbl">DIST</span><span class="num" style="font-size:17px;margin-left:8px;">2.4</span>
            <span style="font-size:11px;font-weight:800;color:var(--muted);letter-spacing:1.4px;margin-left:2px;">KM</span></div>
          <div class="plate" style="margin-top:8px;padding:7px 13px 7px 9px;display:flex;align-items:center;gap:8px;width:fit-content;">
            ${COIN}<span class="num" style="font-size:19px;color:var(--gold);">128</span></div>
        </div>`).join('')}
      </div>
      <div style="margin-top:22px;font-size:11px;color:var(--muted);max-width:500px;line-height:1.5;">
        The plate carries its own ground &mdash; 86% opaque ink, hard black border, inset warm highlight.
        The road is free to run light underneath without the readout ever dropping out.
      </div>`
  },
  {
    path: 'hud/powerup-pill.html', group: 'HUD',
    name: 'Power-up pill', subtitle: 'Draining timer, one per active effect', w: 480, h: 320,
    body: `
      <div class="cap">ACTIVE EFFECTS &mdash; STACK VERTICALLY</div>
      <div style="display:flex;flex-direction:column;gap:9px;width:fit-content;">
        ${[['SHIELD', 'var(--cyan)', '#35D6F2', SHIELD('#35D6F2', 17), 72, '5.8', '#8BE9FA'],
           ['SLOW-MO', '#8BE9FA', '#8BE9FA', CLOCK('#8BE9FA', 17), 41, '3.2', '#CFF6FE'],
           ['MAGNET', 'var(--magenta)', '#F2359B', MAGNET('#F2359B', 17), 88, '7.1', '#FF8FC8']]
          .map(([n, col, glow, icon, pct, t, hi]) => `
        <div style="display:flex;align-items:center;gap:9px;padding:7px 12px;border-radius:9px;
             background:rgba(10,8,6,.88);border:2px solid #000;box-shadow:0 3px 0 #000, 0 0 20px ${glow}44;">
          ${icon}
          <div><div style="font-size:9px;font-weight:900;letter-spacing:2px;color:${col};">${n}</div>
            <div style="width:78px;height:5px;margin-top:4px;border-radius:3px;background:#0B0908;border:1px solid #000;overflow:hidden;">
              <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,${hi},${col});"></div></div></div>
          <span class="num" style="font-size:13px;color:${col};">${t}</span></div>`).join('')}
      </div>
      <div style="margin-top:22px;font-size:11px;color:var(--muted);max-width:380px;line-height:1.5;">
        The bar drains left to right and the numeral counts down &mdash; two channels for the same fact,
        because the bar alone is unreadable in peripheral vision while steering.
      </div>`
  },
  {
    path: 'hud/combo.html', group: 'HUD',
    name: 'Combo burst', subtitle: 'Mid-screen multiplier, above the thumb zone', w: 480, h: 380,
    body: `
      <div class="cap">FIRES ON A NEAR MISS, DECAYS AFTER ~2s</div>
      <div style="position:relative;height:230px;border-radius:13px;border:2px solid #000;overflow:hidden;
           background:linear-gradient(180deg,#1C1A17,#2B2823 30%,#26241F);display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;left:50%;top:50%;width:250px;height:250px;margin:-125px 0 0 -125px;
             background:radial-gradient(circle,rgba(247,117,3,.45),rgba(247,117,3,0) 62%);"></div>
        <div style="position:relative;text-align:center;transform:rotate(-7deg);">
          <div style="font-family:var(--display);font-size:82px;line-height:.9;color:var(--lite);
               text-shadow:5px 6px 0 #000, 0 0 34px rgba(247,117,3,.85);">&times;5</div>
          <div style="margin-top:2px;font-size:11px;font-weight:900;letter-spacing:3.4px;color:var(--orange);
               text-shadow:2px 2px 0 #000;">ON FIRE</div></div>
      </div>
      <div style="margin-top:20px;font-size:11px;color:var(--muted);max-width:400px;line-height:1.5;">
        Anchored at ~44% of screen height. It must never drift below the thumb zone line &mdash;
        a burst under the player&rsquo;s own hand is a burst nobody sees.
      </div>`
  },
  {
    path: 'game/pickups.html', group: 'Game Objects',
    name: 'Pickups', subtitle: 'World token → HUD icon, four types', w: 620, h: 430,
    body: `
      <style>.tok{position:relative;width:74px;height:74px;flex:none;border-radius:50%;border:3px solid #000;
        display:flex;align-items:center;justify-content:center;}
        .hud{width:42px;height:42px;flex:none;border-radius:9px;background:rgba(10,8,6,.9);border:2px solid #000;
        box-shadow:0 3px 0 #000, inset 0 1px 0 rgba(255,183,101,.16);display:flex;align-items:center;justify-content:center;}
        .pu{display:flex;align-items:center;gap:16px;}
        .arrow{color:#3E362F;font-size:15px;font-weight:900;}</style>
      <div class="cap">WORLD FORM (74px ON ROAD) &rarr; HUD FORM (42px)</div>
      <div style="display:flex;flex-direction:column;gap:26px;">
        <div class="pu">${token('#B8F2FF,#35D6F2 46%,#0E7E96 100%', SHIELD('#062B34', 36), 'rgba(53,214,242,.55)')}
          <span class="arrow">&rarr;</span><div class="hud">${SHIELD('#35D6F2')}</div>
          <div><div style="font-family:var(--display);font-size:19px;color:var(--cyan);">SHIELD</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px;">Survive one crash. 8s.</div></div></div>
        <div class="pu">${token('#E4FBFF,#8BE9FA 46%,#2F7D93 100%', CLOCK('#0A2C36', 36), 'rgba(139,233,250,.5)')}
          <span class="arrow">&rarr;</span><div class="hud">${CLOCK('#8BE9FA')}</div>
          <div><div style="font-family:var(--display);font-size:19px;color:#8BE9FA;">SLOW-MO</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px;">Traffic to 55%. 5s.</div></div></div>
        <div class="pu">${token('#FFC2E1,#F2359B 46%,#8C0A4F 100%', MAGNET('#3B0323', 36), 'rgba(242,53,155,.5)')}
          <span class="arrow">&rarr;</span><div class="hud">${MAGNET('#F2359B')}</div>
          <div><div style="font-family:var(--display);font-size:19px;color:var(--magenta);">MAGNET</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px;">Pulls coins 3 lanes wide. 10s.</div></div></div>
        <div class="pu">${token('#FFF0BE,#FFC93C 46%,#B8790A 100%', `<svg viewBox="0 0 24 24" width="30" height="30"><circle cx="12" cy="12" r="7" fill="none" stroke="#7A4E05" stroke-width="2"/><path d="M9 12h6M12 9v6" stroke="#7A4E05" stroke-width="2.2" stroke-linecap="round"/></svg>`, 'rgba(255,201,60,.55)')}
          <span class="arrow">&rarr;</span><div class="hud">${COIN}</div>
          <div><div style="font-family:var(--display);font-size:19px;color:var(--gold);">COIN</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px;">Garage currency. Never blocks a lane.</div></div></div>
      </div>`
  },
  {
    path: 'game/road.html', group: 'Game Objects',
    name: 'Road surface', subtitle: '4 lanes at 393pt — real footprints, real slack', w: 560, h: 470,
    body: `
      <div class="cap">393pt &divide; 4 = 98pt PER LANE &mdash; DIVIDERS AT 98.25 / 196.5 / 294.75</div>
      <div style="position:relative;width:393px;height:300px;border:2px solid #000;border-radius:11px;overflow:hidden;
           background:linear-gradient(180deg,#1C1A17,#2B2823 18%,#26241F 60%,#221F1B);">
        ${[98.25, 196.5, 294.75].map(x => `<div style="position:absolute;left:${x}px;top:-30px;bottom:-30px;width:7px;
          margin-left:-3.5px;opacity:.88;background:repeating-linear-gradient(180deg,var(--lane) 0 48px,rgba(0,0,0,0) 48px 112px);"></div>`).join('')}
        <div style="position:absolute;left:0;top:-30px;bottom:-30px;width:11px;opacity:.8;
             background:repeating-linear-gradient(180deg,var(--lane) 0 28px,#B8342C 28px 56px);"></div>
        <div style="position:absolute;right:0;top:-30px;bottom:-30px;width:11px;opacity:.8;
             background:repeating-linear-gradient(180deg,var(--lane) 0 28px,#B8342C 28px 56px);"></div>
        ${[[49,46,'HATPIN 46'],[147,62,'TRAFFIC 62'],[245,72,'BOARHOUND 72'],[344,74,'COLD STORE 74']].map(([c,w,l]) => `<div style="position:absolute;left:${c}px;top:126px;width:${w}px;height:46px;
          margin-left:${-w/2}px;border:2px dashed rgba(255,183,101,.55);border-radius:6px;
          display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;
          letter-spacing:.8px;color:var(--lite);text-align:center;">${l}</div>`).join('')}
      </div>
      <div style="margin-top:20px;font-size:11px;color:var(--muted);max-width:393px;line-height:1.55;">
        The dashed boxes are real vehicle footprints dropped into a 98pt lane. Width is not one
        number &mdash; it runs 46pt (Hatpin) to 76pt (Leviathan), and the slack left over is the
        player&rsquo;s margin for error. See <b style="color:var(--cream);">Vehicle fleet</b> for the full set.
      </div>`
  },
  {
    path: 'cards/car-card.html', group: 'Cards',
    name: 'Car card', subtitle: 'Locked / owned / equipped, with stat meters', w: 640, h: 480,
    body: `
      <div class="cap">LOCKED (PURCHASABLE) / OWNED / EQUIPPED</div>
      <div class="rowx">
        <div style="flex:none;width:230px;border:3px solid #000;border-radius:17px;padding:16px;
             background:linear-gradient(180deg,#1F1A15,#120F0C);
             box-shadow:0 7px 0 #000, inset 0 1px 0 rgba(255,183,101,.14);">
          <div class="chip" style="background:#2E1512;color:#FF9A93;">LOCKED</div>
          <div style="margin-top:14px;font-family:var(--display);font-size:25px;line-height:1;color:var(--lite);">BOARHOUND</div>
          <div style="margin-top:3px;font-size:10px;font-weight:800;letter-spacing:2.2px;color:var(--muted);">WIDEBODY &middot; 72PT</div>
          <div style="margin-top:15px;display:flex;flex-direction:column;gap:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-size:9.5px;font-weight:900;letter-spacing:2.1px;color:var(--muted);">SPEED</span>${pips(6)}</div>
            <div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-size:9.5px;font-weight:900;letter-spacing:2.1px;color:var(--muted);">HANDLING</span>${pips(3)}</div>
            <div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-size:9.5px;font-weight:900;letter-spacing:2.1px;color:var(--muted);">GRIP</span>${pips(4)}</div>
          </div>
          <div style="margin-top:16px;display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;
               background:rgba(255,201,60,.1);border:2px solid #000;width:fit-content;">
            ${COIN}<span class="num" style="font-size:18px;color:var(--gold);">1,200</span></div>
        </div>
        <div style="flex:none;width:170px;border:3px solid #000;border-radius:17px;padding:16px;opacity:.72;
             background:linear-gradient(180deg,#1F1A15,#120F0C);box-shadow:0 7px 0 #000;">
          <div class="chip" style="background:#2A2118;color:var(--lite);">OWNED</div>
          <div style="margin-top:14px;font-family:var(--display);font-size:20px;line-height:1.05;color:var(--cream);">HATPIN</div>
        </div>
        <div style="flex:none;width:170px;border:3px solid #000;border-radius:17px;padding:16px;
             background:linear-gradient(180deg,#1F1A15,#120F0C);
             box-shadow:0 7px 0 #000, 0 0 24px rgba(127,229,155,.18);">
          <div class="chip" style="background:#1D3A22;color:#7FE59B;">EQUIPPED</div>
          <div style="margin-top:14px;font-family:var(--display);font-size:20px;line-height:1.05;color:var(--cream);">STRAY CAT</div>
        </div>
      </div>`
  },
  {
    path: 'cards/stat-meter.html', group: 'Cards',
    name: 'Stat meter & chips', subtitle: 'Six-pip meter, three ownership states', w: 520, h: 330,
    body: `
      <div class="cap">SIX-PIP METER</div>
      <div style="display:flex;flex-direction:column;gap:10px;max-width:300px;">
        ${[['SPEED', 5], ['HANDLING', 3], ['GRIP', 4], ['BRAKING', 2]].map(([n, v]) => `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:9.5px;font-weight:900;letter-spacing:2.1px;color:var(--muted);">${n}</span>${pips(v)}</div>`).join('')}
      </div>
      <div style="margin-top:14px;font-size:11px;color:var(--muted);max-width:340px;line-height:1.5;">
        Six discrete pips, never a continuous bar &mdash; players compare cars by counting, and
        a smooth fill hides small differences.
      </div>
      <div class="cap" style="margin-top:28px;">OWNERSHIP CHIPS</div>
      <div class="rowx">
        <span class="chip" style="background:#1D3A22;color:#7FE59B;">EQUIPPED</span>
        <span class="chip" style="background:#2A2118;color:var(--lite);">OWNED</span>
        <span class="chip" style="background:#2E1512;color:#FF9A93;">LOCKED</span>
      </div>`
  }
];

let n = 0;
for (const c of components) {
  const file = join(OUT, c.path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `<!-- @dsCard group="${c.group}" -->
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${c.name} — Burning Rubber</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Underdog&family=Outfit:wght@400;500;600;700;800;900&display=swap">
<style>${TOKENS}</style>
</head>
<body>
${c.body}
</body>
</html>
`);
  n++;
}
writeFileSync(join(OUT, 'assets.json'), JSON.stringify(
  components.map(c => ({ name: c.name, path: c.path, subtitle: c.subtitle, group: c.group, viewport: { width: c.w, height: c.h } })), null, 2));
console.log(`wrote ${n} components to ${OUT}`);
