import { PLAYERS } from '../game/fleet';
import straycatUrl from '../assets/cars/straycat.svg';
import { html, on, raw } from './dom';
import type { Ctx, ScreenDef } from './router';

/* ---------------- shared fragments ---------------- */

const COIN = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
  <circle cx="12" cy="12" r="9.4" fill="#C98A0E"/>
  <circle cx="12" cy="12" r="9.4" fill="none" stroke="#6B4708" stroke-width="1.6"/>
  <circle cx="12" cy="12" r="6.4" fill="#FFC93C"/>
  <path d="M9.4 12h5.2M12 9.4v5.2" stroke="#8A5B08" stroke-width="1.9" stroke-linecap="round"/></svg>`;

const BACK_ICON = `<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="#F28D35"
  stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14.6 5.4 8 12l6.6 6.6"/></svg>`;

/** The tagline's O is a tyre — the one piece of 2019 worth keeping. */
const TYRE = `<svg viewBox="0 0 40 40" width="18" height="18" style="vertical-align:-3px">
  <circle cx="20" cy="20" r="18.5" fill="#131110"/>
  <circle cx="20" cy="20" r="15" fill="none" stroke="#2E2A26" stroke-width="5.5" stroke-dasharray="3 4.4"/>
  <circle cx="20" cy="20" r="9.6" fill="#B7B1A8"/>
  <g stroke="#7C776F" stroke-width="2" stroke-linecap="round">
    <line x1="20" y1="11" x2="20" y2="29"/><line x1="11" y1="20" x2="29" y2="20"/>
    <line x1="13.6" y1="13.6" x2="26.4" y2="26.4"/><line x1="26.4" y1="13.6" x2="13.6" y2="26.4"/>
  </g></svg>`;

const header = (title: string): string => html`
  <header class="garage__head">
    <button class="icon-btn" data-back aria-label="Back">${raw(BACK_ICON)}</button>
    <div class="garage__title">${title}</div>
  </header>
`;

const wordmark = (scale = 1): string => html`
  <div class="wordmark" style="--s:${scale};">
    <div class="wordmark__top">BURNING</div>
    <div class="wordmark__bottom">RUBBER</div>
    <div class="wordmark__tag">&ldquo;FEAR THE R${raw(TYRE)}AD&rdquo;</div>
  </div>
`;

/** Marks a screen whose design exists but whose content is not built yet. */
const placeholder = (note: string): string => html`
  <div class="stub">
    <div class="stub__mark">NOT BUILT YET</div>
    <p class="stub__note">${note}</p>
  </div>
`;

const bindBack = (root: HTMLElement, ctx: Ctx): void => on(root, '[data-back]', 'click', ctx.back);

/* ---------------- screens ---------------- */

export const splash: ScreenDef = {
  bind: (root, ctx) =>
    on(root, '[data-start]', 'click', () => ctx.go(ctx.state.onboarded ? 'menu' : 'onboarding')),
  view: () => html`
    <div class="screen screen--centred" data-start>
      <div class="glow"></div>
      ${raw(wordmark(1.15))}
      <div class="splash__hint">TAP TO START</div>
      <div class="scan"></div>
    </div>
  `
};

export const menu: ScreenDef = {
  bind: (root, ctx) => {
    on(root, '[data-play]', 'click', () => ctx.go('run'));
    on(root, '[data-go]', 'click', (el) => ctx.go(el.dataset.go as never));
  },
  view: (ctx) => html`
    <div class="screen">
      <div class="glow"></div>
      <div class="menu__strip">
        <div class="plate menu__best">
          <div class="lbl">BEST</div>
          <div class="num" style="font-size:22px;color:var(--lite);">
            ${ctx.state.best.toLocaleString()}
          </div>
        </div>
        <div class="plate garage__coins">
          ${raw(COIN)}
          <span class="num" style="font-size:20px;color:var(--gold);">
            ${ctx.state.coins.toLocaleString()}
          </span>
        </div>
      </div>

      ${raw(wordmark())}

      <div class="menu__actions">
        <button class="btn btn--primary" data-play style="height:88px;font-size:40px;">PLAY</button>
        <div class="menu__row">
          <button class="btn btn--secondary" data-go="garage">GARAGE</button>
          <button class="btn btn--secondary" data-go="shop">SHOP</button>
        </div>
        <div class="menu__row">
          <button class="btn btn--secondary" data-go="daily">DAILY</button>
          <button class="btn btn--secondary" data-go="settings">SETTINGS</button>
        </div>
        <button class="btn btn--secondary" data-go="credits" style="height:48px;font-size:17px;">
          CREDITS
        </button>
      </div>
      <div class="scan"></div>
    </div>
  `
};

