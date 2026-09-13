import type { SpriteSheet } from '../engine/sprites';
import { STEP } from '../engine/loop';
import type { Stage } from '../engine/canvas';
import {
  COLORS,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  FONT_DISPLAY,
  FONT_UI,
  HITBOX_INSET,
  LANE_CENTRES,
  LANE_COUNT,
  LANE_WIDTH,
  START_X,
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
/**
 * Distance in metres over which speed climbs from base to max.
 *
 * Also gates group size, spawn cadence and which traffic types appear, so it is
 * the single knob that decides the whole difficulty curve. Was 2400, which no
 * run ever reached: a good run on device tops out around 1.27km, so more than
 * half the curve was unreachable and the game sat near its easiest setting.
 */
const RAMP_METRES = 1400;

/** Lane dash repeat, in design points. */
const LANE_CYCLE = 112;

/** Height of one rumble-strip block; the cream/red cycle is twice this. */
const RUMBLE_BLOCK = 80;

/**
 * Where roadOffset wraps: the lowest common multiple of the lane cycle (112)
 * and the rumble cycle (160). Each pattern derives its own phase below, so this
 * only keeps the running number small — but a wrap that is not a multiple of
 * both would make one of the two patterns jump every time it reset.
 */
const ROAD_CYCLE = 1120;

/** Design points per in-game metre. */
const POINTS_PER_METRE = 26;

/**
 * Grace period before traffic starts, in seconds.
 *
 * Without it a car can already be bearing down the instant the run begins —
 * observed twice while verifying, ending runs at 0.03km through no fault of
 * the player. The road still scrolls and steering is live; only spawning and
 * collision are held back, so the opening reads as rolling up to speed rather
 * than a frozen screen.
 */
const COUNTDOWN = 3;

export interface GameOptions {
  readonly car: PlayerId;
  /** Fired once, the frame the run ends. */
  readonly onCrash?: () => void;
  readonly sprites: SpriteSheet<VehicleId>;
  readonly stage: Stage;
}

export const createGame = ({ car, onCrash, sprites, stage }: GameOptions) => {
  const player = PLAYERS[car];

  let coins = 0;
  let countdown = COUNTDOWN;
  let crashed = false;
  let distance = 0;
  let obstacles: Obstacle[] = [];
  let playerX = START_X;
  let roadOffset = 0;
  let score = 0;
  let spawnTimer = 0;
  /** Lane the last group left open; the next gap walks from here. */
  let gapLane = Math.floor(Math.random() * LANE_COUNT);
  /** Where the finger wants the car; null means hold position. */
  let targetX: number | null = null;

  /* ---------------- input ---------------- */

  /**
   * Steering is relative: the car moves by however far the finger has dragged
   * since it went down, not to wherever the finger is.
   *
   * Absolute steering put the car's x under the finger's x, and the car sits at
   * 83.5% of the height — inside the THUMB_ZONE_TOP band the design reserves for
   * the hand. Playing it on an iPhone XS, the thumb covered the car and the road
   * immediately ahead of it. Relative dragging lets the hand rest low and wide
   * of the car while still steering it.
   *
   * The car still chases the target at a capped rate, so handling keeps meaning
   * something — a Hatpin closes the gap faster than a Donkey Work.
   */
  const scale = (): number => Math.min(stage.width / DESIGN_WIDTH, stage.height / DESIGN_HEIGHT);
  const originX = (): number => (stage.width - DESIGN_WIDTH * scale()) / 2;

  const pointerTo = (clientX: number): number => (clientX - originX()) / scale();

  /** Finger x when the drag started, and the car's x at that moment. */
  let dragFrom = 0;
  let dragCarFrom = START_X;

  const onPointer = (event: PointerEvent): void => {
    if (event.buttons === 0 && event.type === 'pointermove') return;
    targetX = dragCarFrom + (pointerTo(event.clientX) - dragFrom);
  };

  const bind = (canvas: HTMLCanvasElement): (() => void) => {
    const down = (e: PointerEvent): void => {
      canvas.setPointerCapture(e.pointerId);
      // anchor on the car's current x so the first touch never jerks it
      dragFrom = pointerTo(e.clientX);
      dragCarFrom = playerX;
      targetX = playerX;
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

  /**
   * Spawns a group of cars across the road with exactly one lane left open, so
   * the player threads a moving hole rather than sidestepping a lone car.
   *
   * Single random cars read as too easy on a device: with four lanes and one
   * car per spawn, most groups needed no reaction at all.
   */
  const spawn = (): void => {
    const pressure = Math.min(1, distance / RAMP_METRES);
    const pool = TRAFFIC_IDS.filter((id) => TRAFFIC[id].threat <= 1 + Math.round(pressure * 4));

    /*
     * The gap walks at most one lane per group. At full pressure the groups are
     * 0.34s apart and the slowest car steers 260pt/s — barely over half a lane —
     * so a gap that jumped further would be unreachable rather than difficult.
     */
    const reachable = [gapLane - 1, gapLane, gapLane + 1].filter(
      (lane) => lane >= 0 && lane < LANE_COUNT
    );

    /*
     * The hole must be empty the whole way down to the player, not merely clear
     * at the spawn line. Checking only the top of the road let a car left behind
     * by an earlier group sit in the "open" lane, turning the gap into a dead end.
     */
    const open = reachable.filter((lane) => !laneBusy(lane));
    if (open.length === 0) return;
    gapLane = open[Math.floor(Math.random() * open.length)];

    // two cars from the off, three once the road is at pressure: opening with a
    // single car left the first stretch with nothing to steer around
    const count = 2 + Math.round(pressure);
    const lanes = LANE_CENTRES.map((_, lane) => lane)
      // a lane already holding a car cannot take another — two cars stacked in
      // one lane is the same defect seen from the other side
      .filter((lane) => lane !== gapLane && !laneBusy(lane))
      .map((lane) => ({ lane, order: Math.random() }))
      .sort((a, b) => a.order - b.order)
      .map(({ lane }) => lane)
      .slice(0, count);

    for (const lane of lanes) {
      const id = pool[Math.floor(Math.random() * pool.length)];
      const spec = TRAFFIC[id];
      obstacles.push({
        id,
        length: spec.length,
        width: spec.width,
        x: laneCentre(lane),
        y: -spec.length
      });
    }
  };

  /** The car sits low on screen; the road comes to it. */
  const playerY = DESIGN_HEIGHT - 140;

  /** True while a lane still holds a car anywhere on the player's approach. */
  const laneBusy = (lane: number): boolean =>
    obstacles.some((o) => o.x === laneCentre(lane) && o.y < playerY);

  const hits = (o: Obstacle): boolean => {
    const halfW = ((player.width + o.width) / 2) * HITBOX_INSET;
    const halfH = ((player.length + o.length) / 2) * HITBOX_INSET;
    return Math.abs(playerX - o.x) < halfW && Math.abs(playerY - o.y) < halfH;
  };

  /** Chase the finger, rate-limited by handling so the stat is felt. */
  const steer = (step: number): void => {
    if (targetX !== null) {
      const rate = 260 + player.handling * 130;
      const delta = targetX - playerX;
      playerX += Math.sign(delta) * Math.min(Math.abs(delta), rate * step);
    }
    const halfCar = player.width / 2;
    playerX = Math.max(halfCar, Math.min(DESIGN_WIDTH - halfCar, playerX));
  };

  const update = (step: number): void => {
    if (crashed) return;

    const v = speed();
    if (countdown > 0) {
      // world moves, player steers, nothing can hit them yet
      countdown -= step;
      roadOffset = (roadOffset + v * step) % ROAD_CYCLE;
      steer(step);
      return;
    }
    distance += (v * step) / POINTS_PER_METRE;
    roadOffset = (roadOffset + v * step) % ROAD_CYCLE;
    score += v * step * 0.05;

    steer(step);

    spawnTimer -= step;
    if (spawnTimer <= 0) {
      spawn();
      spawnTimer = Math.max(0.34, 1.05 - distance / RAMP_METRES);
    }

    for (const o of obstacles) o.y += v * step;
    for (const o of obstacles) {
      if (hits(o)) {
        crashed = true;
        onCrash?.();
        return;
      }
    }
    const before = obstacles.length;
    obstacles = obstacles.filter((o) => o.y - o.length < DESIGN_HEIGHT + 60);
    coins += before - obstacles.length;
  };

  /* ---------------- rendering ---------------- */

  const drawRoad = (ctx: CanvasRenderingContext2D, offset: number): void => {
    ctx.fillStyle = COLORS.asphalt;
    ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

    ctx.fillStyle = COLORS.lane;
    const lanePhase = offset % LANE_CYCLE;
    for (let lane = 1; lane < 4; lane += 1) {
      const x = LANE_WIDTH * lane - 3.5;
      for (let y = lanePhase - LANE_CYCLE; y < DESIGN_HEIGHT; y += LANE_CYCLE) {
        ctx.fillRect(x, y, 7, 48);
      }
    }

    /*
     * Rumble strips: the edges of the world.
     *
     * Blocks are 80pt rather than 28. At 28 the cream/red cycle was 56pt, which
     * against a 980pt/s scroll strobes at 17.5Hz down both edges — inside the
     * 15-20Hz band that causes visual discomfort, at the highest contrast on
     * screen, in peripheral vision. It read as tired eyes after a few runs.
     * At 80pt the same cycle lands near 6Hz.
     */
    const rumbleCycle = RUMBLE_BLOCK * 2;
    for (
      let y = (offset % rumbleCycle) - rumbleCycle;
      y < DESIGN_HEIGHT;
      y += rumbleCycle
    ) {
      ctx.fillStyle = COLORS.lane;
      ctx.fillRect(0, y, 11, RUMBLE_BLOCK);
      ctx.fillRect(DESIGN_WIDTH - 11, y, 11, RUMBLE_BLOCK);
      ctx.fillStyle = COLORS.rumble;
      ctx.fillRect(0, y + RUMBLE_BLOCK, 11, RUMBLE_BLOCK);
      ctx.fillRect(DESIGN_WIDTH - 11, y + RUMBLE_BLOCK, 11, RUMBLE_BLOCK);
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

    // the pause button is a DOM element occupying the top-right corner; the
    // distance readout stacks beneath it rather than fighting it for the space
    const distTop = 124;
    ctx.fillStyle = 'rgba(10,8,6,0.86)';
    ctx.fillRect(DESIGN_WIDTH - 148, distTop, 132, 56);
    ctx.strokeRect(DESIGN_WIDTH - 148, distTop, 132, 56);
    ctx.fillStyle = COLORS.muted;
    ctx.font = `800 10px ${FONT_UI}`;
    ctx.fillText('DIST', DESIGN_WIDTH - 136, distTop + 20);
    ctx.fillStyle = COLORS.cream;
    ctx.font = `900 22px ${FONT_UI}`;
    ctx.fillText(`${(distance / 1000).toFixed(2)} km`, DESIGN_WIDTH - 136, distTop + 46);

    // scaffold instrumentation, not shipping HUD
    ctx.fillStyle = fps < 50 ? COLORS.red : COLORS.muted;
    ctx.font = `800 12px ${FONT_UI}`;
    ctx.fillText(`${fps.toFixed(0)} fps · ${obstacles.length} cars`, 18, 156);

    if (countdown > 0) {
      const n = Math.ceil(countdown);
      ctx.textAlign = 'center';
      ctx.fillStyle = COLORS.lite;
      ctx.font = `170px ${FONT_DISPLAY}`;
      ctx.fillText(n > 0 ? String(n) : 'GO', DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.46);
      ctx.fillStyle = COLORS.orange;
      ctx.font = `900 12px ${FONT_UI}`;
      ctx.fillText('GET READY', DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.46 + 34);
      ctx.textAlign = 'left';
    }

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

  /**
   * `alpha` is how far the render sits between two fixed simulation steps.
   *
   * Without it the world only moves in whole 1/60 jumps while the display
   * refreshes on its own schedule, so some frames advance twice and some not at
   * all — which reads as the road shaking. Felt on an iPhone XS; the loop
   * computed this factor from the start and it was being dropped on the floor.
   */
  const render = (alpha: number, fps: number): void => {
    const { ctx } = stage;
    const s = scale();
    // everything that scrolls does so at world speed, so one lead covers it all
    const lead = crashed ? 0 : speed() * STEP * alpha;

    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(0, 0, stage.width, stage.height);

    ctx.save();
    ctx.translate(originX(), (stage.height - DESIGN_HEIGHT * s) / 2);
    ctx.scale(s, s);

    drawRoad(ctx, roadOffset + lead);
    for (const o of obstacles) {
      drawSprite(ctx, o.id, o.x, o.y + lead, o.width, o.length, true);
    }
    drawSprite(ctx, car, playerX, playerY, player.width, player.length, false);
    drawHud(ctx, fps);

    ctx.restore();
  };

  const restart = (): void => {
    coins = 0;
    countdown = COUNTDOWN;
    crashed = false;
    distance = 0;
    obstacles = [];
    playerX = START_X;
    score = 0;
    spawnTimer = 0;
  };

  return {
    bind,
    get coins() {
      return coins;
    },
    get counting() {
      return countdown > 0;
    },
    get crashed() {
      return crashed;
    },
    get distance() {
      return distance;
    },
    get score() {
      return score;
    },
    render,
    restart,
    /** Exposed so the harness can assert the thumb zone stays clear. */
    thumbZoneTop: THUMB_ZONE_TOP,
    update
  };
};

export type Game = ReturnType<typeof createGame>;
