import { LANE_WIDTH } from '../game/constants';
import { PLAYERS, PLAYER_IDS, slimness, type PlayerCar, type PlayerId } from '../game/fleet';
import { html, on, raw } from './dom';
import type { Ctx, ScreenDef } from './router';
import type { SaveState } from '../game/state';

const COIN = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
  <circle cx="12" cy="12" r="9.4" fill="#C98A0E"/>
  <circle cx="12" cy="12" r="9.4" fill="none" stroke="#6B4708" stroke-width="1.6"/>
  <circle cx="12" cy="12" r="6.4" fill="#FFC93C"/>
  <path d="M9.4 12h5.2M12 9.4v5.2" stroke="#8A5B08" stroke-width="1.9" stroke-linecap="round"/></svg>`;

const chevron = (dir: 'left' | 'right'): string =>
  `<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="#F28D35"
        stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="${dir === 'left' ? 'M14.6 5.4 8 12l6.6 6.6' : 'M9.4 5.4 16 12l-6.6 6.6'}"/></svg>`;

const meter = (value: number): string =>
  `<span class="meter">${Array.from(
    { length: 6 },
    (_, i) => `<i class="pip${i < value ? ' pip--on' : ''}"></i>`
  ).join('')}</span>`;

const stat = (name: string, value: number): string =>
  html`<div class="garage__stat">
    <span class="garage__stat-name">${name}</span>${raw(meter(value))}
  </div>`;

type Ownership = 'equipped' | 'locked' | 'owned';

const ownership = (id: PlayerId, state: SaveState): Ownership =>
  state.equipped === id ? 'equipped' : state.owned.includes(id) ? 'owned' : 'locked';

/** Which car the carousel is showing. Module-level so it survives a re-render. */
let index = 0;

/** Jump the carousel to a specific car, e.g. the one just equipped. */
export const showCar = (id: PlayerId): void => {
  index = Math.max(0, PLAYER_IDS.indexOf(id));
};

/**
 * Car select.
 *
 * The screen's job is to make width legible as a trade. Speed, handling and
 * grip are authored stats; SLIMNESS is derived from width, and LANE ROOM
 * restates it as the concrete thing it buys — points of clearance either side
 * in a 98pt lane. A wide car is genuinely harder to drive, and this is where
 * the player is told so before they spend coins finding out.
 */
export const garage: ScreenDef = {
  view: (ctx: Ctx): string => {
    const state: SaveState = ctx.state;
    const id = PLAYER_IDS[index];
    const car: PlayerCar = PLAYERS[id];
    const owns = ownership(id, state);
    const slack = LANE_WIDTH - car.width;
    const shortfall = car.cost - state.coins;
    const affordable = shortfall <= 0;

    const action =
      owns === 'equipped'
        ? html`<div class="btn btn--primary btn--disabled">EQUIPPED</div>`
        : owns === 'owned'
          ? html`<button class="btn btn--primary" data-equip>EQUIP</button>`
          : affordable
            ? html`<button class="btn btn--primary" data-buy>
                BUY ${raw(COIN)} ${car.cost.toLocaleString()}
              </button>`
            : html`<div class="btn btn--primary btn--disabled">
                BUY ${raw(COIN)} ${car.cost.toLocaleString()}
              </div>`;

    return html`
      <div class="screen">
        <div class="glow"></div>

        <header class="garage__head">
          <button class="icon-btn" data-back aria-label="Back">${raw(chevron('left'))}</button>
          <div class="garage__title">GARAGE</div>
          <div class="plate garage__coins">
            ${raw(COIN)}
            <span class="num" style="font-size:19px;color:var(--gold);">
              ${state.coins.toLocaleString()}
            </span>
          </div>
        </header>

        <div class="garage__stage">
          <button class="icon-btn" data-prev aria-label="Previous car">
            ${raw(chevron('left'))}
          </button>

          <article class="garage__card">
            <span class="chip chip--${owns}">${owns.toUpperCase()}</span>
            <div class="garage__art-box">
              <img
                class="garage__art${owns === 'locked' ? ' garage__art--locked' : ''}"
                src="${car.url}"
                alt="${car.name}"
              />
            </div>
            <h1 class="garage__name">${car.name}</h1>
            <p class="garage__class">${car.klass} &middot; ${car.width}PT</p>

            <div class="garage__stats">
              ${raw(stat('SPEED', car.speed))} ${raw(stat('HANDLING', car.handling))}
              ${raw(stat('GRIP', car.grip))} ${raw(stat('SLIMNESS', slimness(car.width)))}
            </div>

            <div class="plate garage__slack">
              <span class="lbl">LANE ROOM</span>
              <span class="num" style="font-size:18px;color:var(--lite);">
                ${slack.toFixed(1)}PT
              </span>
            </div>
          </article>

          <button class="icon-btn" data-next aria-label="Next car">${raw(chevron('right'))}</button>
        </div>

        <div class="garage__pager">
          ${raw(
            PLAYER_IDS.map(
              (_, i) => `<span class="garage__dot${i === index ? ' garage__dot--on' : ''}"></span>`
            ).join('')
          )}
        </div>

        <div class="garage__actions">
          ${raw(action)}
          ${raw(
            owns === 'locked' && !affordable
              ? html`<p class="garage__short">${shortfall.toLocaleString()} COINS SHORT</p>`
              : ''
          )}
        </div>

        <div class="scan"></div>
      </div>
    `;
  },

  bind: (root: HTMLElement, ctx: Ctx): void => {
    const id = PLAYER_IDS[index];
    const car = PLAYERS[id];

    const step = (delta: number): void => {
      index = (index + delta + PLAYER_IDS.length) % PLAYER_IDS.length;
      ctx.refresh();
    };

    on(root, '[data-prev]', 'click', () => step(-1));
    on(root, '[data-next]', 'click', () => step(1));
    on(root, '[data-back]', 'click', ctx.back);
    on(root, '[data-equip]', 'click', () => ctx.save({ equipped: id }));
    on(root, '[data-buy]', 'click', () => {
      if (ctx.state.coins < car.cost) return;
      ctx.save({
        coins: ctx.state.coins - car.cost,
        equipped: id,
        owned: [...ctx.state.owned, id]
      });
      ctx.open('unlock');
    });

    // swipe the card, not just the arrows
    let startX = 0;
    const stage = root.querySelector<HTMLElement>('.garage__stage');
    stage?.addEventListener('pointerdown', (e) => {
      startX = e.clientX;
    });
    stage?.addEventListener('pointerup', (e) => {
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
    });
  }
};