export const onboarding: ScreenDef = {
  bind: (root, ctx) =>
    on(root, '[data-done]', 'click', () => {
      ctx.save({ onboarded: true });
      ctx.go('menu');
    }),
  view: () => html`
    <div class="screen">
      <div class="glow"></div>
      <div class="onboard__eyebrow">HOW IT WORKS</div>
      <h1 class="onboard__title">DRAG TO STEER</h1>
      <div class="onboard__demo">
        <div class="onboard__lane"></div>
        <div class="onboard__lane" style="left:50%;"></div>
        <div class="onboard__lane" style="left:75%;"></div>
        <img class="onboard__car" src="${straycatUrl}" alt="" />
        <div class="onboard__finger"></div>
        <div class="onboard__zone">THUMB ZONE &mdash; BOTTOM 35%</div>
      </div>
      <p class="onboard__copy">
        Hold your thumb anywhere near the bottom and slide. The car tracks your finger &mdash; no
        buttons, no lifting off.
      </p>
      <div class="garage__actions">
        <button class="btn btn--primary" data-done>GOT IT</button>
      </div>
      <div class="scan"></div>
    </div>
  `
};

const toggleRow = (key: 'haptics' | 'music' | 'sfx', label: string, on_: boolean): string => html`
  <div class="row">
    <span class="row__label${on_ ? '' : ' row__label--off'}">${label}</span>
    <button
      class="sw${on_ ? ' sw--on' : ''}"
      data-toggle="${key}"
      role="switch"
      aria-checked="${on_}"
      aria-label="${label}"
    >
      <span class="sw__knob"></span>
    </button>
  </div>
`;

export const settings: ScreenDef = {
  bind: (root, ctx) => {
    bindBack(root, ctx);
    on(root, '[data-toggle]', 'click', (el) => {
      const key = el.dataset.toggle as 'haptics' | 'music' | 'sfx';
      ctx.save({ [key]: !ctx.state[key] });
    });
    on(root, '[data-reset]', 'click', () => ctx.open('resetConfirm'));
  },
  view: (ctx) => html`
    <div class="screen">
      <div class="glow"></div>
      ${raw(header('SETTINGS'))}

      <div class="section">
        <div class="section__title">AUDIO &amp; FEEL</div>
        ${raw(toggleRow('music', 'MUSIC', ctx.state.music))}
        ${raw(toggleRow('sfx', 'SOUND FX', ctx.state.sfx))}
        ${raw(toggleRow('haptics', 'HAPTICS', ctx.state.haptics))}
        <p class="section__note">
          No audio ships yet &mdash; the original files had unclear licensing and were removed.
        </p>
      </div>

      <div class="section">
        <div class="section__title">STEERING</div>
        <p class="section__note">
          Touch anywhere and drag. The car moves as far as your thumb does, so you
          can hold low and wide of it and still see the road ahead.
        </p>
      </div>

      <div class="settings__danger">
        <button class="btn btn--danger" data-reset>RESET PROGRESS</button>
        <p class="settings__version">BURNING RUBBER &middot; V2.0.0</p>
      </div>
      <div class="scan"></div>
    </div>
  `
};

export const credits: ScreenDef = {
  bind: bindBack,
  view: () => html`
    <div class="screen">
      <div class="glow"></div>
      ${raw(header('CREDITS'))}
      <div class="section" style="gap:11px;">
        ${raw(
          (
            [
              ['BUILT BY', 'Adonis D Martin', 'Design, code, and the original 2019 game', false],
              ['VEHICLE ART', 'Original to this game', 'Nine chassis drawn as SVG', false],
              ['DISPLAY TYPE', 'Underdog', 'Google Fonts &middot; SIL OFL 1.1', false],
              ['INTERFACE TYPE', 'Outfit', 'Google Fonts &middot; SIL OFL 1.1', false],
              ['AUDIO', '[NEEDS LICENSING]', 'Must be sourced before release', true]
            ] as const
          )
            .map(
              ([l, v, n, warn]) => `<div class="row row--stacked">
                <div class="lbl">${l}</div>
                <div class="row__value${warn ? ' row__value--warn' : ''}">${v}</div>
                <div class="row__note">${n}</div></div>`
            )
            .join('')
        )}
      </div>
      <p class="settings__version">&copy; 2026 ADONIS D MARTIN</p>
      <div class="scan"></div>
    </div>
  `
};

export const shop: ScreenDef = {
  bind: bindBack,
  view: () => html`
    <div class="screen">
      <div class="glow"></div>
      ${raw(header('SHOP'))}
      ${raw(
        placeholder(
          'Designed in Claude Design as part of Garage.dc.html — power-up bundles bought with coins: shield, slow-mo, magnet. Not implemented, because none of those power-ups exist in the game loop yet.'
        )
      )}
      <div class="scan"></div>
    </div>
  `
};

