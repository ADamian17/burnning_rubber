import './style.css';
import './ui/ui.css';
import { PLAYERS, SPRITE_MANIFEST, type VehicleId } from './game/fleet';
import { loadState, saveState, type SaveState } from './game/state';
import { createGame } from './game/game';
import { createGarage } from './ui/garage';
import { createLoop } from './engine/loop';
import { createStage } from './engine/canvas';
import { loadSprites } from './engine/sprites';

const canvas = document.querySelector<HTMLCanvasElement>('#stage');
const ui = document.querySelector<HTMLElement>('#ui');
if (!canvas || !ui) throw new Error('#stage or #ui missing from the document');

const stage = createStage(canvas);

const boot = async (): Promise<void> => {
  const [sprites, loaded] = await Promise.all([
    loadSprites<VehicleId>(SPRITE_MANIFEST, stage.dpr),
    loadState()
  ]);
  let state: SaveState = loaded;

  const game = createGame({ car: state.equipped, sprites, stage });
  game.bind(canvas);

  const persist = async (next: SaveState): Promise<void> => {
    state = next;
    await saveState(state);
    garage.render(ui, state);
  };

  const garage = createGarage({
    onBack: () => ui.removeAttribute('data-open'),
    onBuy: (id) => {
      const cost = PLAYERS[id].cost;
      if (state.coins < cost) return;
      void persist({
        ...state,
        coins: state.coins - cost,
        equipped: id,
        owned: [...state.owned, id]
      });
    },
    onEquip: (id) => void persist({ ...state, equipped: id })
  });

  // temporary: the garage is the only screen wired up, so open it on load
  garage.show(state.equipped);
  garage.render(ui, state);
  ui.setAttribute('data-open', '');

  canvas.addEventListener('pointerdown', () => {
    if (game.crashed) game.restart();
  });

  const loop = createLoop(game.update, () => game.render(loop.fps()));
  loop.start();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) loop.stop();
    else loop.start();
  });
};

void boot();
