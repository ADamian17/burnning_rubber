import './style.css';
import { createGame } from './game/game';
import { createLoop } from './engine/loop';
import { createStage } from './engine/canvas';
import { loadSprites } from './engine/sprites';
import { SPRITE_MANIFEST, type VehicleId } from './game/fleet';

const canvas = document.querySelector<HTMLCanvasElement>('#stage');
if (!canvas) throw new Error('#stage canvas missing from the document');

const stage = createStage(canvas);

const boot = async (): Promise<void> => {
  const sprites = await loadSprites<VehicleId>(SPRITE_MANIFEST, stage.dpr);
  const game = createGame({ car: 'straycat', sprites, stage });

  game.bind(canvas);
  canvas.addEventListener('pointerdown', () => {
    if (game.crashed) game.restart();
  });

  const loop = createLoop(game.update, () => game.render(loop.fps()));
  loop.start();

  // rAF stops when backgrounded; resume cleanly instead of simulating the gap
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) loop.stop();
    else loop.start();
  });
};

void boot();