export const daily: ScreenDef = {
  bind: bindBack,
  view: () => html`
    <div class="screen">
      <div class="glow"></div>
      ${raw(header('DAILY'))}
      ${raw(
        placeholder(
          'A seeded challenge with a fixed objective and a streak counter. Needs a deterministic RNG in the game loop before the objective can mean anything.'
        )
      )}
      <div class="scan"></div>
    </div>
  `
};

export const summary: ScreenDef = {
  bind: (root, ctx) => {
    on(root, '[data-retry]', 'click', () => ctx.go('run'));
    on(root, '[data-go]', 'click', (el) => ctx.go(el.dataset.go as never));
  },
  view: (ctx) => {
    const last = ctx.state.lastRun ?? {
      bestCombo: 1,
      coins: 0,
      distance: 0,
      isBest: false,
      score: 0
    };
    return html`
      <div class="screen">
        <div class="glow"></div>
        <h1 class="summary__title">WRECKED!</h1>
        ${raw(last.isBest ? '<div class="summary__badge">NEW BEST!</div>' : '')}
        <div class="summary__score">
          <div class="lbl">FINAL SCORE</div>
          <div class="summary__value">${Math.floor(last.score).toLocaleString()}</div>
          <div class="summary__best">BEST ${ctx.state.best.toLocaleString()}</div>
        </div>
        <div class="section">
          <div class="row">
            <span class="lbl">DISTANCE</span>
            <span class="num" style="font-size:22px;">${(last.distance / 1000).toFixed(2)} KM</span>
          </div>
          <div class="row">
            <span class="lbl">COINS EARNED</span>
            <span class="num" style="font-size:22px;color:var(--gold);">+${last.coins}</span>
          </div>
          <div class="row">
            <span class="lbl">BEST COMBO</span>
            <span class="num" style="font-size:22px;color:var(--orange);">×${last.bestCombo ?? 1}</span>
          </div>
        </div>
        <div class="garage__actions">
          <button class="btn btn--primary" data-retry>RETRY</button>
          <div class="menu__row">
            <button class="btn btn--secondary" data-go="garage">GARAGE</button>
            <button class="btn btn--secondary" data-go="menu">MENU</button>
          </div>
        </div>
        <div class="scan"></div>
      </div>
    `;
  }
};

/* ---------------- overlays ---------------- */

export const pause: ScreenDef = {
  bind: (root, ctx) => {
    on(root, '[data-resume]', 'click', ctx.close);
    on(root, '[data-restart]', 'click', () => ctx.go('run'));
    on(root, '[data-go]', 'click', (el) => ctx.go(el.dataset.go as never));
  },
  view: () => html`
    <div class="overlay">
      <div class="overlay__panel">
        <h2 class="overlay__title">PAUSED</h2>
        <div class="garage__actions">
          <button class="btn btn--primary" data-resume>RESUME</button>
          <button class="btn btn--secondary" data-restart>RESTART</button>
          <button class="btn btn--secondary" data-go="settings">SETTINGS</button>
          <button class="btn btn--secondary" data-go="menu">QUIT</button>
        </div>
      </div>
    </div>
  `
};

export const resetConfirm: ScreenDef = {
  bind: (root, ctx) => {
    on(root, '[data-keep]', 'click', ctx.close);
    on(root, '[data-wipe]', 'click', () => {
      ctx.save({
        best: 0,
        coins: 0,
        equipped: 'straycat',
        onboarded: true,
        owned: ['straycat']
      });
      ctx.close();
    });
  },
  view: (ctx) => html`
    <div class="overlay">
      <div class="overlay__panel overlay__panel--danger">
        <h2 class="overlay__title overlay__title--danger">RESET PROGRESS?</h2>
        <p class="overlay__copy">
          This erases your best score of <b>${ctx.state.best.toLocaleString()}</b>,
          <b>${ctx.state.coins.toLocaleString()} coins</b>, and every car you have unlocked.
        </p>
        <p class="overlay__warn">THIS CANNOT BE UNDONE</p>
        <div class="garage__actions">
          <!-- the safe action is the primary; destroying takes the deliberate tap -->
          <button class="btn btn--primary" data-keep>KEEP MY PROGRESS</button>
          <button class="btn btn--danger" data-wipe>RESET EVERYTHING</button>
        </div>
      </div>
    </div>
  `
};

export const unlock: ScreenDef = {
  bind: (root, ctx) => on(root, '[data-close]', 'click', ctx.close),
  view: (ctx) => {
    const car = PLAYERS[ctx.state.equipped];
    return html`
      <div class="overlay">
        <div class="overlay__panel">
          <div class="summary__badge">UNLOCKED!</div>
          <img class="unlock__art" src="${car.url}" alt="${car.name}" />
          <h2 class="overlay__title">${car.name}</h2>
          <p class="overlay__copy">${car.klass} &middot; ${car.width}PT wide</p>
          <div class="garage__actions">
            <button class="btn btn--primary" data-close>DRIVE IT</button>
          </div>
        </div>
      </div>
    `;
  }
};
