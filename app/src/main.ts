import './style.css';
import './ui/ui.css';
import * as screens from './ui/screens';
import { SPRITE_MANIFEST, type VehicleId } from './game/fleet';
import { createGame, type Game } from './game/game';
import { createLoop } from './engine/loop';
import { createRouter, type Route, type ScreenDef } from './ui/router';
import { createStage } from './engine/canvas';
import { exposeDebugState } from './game/debug';
import { garage, showCar } from './ui/garage';
import { loadSprites } from './engine/sprites';
import { loadState, saveState } from './game/state';

const canvas = document.querySelector<HTMLCanvasElement>('#stage');
const ui = document.querySelector<HTMLElement>('#ui');
if (!canvas || !ui) throw new Error('#stage or #ui missing from the document');

const stage = createStage(canvas);

/** During a run the UI layer is transparent and only the pause button is live. */
const run: ScreenDef = {
  bind: (root, ctx) => {
    root.querySelector('[data-pause]')?.addEventListener('click', () => ctx.open('pause'));
  },
  view: () => `
    <div class="run-layer">
      <div class="run-layer__frame">
      <button class="icon-btn run-layer__pause" data-pause aria-label="Pause">
        <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true">
          <rect x="6.5" y="4.5" width="4.2" height="15" rx="1.6" fill="#F5EFE4"/>
          <rect x="13.3" y="4.5" width="4.2" height="15" rx="1.6" fill="#F5EFE4"/>
        </svg>
      </button>
      </div>
    </div>`
};

const boot = async (): Promise<void> => {
  const [sprites, initial] = await Promise.all([
    loadSprites<VehicleId>(SPRITE_MANIFEST, stage.dpr),
    loadState()
  ]);

  let game: Game | null = null;
  let loop: ReturnType<typeof createLoop> | null = null;

  const router = createRouter({
    initial: 'splash',
    // an overlay over a run must stop the clock — otherwise you can crash
    // while the pause menu is up, which is what shipped before
    onOverlay: (overlay) => {
      if (router.route !== 'run') return;
      if (overlay) loop?.stop();
      else loop?.start();
    },
    onRoute: (route) => onRoute(route),
    overlays: {
      pause: screens.pause,
      resetConfirm: screens.resetConfirm,
      unlock: screens.unlock
    },
    persist: saveState,
    root: ui,
    screens: {
      credits: screens.credits,
      daily: screens.daily,
      garage,
      menu: screens.menu,
      onboarding: screens.onboarding,
      run,
      settings: screens.settings,
      shop: screens.shop,
      splash: screens.splash,
      summary: screens.summary
    },
    state: initial
  });

  /** Tear down the previous run and start a fresh one with the equipped car. */
  const startRun = (): void => {
    loop?.stop();
    game = createGame({
      car: router.state.equipped,
      onCrash: () => finishRun(),
      sprites,
      stage
    });
    game.bind(canvas);
    const active = game;
    loop = createLoop(active.update, () => active.render(loop?.fps() ?? 0));
    loop.start();
  };

  const finishRun = (): void => {
    if (!game) return;
    loop?.stop();
    const score = Math.floor(game.score);
    const isBest = score > router.state.best;
    router.save({
      best: Math.max(router.state.best, score),
      coins: router.state.coins + game.coins,
      lastRun: { coins: game.coins, distance: game.distance, isBest, score }
    });
    router.go('summary');
  };

  const onRoute = (route: Route): void => {
    ui.dataset.route = route;
    if (route === 'run') startRun();
    else loop?.stop();
    if (route === 'garage') showCar(router.state.equipped);
  };

  router.start();

  exposeDebugState(() => ({
    counting: game?.counting ?? false,
    crashed: game?.crashed ?? false,
    distance: game?.distance ?? 0,
    overlay: router.overlay,
    route: router.route,
    score: game?.score ?? 0
  }));

  // backgrounding stops rAF; resume only if a run is actually in progress
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) loop?.stop();
    else if (router.route === 'run' && !router.overlay) loop?.start();
  });
};

void boot();
