import type { SpriteSheet } from '../engine/sprites';
import type { Stage } from '../engine/canvas';
import {
  COLORS,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  FONT_DISPLAY,
  FONT_UI,
  HITBOX_INSET,
  LANE_WIDTH,
  THUMB_ZONE_TOP,
  laneCentre
} from './constants';
import { PLAYERS, TRAFFIC, TRAFFIC_IDS, type PlayerId, type TrafficId, type VehicleId } from './fleet';

interface Obstacle {
  id: TrafficId;
  length: number;
  width: number;
  x: number;
  y: number;
}

/** World scroll speed in points/second, ramping with distance survived. */
const BASE_SPEED = 420;
const MAX_SPEED = 980;
/** Distance in metres over which speed climbs from base to max. */
const RAMP_METRES = 2400;

/** Design points per in-game metre. */
const POINTS_PER_METRE = 26;

export interface GameOptions {
  readonly car: PlayerId;
  readonly sprites: SpriteSheet<VehicleId>;
  readonly stage: Stage;
}

export const createGame = ({ car, sprites, stage }: GameOptions) => {
  const player = PLAYERS[car];

  let coins = 0;
  let crashed = false;
  let distance = 0;
  let obstacles: Obstacle[] = [];
  let playerX = DESIGN_WIDTH / 2;
  let roadOffset = 0;
  let score = 0;
  let spawnTimer = 0;
  /** Where the finger wants the car; null means hold position. */
  let targetX: number | null = null;

  /* ---------------- input ---------------- */

  /**
   * Steering maps the finger's x directly onto the car, but the car chases it
   * at a capped rate so handling still means something — a Hatpin closes the
   * gap faster than a Donkey Work.
   */
  const scale = (): number => Math.min(stage.width / DESIGN_WIDTH, stage.height / DESIGN_HEIGHT);
  const originX = (): number => (stage.width - DESIGN_WIDTH * scale()) / 2;

  const pointerTo = (clientX: number): number => (clientX - originX()) / scale();

  const onPointer = (event: PointerEvent): void => {
    if (event.buttons === 0 && event.type === 'pointermove') return;
    targetX = pointerTo(event.clientX);
  };

  const bind = (canvas: HTMLCanvasElement): (() => void) => {
    const down = (e: PointerEvent): void => {
      canvas.setPointerCapture(e.pointerId);
      onPointer(e);
    };
    const up = (): void => {
      targetX = null;
    };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', onPointer);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    return () => {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', onPointer);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
    };
  };

  /* ---------------- simulation ---------------- */

  const speed = (): number =>
    Math.min(MAX_SPEED, BASE_SPEED + (MAX_SPEED - BASE_SPEED) * (distance / RAMP_METRES)) *
    (0.9 + player.speed * 0.035);

  /** Picks a lane and a vehicle, biasing toward heavier traffic as speed climbs. */
  const spawn = (): void => {
    const pressure = Math.min(1, distance / RAMP_METRES);
    const pool = TRAFFIC_IDS.filter((id) => TRAFFIC[id].threat <= 1 + Math.round(pressure * 4));
    const id = pool[Math.floor(Math.random() * pool.length)];
    const spec = TRAFFIC[id];
    const lane = Math.floor(Math.random() * 4);

    // never wall off every lane at once — leave the player somewhere to go
    const blocked = obstacles.filter((o) => o.y > -spec.length * 2 && o.y < 260).length;
    if (blocked >= 3) return;

    obstacles.push({
      id,
      length: spec.length,
      width: spec.width,
      x: laneCentre(lane),
      y: -spec.length
    });
  };

  /** The car sits low on screen; the road comes to it. */
  const playerY = DESIGN_HEIGHT - 140;

  const hits = (o: Obstacle): boolean => {
    const halfW = ((player.width + o.width) / 2) * HITBOX_INSET;
    const halfH = ((player.length + o.length) / 2) * HITBOX_INSET;
    return Math.abs(playerX - o.x) < halfW && Math.abs(playerY - o.y) < halfH;
  };

  const update = (step: number): void => {
    if (crashed) return;

    const v = speed();
    distance += (v * step) / POINTS_PER_METRE;
    roadOffset = (roadOffset + v * step) % 112;
    score += v * step * 0.05;

    // steering: chase the finger, rate-limited by handling
    if (targetX !== null) {
      const rate = 260 + player.handling * 130;
      const delta = targetX - playerX;
      playerX += Math.sign(delta) * Math.min(Math.abs(delta), rate * step);
    }
    const halfCar = player.width / 2;
    playerX = Math.max(halfCar, Math.min(DESIGN_WIDTH - halfCar, playerX));

    spawnTimer -= step;
    if (spawnTimer <= 0) {
      spawn();
      spawnTimer = Math.max(0.34, 1.05 - distance / RAMP_METRES);
    }

    for (const o of obstacles) o.y += v * step;
    for (const o of obstacles) {
      if (hits(o)) {
        crashed = true;
        return;
      }
    }
    const before = obstacles.length;
    obstacles = obstacles.filter((o) => o.y - o.length < DESIGN_HEIGHT + 60);
    coins += before - obstacles.length;
  };

  /* ---------------- rendering ---------------- */

  const drawRoad = (ctx: CanvasRenderingContext2D): void => {
    ctx.fillStyle = COLORS.asphalt;
    ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

    ctx.fillStyle = COLORS.lane;
    for (let lane = 1; lane < 4; lane += 1) {
      const x = LANE_WIDTH * lane - 3.5;
      for (let y = roadOffset - 112; y < DESIGN_HEIGHT; y += 112) {
        ctx.fillRect(x, y, 7, 48);
      }
    }

    // rumble strips: the edges of the world
    for (let y = roadOffset - 56; y < DESIGN_HEIGHT; y += 56) {
      ctx.fillStyle = COLORS.lane;
      ctx.fillRect(0, y, 11, 28);
      ctx.fillRect(DESIGN_WIDTH - 11, y, 11, 28);
      ctx.fillStyle = COLORS.rumble;
      ctx.fillRect(0, y + 28, 11, 28);
      ctx.fillRect(DESIGN_WIDTH - 11, y + 28, 11, 28);
    }
  };

  const drawSprite = (
    ctx: CanvasRenderingContext2D,
    id: VehicleId,
    x: number,
    y: number,
    w: number,
    h: number,
    flip: boolean
  ): void => {
    ctx.save();
    ctx.translate(x, y);
    if (flip) ctx.rotate(Math.PI);
    ctx.drawImage(sprites[id], -w / 2, -h / 2, w, h);
    ctx.restore();
  };

  const drawHud = (ctx: CanvasRenderingContext2D, fps: number): void => {
    ctx.fillStyle = 'rgba(10,8,6,0.86)';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.fillRect(16, 68, 148, 62);
    ctx.strokeRect(16, 68, 148, 62);

    ctx.fillStyle = COLORS.muted;
    ctx.font = `800 10px ${FONT_UI}`;
    ctx.fillText('SCORE', 28, 88);
    ctx.fillStyle = COLORS.lite;
    ctx.font = `900 30px ${FONT_UI}`;
    ctx.fillText(Math.floor(score).toLocaleString(), 28, 120);

    ctx.fillStyle = 'rgba(10,8,6,0.86)';
    ctx.fillRect(DESIGN_WIDTH - 148, 68, 132, 62);
    ctx.strokeRect(DESIGN_WIDTH - 148, 68, 132, 62);
    ctx.fillStyle = COLORS.muted;
    ctx.font = `800 10px ${FONT_UI}`;
    ctx.fillText('DIST', DESIGN_WIDTH - 136, 88);
    ctx.fillStyle = COLORS.cream;
    ctx.font = `900 22px ${FONT_UI}`;
    ctx.fillText(`${(distance / 1000).toFixed(2)} km`, DESIGN_WIDTH - 136, 116);

    // scaffold instrumentation, not shipping HUD
    ctx.fillStyle = fps < 50 ? COLORS.red : COLORS.muted;
    ctx.font = `800 12px ${FONT_UI}`;
    ctx.fillText(`${fps.toFixed(0)} fps · ${obstacles.length} cars`, 18, 156);

    if (crashed) {
      ctx.fillStyle = 'rgba(6,5,4,0.72)';
      ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
      ctx.fillStyle = COLORS.red;
      ctx.font = `64px ${FONT_DISPLAY}`;
      ctx.textAlign = 'center';
      ctx.fillText('WRECKED!', DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2);
      ctx.fillStyle = COLORS.muted;
      ctx.font = `800 13px ${FONT_UI}`;
      ctx.fillText('TAP TO RESTART', DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 + 34);
      ctx.textAlign = 'left';
    }
  };

  const render = (fps: number): void => {
    const { ctx } = stage;
    const s = scale();

    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(0, 0, stage.width, stage.height);

    ctx.save();
    ctx.translate(originX(), (stage.height - DESIGN_HEIGHT * s) / 2);
    ctx.scale(s, s);

    drawRoad(ctx);
    for (const o of obstacles) {
      drawSprite(ctx, o.id, o.x, o.y, o.width, o.length, true);
    }
    drawSprite(ctx, car, playerX, playerY, player.width, player.length, false);
    drawHud(ctx, fps);

    ctx.restore();
  };

  const restart = (): void => {
    coins = 0;
    crashed = false;
    distance = 0;
    obstacles = [];
    playerX = DESIGN_WIDTH / 2;
    score = 0;
    spawnTimer = 0;
  };

  return {
    bind,
    get coins() {
      return coins;
    },
    get crashed() {
      return crashed;
    },
    render,
    restart,
    /** Exposed so the harness can assert the thumb zone stays clear. */
    thumbZoneTop: THUMB_ZONE_TOP,
    update
  };
};

export type Game = ReturnType<typeof createGame>;
