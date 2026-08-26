// The screens and states the first pass left dangling: a menu button with no
// destination, an irreversible action with no confirm, a run that starts with
// no warning, and three branches the garage/daily screens never handled.
import { writeFileSync } from 'node:fs';

const TOKENS = `
    :root{
      --ink:#0A0806; --orange:#F28D35; --hot:#f77503; --lite:#FFB765;
      --cream:#F5EFE4; --muted:#9C9184; --gold:#FFC93C; --cyan:#35D6F2;
      --magenta:#F2359B; --red:#E4322B; --lane:#EFE9DC;
      --display:'Underdog','Chalkboard SE','Comic Sans MS',cursive;
      --ui:'Outfit','Avenir Next','Segoe UI',system-ui,sans-serif;
    }
    *{box-sizing:border-box;}
    body{margin:0;font-family:var(--ui);background:#000;color:var(--cream);-webkit-font-smoothing:antialiased;}
    a{color:var(--orange);} a:hover{color:var(--hot);}
    .screen{position:relative;width:393px;height:852px;overflow:hidden;background:var(--ink);}
    .scan{position:absolute;inset:0;z-index:90;pointer-events:none;
      background:repeating-linear-gradient(180deg,rgba(0,0,0,.22) 0 1px,rgba(0,0,0,0) 1px 3px);}
    .vig{position:absolute;inset:0;z-index:91;pointer-events:none;
      background:radial-gradient(125% 78% at 50% 46%,rgba(0,0,0,0) 38%,rgba(0,0,0,.62) 100%);}
    .plate{background:rgba(10,8,6,.86);border:2px solid #000;border-radius:9px;
      box-shadow:0 3px 0 #000, inset 0 1px 0 rgba(255,183,101,.18);}
    .lbl{font-size:9.5px;font-weight:800;letter-spacing:2.3px;color:var(--muted);}
    .num{font-weight:900;font-variant-numeric:tabular-nums;text-shadow:0 2px 0 rgba(0,0,0,.9);}
    .btn{border-radius:13px;border:3px solid #000;display:flex;align-items:center;
      justify-content:center;gap:10px;font-family:var(--display);letter-spacing:1.2px;}
    .prim{background:linear-gradient(180deg,#FFC684,var(--orange) 42%,var(--hot));color:#1A0F04;
      box-shadow:0 7px 0 #000, 0 12px 20px rgba(0,0,0,.5), inset 0 2px 0 rgba(255,255,255,.4);}
    .sec{background:linear-gradient(180deg,#241E17,#171310);color:var(--cream);
      box-shadow:0 6px 0 #000, inset 0 1px 0 rgba(255,183,101,.14);}
    .dash{position:absolute;top:-60px;bottom:-60px;width:7px;margin-left:-3.5px;opacity:.88;
      background:repeating-linear-gradient(180deg,var(--lane) 0 48px,rgba(0,0,0,0) 48px 112px);}
    .rumble{position:absolute;top:-60px;bottom:-60px;width:11px;opacity:.8;
      background:repeating-linear-gradient(180deg,var(--lane) 0 28px,#B8342C 28px 56px);}
    .row{display:flex;align-items:center;justify-content:space-between;padding:13px 16px;
      background:linear-gradient(180deg,#1C1712,#131009);border:2px solid #000;border-radius:12px;
      box-shadow:0 4px 0 #000, inset 0 1px 0 rgba(255,183,101,.12);}
    .burst{position:absolute;left:50%;top:50%;border-radius:50%;
      background:repeating-conic-gradient(from 0deg,rgba(247,117,3,.5) 0deg 5deg,rgba(0,0,0,0) 5deg 11deg);
      -webkit-mask-image:radial-gradient(circle,#000 20%,rgba(0,0,0,0) 62%);
      mask-image:radial-gradient(circle,#000 20%,rgba(0,0,0,0) 62%);}
`;

const COIN = (w = 20) => `<svg viewBox="0 0 24 24" width="${w}" height="${w}">
  <circle cx="12" cy="12" r="9.4" fill="#C98A0E"/><circle cx="12" cy="12" r="9.4" fill="none" stroke="#6B4708" stroke-width="1.6"/>
  <circle cx="12" cy="12" r="6.4" fill="#FFC93C"/><path d="M9.4 12h5.2M12 9.4v5.2" stroke="#8A5B08" stroke-width="1.9" stroke-linecap="round"/></svg>`;
const BACK = `<div style="width:48px;height:48px;flex:none;border-radius:11px;border:2px solid #000;
    background:linear-gradient(180deg,#241E17,#171310);box-shadow:0 4px 0 #000;
    display:flex;align-items:center;justify-content:center;">
  <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="#F28D35" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14.6 5.4 8 12l6.6 6.6"/></svg></div>`;
const ROAD = (extra = '') => `<div style="position:absolute;inset:0;background:linear-gradient(180deg,#1C1A17 0%,#2B2823 18%,#26241F 60%,#221F1B 100%);">
  <div class="dash" style="left:98.25px;"></div><div class="dash" style="left:196.5px;"></div>
  <div class="dash" style="left:294.75px;"></div>
  <div class="rumble" style="left:0;"></div><div class="rumble" style="right:0;"></div>${extra}</div>`;
const CAR = (slug, style) => `<img src="${slug}.svg" alt="" style="${style}">`;
const hdr = (t) => `<div style="width:361px;flex:none;display:flex;align-items:center;gap:12px;">
  ${BACK}<div style="flex:1 1 auto;font-family:var(--display);font-size:36px;color:var(--lite);text-shadow:3px 4px 0 #000;">${t}</div></div>`;

const SCREENS = {
  /* the menu's CREDITS button finally has somewhere to go */
  'Credits.dc.html': `
<div class="screen">
  <div style="position:absolute;left:50%;top:120px;width:620px;height:620px;margin-left:-310px;border-radius:50%;
    background:radial-gradient(circle,rgba(242,141,53,.14) 0%,rgba(0,0,0,0) 62%);"></div>
  <div style="position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;">
    <div style="height:66px;flex:none;"></div>
    ${hdr('CREDITS')}
    <div style="height:28px;flex:none;"></div>
    <div style="width:361px;flex:none;display:flex;flex-direction:column;gap:11px;">
      ${[['BUILT BY', 'Adonis D Martin', 'Design, code, and the original 2019 game'],
         ['VEHICLE ART', 'Original to this game', 'Nine chassis drawn as SVG for Burning Rubber'],
         ['DISPLAY TYPE', 'Underdog', 'Google Fonts &middot; SIL Open Font License 1.1'],
         ['INTERFACE TYPE', 'Outfit', 'Google Fonts &middot; SIL Open Font License 1.1'],
         ['AUDIO', '[NEEDS LICENSING]', 'Engine and crash loops must be replaced or licensed before release']]
        .map(([l, v, n]) => `<div class="row" style="flex-direction:column;align-items:flex-start;gap:4px;">
        <div class="lbl">${l}</div>
        <div style="font-size:17px;font-weight:800;color:${v.startsWith('[') ? 'var(--red)' : 'var(--cream)'};">${v}</div>
        <div style="font-size:11px;color:var(--muted);line-height:1.4;">${n}</div></div>`).join('')}
    </div>
    <div style="flex:1 1 auto;"></div>
    <div style="width:361px;flex:none;text-align:center;font-size:10px;font-weight:700;letter-spacing:2px;color:#5F5750;">
      BURNING RUBBER &nbsp;&middot;&nbsp; &copy; 2026 ADONIS D MARTIN</div>
    <div style="height:52px;flex:none;"></div>
  </div>
  <div class="scan"></div><div class="vig"></div>
</div>`,

  /* nothing used to sit between tapping PLAY and traffic arriving */
  'Countdown.dc.html': `
<div class="screen">
  ${ROAD(`<div style="position:absolute;left:0;right:0;top:0;height:340px;
    background:linear-gradient(180deg,rgba(10,8,6,.55),rgba(10,8,6,0));"></div>`)}
  ${CAR('traffic-sedan', 'position:absolute;left:18px;top:90px;width:62px;height:128px;opacity:.55;transform:rotate(180deg);filter:drop-shadow(0 12px 10px rgba(0,0,0,.6));')}
  ${CAR('traffic-van', 'position:absolute;left:309px;top:30px;width:70px;height:158px;opacity:.55;transform:rotate(180deg);filter:drop-shadow(0 12px 10px rgba(0,0,0,.6));')}
  ${CAR('straycat', 'position:absolute;left:117px;top:648px;width:60px;height:122px;filter:drop-shadow(0 8px 10px rgba(0,0,0,.65));')}

  <!-- HUD is present but dimmed: it fades up as the count ends -->
  <div style="position:absolute;left:16px;top:68px;z-index:40;opacity:.35;">
    <div class="plate" style="padding:9px 15px 10px;"><div class="lbl">SCORE</div>
      <div class="num" style="font-size:34px;line-height:1.02;color:var(--lite);">00,000</div></div>
  </div>
  <div style="position:absolute;right:16px;top:68px;z-index:40;opacity:.35;">
    <div class="plate" style="padding:7px 13px 7px 9px;display:flex;align-items:center;gap:8px;">
      ${COIN(19)}<span class="num" style="font-size:19px;color:var(--gold);">0</span></div>
  </div>

  <div style="position:absolute;left:50%;top:392px;transform:translateX(-50%);z-index:50;text-align:center;">
    <div class="burst" style="width:340px;height:340px;margin:-170px 0 0 -170px;opacity:.5;"></div>
    <div style="position:relative;font-family:var(--display);font-size:190px;line-height:.86;color:var(--lite);
      text-shadow:8px 9px 0 #000, 0 0 60px rgba(247,117,3,.85);">3</div>
    <div style="position:relative;margin-top:6px;font-size:12px;font-weight:900;letter-spacing:5px;
      color:var(--orange);text-shadow:2px 2px 0 #000;">GET READY</div>
  </div>
  <div style="position:absolute;left:50%;bottom:150px;transform:translateX(-50%);z-index:50;
    font-size:11px;font-weight:800;letter-spacing:2.6px;color:var(--muted);">HOLD ANYWHERE BELOW TO STEER</div>
  <div class="scan"></div><div class="vig"></div>
</div>`,

  /* the one irreversible action in the game */
  'ResetConfirm.dc.html': `
<div class="screen">
  <div style="position:absolute;inset:0;filter:blur(3.5px) saturate(.7);opacity:.5;">
    <div style="position:absolute;left:16px;top:110px;right:16px;height:62px;background:#1C1712;border:2px solid #000;border-radius:12px;"></div>
    <div style="position:absolute;left:16px;top:184px;right:16px;height:62px;background:#1C1712;border:2px solid #000;border-radius:12px;"></div>
    <div style="position:absolute;left:16px;top:258px;right:16px;height:62px;background:#1C1712;border:2px solid #000;border-radius:12px;"></div>
    <div style="position:absolute;left:16px;top:376px;right:16px;height:78px;background:#1C1712;border:2px solid #000;border-radius:12px;"></div>
  </div>
  <div style="position:absolute;inset:0;background:rgba(6,5,4,.76);"></div>

  <div style="position:absolute;inset:0;z-index:20;display:flex;align-items:center;justify-content:center;padding:0 22px;">
    <div style="width:100%;border-radius:18px;border:3px solid var(--red);padding:28px 24px 24px;
      background:linear-gradient(180deg,#1B100E,#120C0A);box-shadow:0 10px 0 #000, 0 0 44px rgba(228,50,43,.3);">
      <div style="display:flex;justify-content:center;">
        <div style="width:62px;height:62px;border-radius:50%;border:3px solid var(--red);
          background:rgba(228,50,43,.12);display:flex;align-items:center;justify-content:center;">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#E4322B" stroke-width="2.4" stroke-linecap="round">
            <path d="M12 7.4v6.2"/><path d="M12 17.4h.01"/><circle cx="12" cy="12" r="9.2"/></svg></div>
      </div>
      <div style="margin-top:18px;text-align:center;font-family:var(--display);font-size:34px;line-height:1.05;
        color:var(--red);text-shadow:3px 4px 0 #000;">RESET<br>PROGRESS?</div>
      <div style="margin-top:14px;text-align:center;font-size:14px;line-height:1.55;color:var(--muted);text-wrap:pretty;">
        This erases your best score of <b style="color:var(--cream);">13,110</b>,
        <b style="color:var(--gold);">1,240 coins</b>, and every car you have unlocked.
      </div>
      <div style="margin-top:12px;text-align:center;font-size:11px;font-weight:900;letter-spacing:2.4px;color:var(--red);">
        THIS CANNOT BE UNDONE</div>
      <!-- safe action is the primary; destroying takes the deliberate tap -->
      <div class="btn prim" style="margin-top:24px;height:62px;font-size:26px;">KEEP MY PROGRESS</div>
      <div class="btn" style="margin-top:13px;height:56px;font-size:21px;color:var(--red);
        background:transparent;border-color:var(--red);box-shadow:none;">RESET EVERYTHING</div>
    </div>
  </div>
  <div class="scan"></div><div class="vig"></div>
</div>`,

  /* garage only ever showed the affordable case */
  'CantAfford.dc.html': `
<div class="screen">
  <div style="position:absolute;left:50%;top:150px;width:620px;height:620px;margin-left:-310px;border-radius:50%;
    background:radial-gradient(circle,rgba(242,141,53,.12) 0%,rgba(0,0,0,0) 62%);"></div>
  <div style="position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;">
    <div style="height:66px;flex:none;"></div>
    <div style="width:361px;flex:none;display:flex;align-items:center;gap:12px;">
      ${BACK}<div style="flex:1 1 auto;font-family:var(--display);font-size:36px;color:var(--lite);text-shadow:3px 4px 0 #000;">GARAGE</div>
      <div class="plate" style="padding:8px 14px;display:flex;align-items:center;gap:8px;">
        ${COIN(19)}<span class="num" style="font-size:19px;color:var(--gold);">1,240</span></div>
    </div>
    <div style="height:30px;flex:none;"></div>

    <div style="width:265px;flex:none;border:3px solid #000;border-radius:17px;padding:18px;
      background:linear-gradient(180deg,#1F1A15,#120F0C);box-shadow:0 9px 0 #000;text-align:center;">
      <span style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:6px;
        border:2px solid #000;background:#2E1512;color:#FF9A93;font-size:9px;font-weight:900;letter-spacing:1.9px;">LOCKED</span>
      ${CAR('donkeywork', 'display:block;margin:16px auto 0;width:82px;height:171px;filter:drop-shadow(0 12px 12px rgba(0,0,0,.75)) grayscale(.6) brightness(.66);')}
      <div style="margin-top:12px;font-family:var(--display);font-size:26px;line-height:1;color:var(--lite);text-shadow:2px 3px 0 #000;">DONKEY WORK</div>
      <div style="margin-top:3px;font-size:10px;font-weight:800;letter-spacing:2.2px;color:var(--muted);">HAULER &middot; 68PT</div>
    </div>

    <div style="height:20px;flex:none;"></div>
    <div style="width:361px;flex:none;" class="plate">
      <div style="padding:14px 16px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <span class="lbl">YOUR COINS</span>
          <span class="num" style="font-size:17px;color:var(--muted);">1,240 / 1,800</span></div>
        <div style="margin-top:9px;height:9px;border-radius:5px;background:#0B0908;border:1px solid #000;overflow:hidden;">
          <div style="width:68.9%;height:100%;background:linear-gradient(90deg,#FFE9A8,var(--gold));"></div></div>
        <div style="margin-top:10px;text-align:center;font-size:12px;font-weight:900;letter-spacing:2px;color:var(--red);">
          560 COINS SHORT</div>
      </div>
    </div>

    <div style="flex:1 1 auto;"></div>
    <div style="width:337px;flex:none;">
      <div class="btn" style="height:74px;font-size:31px;color:#5A524A;
        background:linear-gradient(180deg,#211D19,#171310);box-shadow:0 4px 0 #000;">BUY &middot; 1,800</div>
      <div style="height:12px;"></div>
      <div class="btn sec" style="height:58px;font-size:21px;">EARN COINS</div>
    </div>
    <div style="height:52px;flex:none;"></div>
  </div>
  <div class="scan"></div><div class="vig"></div>
</div>`,

  /* tapping BUY used to lead nowhere */
  'Unlock.dc.html': `
<div class="screen">
  <div class="burst" style="width:760px;height:760px;margin:-380px 0 0 -380px;top:44%;opacity:.42;"></div>
  <div style="position:absolute;left:50%;top:44%;width:520px;height:520px;margin:-260px 0 0 -260px;border-radius:50%;
    background:radial-gradient(circle,rgba(247,117,3,.32) 0%,rgba(0,0,0,0) 66%);"></div>

  <div style="position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;">
    <div style="height:120px;flex:none;"></div>
    <div style="flex:none;padding:7px 24px;border-radius:8px;transform:rotate(-3deg);
      background:linear-gradient(180deg,var(--gold),#E09A0B);border:3px solid #000;
      box-shadow:0 5px 0 #000, 0 0 30px rgba(255,201,60,.55);">
      <span style="font-family:var(--display);font-size:24px;color:#2A1B02;letter-spacing:2px;">UNLOCKED!</span></div>

    ${CAR('boarhound', 'margin-top:34px;width:126px;height:224px;flex:none;filter:drop-shadow(0 18px 20px rgba(0,0,0,.8));')}

    <div style="margin-top:22px;flex:none;text-align:center;">
      <div style="font-family:var(--display);font-size:46px;line-height:1;color:var(--lite);text-shadow:4px 5px 0 #000;">BOARHOUND</div>
      <div style="margin-top:5px;font-size:11px;font-weight:800;letter-spacing:2.6px;color:var(--orange);">WIDEBODY &middot; 72PT</div>
    </div>

    <div style="margin-top:22px;width:337px;flex:none;display:flex;gap:9px;">
      ${[['SPEED', '6'], ['SLIMNESS', '2'], ['GRIP', '4']].map(([l, v]) => `
      <div class="plate" style="flex:1 1 0;padding:11px 8px;text-align:center;">
        <div class="lbl" style="font-size:8.5px;">${l}</div>
        <div class="num" style="font-size:22px;color:var(--lite);margin-top:3px;">${v}</div></div>`).join('')}
    </div>
    <div style="margin-top:12px;width:337px;flex:none;text-align:center;font-size:12px;line-height:1.5;color:var(--muted);">
      Fastest car in the game &mdash; but at 72pt it leaves only
      <b style="color:var(--cream);">26pt</b> of lane to spare.</div>

    <div style="flex:1 1 auto;"></div>
    <div style="width:337px;flex:none;">
      <div class="btn prim" style="height:74px;font-size:31px;">EQUIP NOW</div>
      <div style="height:12px;"></div>
      <div class="btn sec" style="height:58px;font-size:21px;">BACK TO GARAGE</div>
    </div>
    <div style="height:52px;flex:none;"></div>
  </div>
  <div class="scan"></div><div class="vig"></div>
</div>`,

  /* the daily challenge had no ending */
  'DailyResult.dc.html': `
<div class="screen">
  <div class="burst" style="width:640px;height:640px;margin:-320px 0 0 -320px;top:34%;opacity:.34;"></div>
  <div style="position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;">
    <div style="height:90px;flex:none;"></div>
    <div style="flex:none;font-size:10px;font-weight:900;letter-spacing:3.4px;color:var(--muted);">TODAY &middot; SEED 0826</div>
    <div style="margin-top:10px;flex:none;text-align:center;transform:rotate(-2.5deg);">
      <div style="font-family:var(--display);font-size:52px;line-height:1;color:#7FE59B;
        text-shadow:5px 6px 0 #000, 0 0 32px rgba(127,229,155,.45);">CHALLENGE<br>COMPLETE</div></div>

    <div style="margin-top:24px;width:337px;flex:none;" class="plate">
      <div style="padding:16px;text-align:center;">
        <div class="lbl">THREE LANES</div>
        <div style="margin-top:7px;font-size:14px;line-height:1.5;color:var(--cream);">
          Clear 2km without leaving lanes 1&ndash;3.</div>
      </div>
    </div>

    <div style="margin-top:14px;width:337px;flex:none;display:flex;flex-direction:column;gap:10px;">
      <div class="row"><span class="lbl">DISTANCE</span>
        <span class="num" style="font-size:23px;color:var(--cream);">2.4<span style="font-size:11px;color:var(--muted);"> KM</span></span></div>
      <div class="row"><span class="lbl">REWARD</span>
        <span style="display:flex;align-items:center;gap:8px;">${COIN(21)}
          <span class="num" style="font-size:23px;color:var(--gold);">+250</span></span></div>
      <div class="row"><span class="lbl">STREAK</span>
        <span style="display:flex;align-items:center;gap:5px;">
          ${[1, 1, 1, 1, 0, 0, 0].map((on) => `<i style="display:block;width:13px;height:13px;border-radius:3px;border:1.5px solid #000;
            background:${on ? 'linear-gradient(180deg,#FFB765,#f77503)' : '#2B241D'};"></i>`).join('')}
          <span class="num" style="font-size:17px;color:var(--lite);margin-left:6px;">4</span></span></div>
    </div>

    <div style="flex:1 1 auto;"></div>
    <div style="width:337px;flex:none;">
      <div class="btn prim" style="height:74px;font-size:31px;">CLAIM 250</div>
      <div style="height:12px;"></div>
      <div style="text-align:center;font-size:11px;font-weight:800;letter-spacing:2px;color:var(--muted);">
        NEXT CHALLENGE IN 9H 12M</div>
    </div>
    <div style="height:52px;flex:none;"></div>
  </div>
  <div class="scan"></div><div class="vig"></div>
</div>`
};

for (const [file, body] of Object.entries(SCREENS)) {
  writeFileSync(file, `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Underdog&family=Outfit:wght@400;500;600;700;800;900&display=swap">
  <style>${TOKENS}</style>
</helmet>
${body}
</x-dc>
<script data-dc-script data-props='{"$preview":{"width":393,"height":852}}'>
class Component extends DCLogic {}
</script>
</body>
</html>
`);
  console.log(`wrote ${file}`);
}
