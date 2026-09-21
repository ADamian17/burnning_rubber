import type { SpriteSheet } from '../features/run/sprites';
import { STEP } from '../features/run/loop';
import { createRng, pick } from '../lib/rng';
import type { Stage } from '../features/run/canvas';
import {
  COLORS,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  FONT_DISPLAY,
  FONT_UI,
  COMBO_WINDOW,
  HITBOX_INSET,
  LANE_CENTRES,
  LANE_COUNT,
  LANE_WIDTH,
  NEAR_MISS_MARGIN,
  START_X,
  THUMB_ZONE_TOP,
  laneCentre
} from './constants';
import { magnetReach, powerSeconds, type UpgradeLevels } from './upgrades';
import {
  MAGNET_PULL,
  PICKUPS,
  POWER_IDS,
  SLOWMO_SCALE,
  type PickupId,
  type PowerId
} from './pickups';
import {
  PLAYERS,
  TRAFFIC,
  TRAFFIC_IDS,
  type PlayerId,
  type SpriteId,
  type TrafficId
} from './fleet';

/** Something lying on the road to be collected rather than avoided. */
interface Pickup {
  id: PickupId;
  size: number;
  x: number;
  y: number;
}

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
  /** Fired on each near miss, so the shell can buzz without the game importing haptics. */
  readonly onNearMiss?: () => void;
  /**
   * Seeds every random decision in the run.
   *
   * Required rather than optional: an optional seed invites a silent fallback
   * somewhere inside, and then the daily's road is only mostly reproducible.
   * The caller decides — a date hash for a daily, a throwaway for a normal run.
   */
  readonly seed: number;
  /** Shop levels, which lengthen powers and widen the magnet. */
  readonly upgrades: UpgradeLevels;
  readonly sprites: SpriteSheet<SpriteId>;
  readonly stage: Stage;
}

export const createGame = ({
  car,
  onCrash,
  onNearMiss,
  seed,
  sprites,
  stage,
  upgrades
}: GameOptions) => {
  /*
   * Every random decision below draws from here. Two games built with the same
   * seed must lay out the same road, or a daily challenge is not the same
   * challenge for two people.
   */
  const rng = createRng(seed);
  const player = PLAYERS[car];

  let coins = 0;
  let countdown = COUNTDOWN;
  let crashed = false;
  let distance = 0;
  let obstacles: Obstacle[] = [];
  let pickups: Pickup[] = [];
  let pickupTimer = 0;
  /** Seconds left on each power. Zero means not running. */
  let powers: Record<PowerId, number> = { magnet: 0, shield: 0, slowmo: 0 };
  /** Current near-miss multiplier, and the best it reached this run. */
  let combo = 1;
  let bestCombo = 1;
  let comboTimer = 0;
  let playerX = START_X;
  let roadOffset = 0;
  let score = 0;
  let spawnTimer = 0;
  /** Lane the last group left open; the next gap walks from here. */
  let gapLane = pick(rng, LANE_COUNT);
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
  /*
   * Never larger than the design size.
   *
   * The canvas would otherwise keep growing on a desktop window while the DOM
   * screens stop at 852, and the two halves of the app would disagree about
   * how big the game is. Below 393x852 nothing is capped — the XS at 375x812
   * scales to 0.95 as it always did.
   */
  const scale = (): number =>
    Math.min(1, stage.width / DESIGN_WIDTH, stage.height / DESIGN_HEIGHT);
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

  /*
   * Slow-mo scales the world's velocity, never the timestep.
   *
   * createLoop accumulates real time and steps a fixed 1/60; scaling `step`
   * instead would desynchronise that accumulator from the wall clock, and the
   * render interpolation reads from here too, so both stay in agreement.
   */
  /** How far up the difficulty ramp this run has climbed, 0 to 1. */
  const pressure = (): number => Math.min(1, distance / RAMP_METRES);

  const speed = (): number =>
    Math.min(MAX_SPEED, BASE_SPEED + (MAX_SPEED - BASE_SPEED) * (distance / RAMP_METRES)) *
    (0.9 + player.speed * 0.035) *
    (powers.slowmo > 0 ? SLOWMO_SCALE : 1);

  /**
   * Spawns a group of cars across the road with exactly one lane left open, so
   * the player threads a moving hole rather than sidestepping a lone car.
   *
   * Single random cars read as too easy on a device: with four lanes and one
   * car per spawn, most groups needed no reaction at all.
   */
  const spawn = (): void => {
    const load = pressure();
    const pool = TRAFFIC_IDS.filter((id) => TRAFFIC[id].threat <= 1 + Math.round(load * 4));

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
    gapLane = open[pick(rng, open.length)];

    // two cars from the off, three once the road is at pressure: opening with a
    // single car left the first stretch with nothing to steer around
    const count = 2 + Math.round(load);
    const lanes = LANE_CENTRES.map((_, lane) => lane)
      // a lane already holding a car cannot take another — two cars stacked in
      // one lane is the same defect seen from the other side
      .filter((lane) => lane !== gapLane && !laneBusy(lane))
      .map((lane) => ({ lane, order: rng() }))
      .sort((a, b) => a.order - b.order)
      .map(({ lane }) => lane)
      .slice(0, count);

    for (const lane of lanes) {
      const id = pool[pick(rng, pool.length)];
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

  /** Seconds between coins. Slower than traffic: a coin should be worth taking. */
  const PICKUP_EVERY = 1.6;

  /**
   * Drops a coin into a lane with nothing in it.
   *
   * Never shares a lane with traffic already on the road, because a coin the
   * player cannot reach without crashing is not a choice, it is a trap. That
   * still leaves real tension: the clear lane holding the coin is often not the
   * gap the next group will leave.
   */
  /** Roughly one drop in six is a power rather than a coin. */
  const POWER_CHANCE = 0.17;

  const dropPickup = (): void => {
    const free = LANE_CENTRES.map((_, lane) => lane).filter((lane) => !laneBusy(lane));
    if (free.length === 0) return;
    const unlocked = POWER_IDS.filter((power) => {
      const spec = PICKUPS[power];
      return spec.kind === 'power' && pressure() >= spec.from;
    });
    const id: PickupId =
      unlocked.length > 0 && rng() < POWER_CHANCE
        ? unlocked[pick(rng, unlocked.length)]
        : 'coin';
    const lane = free[pick(rng, free.length)];
    pickups.push({ id, size: PICKUPS[id].size, x: laneCentre(lane), y: -PICKUPS[id].size });
  };

  /**
   * Generous on purpose: a coin is a reward, so it should forgive a near miss
   * the way HITBOX_INSET deliberately does not.
   */
  const takes = (p: Pickup): boolean => {
    const reach = (player.width + p.size) / 2 + 10;
    const halfH = (player.length + p.size) / 2;
    return Math.abs(playerX - p.x) < reach && Math.abs(playerY - p.y) < halfH;
  };

  /** True while a lane still holds a car anywhere on the player's approach. */
  const laneBusy = (lane: number): boolean =>
    obstacles.some((o) => o.x === laneCentre(lane) && o.y < playerY);

  const hits = (o: Obstacle): boolean => {
    const halfW = ((player.width + o.width) / 2) * HITBOX_INSET;
    const halfH = ((player.length + o.length) / 2) * HITBOX_INSET;
    return Math.abs(playerX - o.x) < halfW && Math.abs(playerY - o.y) < halfH;
  };

  /**
   * True when a car went by close enough to count, without touching.
   *
   * The band is the crash box plus a fixed clearance, so it can never be
   * narrower than the thing it surrounds, and re-tuning HITBOX_INSET moves
   * both together.
   */
  const shaved = (o: Obstacle): boolean => {
    const crashHalfW = ((player.width + o.width) / 2) * HITBOX_INSET;
    return Math.abs(playerX - o.x) < crashHalfW + NEAR_MISS_MARGIN;
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
    score += v * step * 0.05 * combo;

    steer(step);

    // the shield is the exception: it runs until it is spent or times out
    for (const id of POWER_IDS) powers[id] = Math.max(0, powers[id] - step);

    if (comboTimer > 0) {
      comboTimer -= step;
      // the whole multiplier goes at once rather than stepping down: a combo
      // is a streak, and a streak either continues or it is over
      if (comboTimer <= 0) combo = 1;
    }

    spawnTimer -= step;
    if (spawnTimer <= 0) {
      spawn();
      spawnTimer = Math.max(0.34, 1.05 - distance / RAMP_METRES);
    }

    pickupTimer -= step;
    if (pickupTimer <= 0) {
      dropPickup();
      pickupTimer = PICKUP_EVERY;
    }

    for (const o of obstacles) o.y += v * step;
    for (const o of obstacles) {
      if (!hits(o)) continue;
      if (powers.shield > 0) {
        /*
         * The shield eats the crash and the car that caused it.
         *
         * Removing the obstacle matters: leaving it there would put the car
         * inside it on the next frame, with the shield already spent, so the
         * run would end anyway and the pickup would have bought nothing.
         */
        powers.shield = 0;
        obstacles = obstacles.filter((other) => other !== o);
        break;
      }
      crashed = true;
      onCrash?.();
      return;
    }
    /*
     * A car that has just drawn level with the player and did not hit is a
     * near miss.
     *
     * Checked after the crash pass, which returns on contact, so anything
     * reaching here by definition got past. The crossing is detected from
     * where the car was one step ago rather than from a stored flag — it moves
     * a known distance per step, so the previous position is already known.
     */
    for (const o of obstacles) {
      const was = o.y - v * step;
      if (was >= playerY || o.y < playerY) continue;
      if (!shaved(o)) continue;
      combo += 1;
      comboTimer = COMBO_WINDOW;
      if (combo > bestCombo) bestCombo = combo;
      onNearMiss?.();
    }

    obstacles = obstacles.filter((o) => o.y - o.length < DESIGN_HEIGHT + 60);

    /*
     * Coins are banked the instant they are touched.
     *
     * They used to be counted as traffic scrolled off the bottom, which made
     * the currency a side effect of surviving long enough for the screen to
     * move: a run that ended early paid nothing at all, so the weakest players
     * earned least and could never reach the garage. Taking a coin is now an
     * act, and a short run still pays for what it collected.
     */
    for (const p of pickups) p.y += v * step;

    /*
     * A magnet drags anything in reach toward the car.
     *
     * It moves pickups rather than widening the collection box, so the pull is
     * visible: the coin comes to you. Applied after the scroll so a pickup the
     * road has already carried past can still be hauled back.
     */
    if (powers.magnet > 0) {
      for (const p of pickups) {
        const dx = playerX - p.x;
        const dy = playerY - p.y;
        const away = Math.hypot(dx, dy);
        if (away > magnetReach(upgrades) || away < 1) continue;
        const move = Math.min(away, MAGNET_PULL * step);
        p.x += (dx / away) * move;
        p.y += (dy / away) * move;
      }
    }

    pickups = pickups.filter((p) => {
      if (takes(p)) {
        const spec = PICKUPS[p.id];
        // taking a second one refreshes the clock rather than stacking a
        // second copy, or two shields would mean two crashes absorbed
        if (spec.kind === 'power') powers[p.id as PowerId] = powerSeconds(p.id as PowerId, upgrades);
        else coins += spec.value;
        return false;
      }
      return p.y - p.size < DESIGN_HEIGHT + 60;
    });
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
    id: SpriteId,
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

  const POWER_TINT: Readonly<Record<PowerId, string>> = {
    magnet: '#F2359B',
    shield: '#35D6F2',
    slowmo: '#8BE9FA'
  };

  /**
   * The bubble the artboard puts around a shielded car.
   *
   * This is the only cue the player can read without looking away from the car,
   * which is the whole point: the HUD pill says how long is left, the bubble
   * says you are currently safe. Its disappearance is how a spent shield
   * announces itself.
   *
   * Proportions are taken from PowerUpActive.dc.html: a 172x196 ellipse around
   * the car, an inner hairline at 150x174, and a hex-facet hint from two sets
   * of thin lines at plus and minus 60 degrees.
   */
  const drawShieldBubble = (ctx: CanvasRenderingContext2D): void => {
    const rx = 86;
    const ry = 98;
    // the last moment fades rather than vanishing, so it reads as running out
    const fade = Math.min(1, powers.shield / 1.2);

    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(playerX, playerY);

    const wash = ctx.createRadialGradient(0, 0, ry * 0.1, 0, 0, ry);
    wash.addColorStop(0, 'rgba(53,214,242,0.10)');
    wash.addColorStop(0.62, 'rgba(53,214,242,0.30)');
    wash.addColorStop(0.78, 'rgba(53,214,242,0.06)');
    wash.addColorStop(1, 'rgba(53,214,242,0)');

    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = wash;
    ctx.fill();

    // facets are clipped to the bubble, or the lines run across the whole road
    ctx.save();
    ctx.clip();
    ctx.globalAlpha = fade * 0.45;
    ctx.strokeStyle = 'rgba(139,233,250,0.4)';
    ctx.lineWidth = 1;
    for (const angle of [Math.PI / 3, -Math.PI / 3]) {
      ctx.save();
      ctx.rotate(angle);
      for (let y = -ry * 2; y < ry * 2; y += 17) {
        ctx.beginPath();
        ctx.moveTo(-rx * 2, y);
        ctx.lineTo(rx * 2, y);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();

    ctx.globalAlpha = fade;
    ctx.shadowColor = 'rgba(53,214,242,0.55)';
    ctx.shadowBlur = 34;
    ctx.strokeStyle = 'rgba(139,233,250,0.95)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 0.87, ry * 0.89, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  };

  /**
   * One pill per running power, name and seconds left, stacked down the left.
   *
   * Kept above THUMB_ZONE_TOP with the rest of the HUD: a countdown the hand
   * is resting on is a countdown the player cannot read.
   */
  const drawPowerPills = (ctx: CanvasRenderingContext2D): void => {
    const running = POWER_IDS.filter((id) => powers[id] > 0);
    let top = 172;
    for (const id of running) {
      const spec = PICKUPS[id];
      if (spec.kind !== 'power') continue;
      // against the upgraded duration, or a bought level would draw a bar that
      // starts over-full and sits pinned at 100%
      const full = powerSeconds(id, upgrades);
      const left = full > 0 ? powers[id] / full : 0;

      ctx.fillStyle = 'rgba(10,8,6,0.85)';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.fillRect(16, top, 150, 30);
      ctx.strokeRect(16, top, 150, 30);

      ctx.fillStyle = POWER_TINT[id];
      ctx.fillRect(24, top + 11, 8, 8);

      ctx.fillStyle = COLORS.cream;
      ctx.font = `900 10px ${FONT_UI}`;
      ctx.fillText(spec.label, 40, top + 19);

      // the bar is the read at speed; the number is for when you have a moment
      ctx.fillStyle = '#0B0908';
      ctx.fillRect(102, top + 12, 40, 6);
      ctx.fillStyle = POWER_TINT[id];
      ctx.fillRect(102, top + 12, 40 * left, 6);

      ctx.fillStyle = COLORS.muted;
      ctx.font = `800 10px ${FONT_UI}`;
      ctx.fillText(powers[id].toFixed(1), 148, top + 19);

      top += 36;
    }
  };

  /**
   * The multiplier, centred over the road at 46% of the height.
   *
   * Both artboards scale it with the streak — 76px at x3, 86px at x5 — and
   * swap the caption from NEAR MISS to ON FIRE, so the number grows into the
   * screen as the run gets better rather than sitting at a fixed size. Above
   * THUMB_ZONE_TOP like everything else, and tilted the same -7 degrees.
   */
  const drawCombo = (ctx: CanvasRenderingContext2D): void => {
    if (combo < 2) return;
    const y = DESIGN_HEIGHT * 0.46;
    const size = 66 + combo * 4;
    const glow = 200 + combo * 10;
    // it fades out with the streak's last half-second rather than blinking off
    const alpha = Math.min(1, comboTimer / 0.5);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(DESIGN_WIDTH / 2, y);
    ctx.rotate((-7 * Math.PI) / 180);
    ctx.textAlign = 'center';

    const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, glow / 2);
    halo.addColorStop(0, 'rgba(247,117,3,0.45)');
    halo.addColorStop(0.62, 'rgba(247,117,3,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(-glow / 2, -glow / 2, glow, glow);

    ctx.fillStyle = '#000';
    ctx.font = `${size}px ${FONT_DISPLAY}`;
    ctx.fillText(`×${combo}`, 5, 6);
    ctx.fillStyle = COLORS.lite;
    ctx.fillText(`×${combo}`, 0, 0);

    ctx.fillStyle = COLORS.orange;
    ctx.font = `900 11px ${FONT_UI}`;
    ctx.fillText(combo >= 5 ? 'ON FIRE' : 'NEAR MISS', 0, size * 0.28);

    ctx.textAlign = 'left';
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

    drawPowerPills(ctx);
    drawCombo(ctx);

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

    /*
     * Clip to the design box.
     *
     * The rumble strips are drawn in whole blocks from above the top edge to
     * past the bottom one, so they overhang 393x852 by up to a block at each
     * end. That never showed while the canvas filled at least one axis exactly.
     * Capping the scale at 1 for the web build put letterbox bars on both axes
     * for the first time, and the strips painted straight into them — cream on
     * the black, outside the road.
     */
    ctx.beginPath();
    ctx.rect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    ctx.clip();

    drawRoad(ctx, roadOffset + lead);
    // under the traffic: a car crossing a coin should cover it, not sit behind it
    for (const p of pickups) {
      drawSprite(ctx, p.id, p.x, p.y + lead, p.size, p.size, false);
    }
    for (const o of obstacles) {
      drawSprite(ctx, o.id, o.x, o.y + lead, o.width, o.length, true);
    }
    drawSprite(ctx, car, playerX, playerY, player.width, player.length, false);
    // over the car, so the bubble contains it rather than sitting behind it
    if (powers.shield > 0) drawShieldBubble(ctx);

    // the artboard washes a slowed road in cyan; it is also the only cue that
    // reads without looking away from the car
    if (powers.slowmo > 0) {
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(53,214,242,0.16)';
      ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
      ctx.globalCompositeOperation = 'source-over';
    }

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
    pickups = [];
    pickupTimer = PICKUP_EVERY;
    powers = { magnet: 0, shield: 0, slowmo: 0 };
    combo = 1;
    bestCombo = 1;
    comboTimer = 0;
    // redrawn from the stream, so a restarted run is a fresh road rather than
    // a repeat of the one just crashed on
    gapLane = pick(rng, LANE_COUNT);
  };

  return {
    bind,
    get bestCombo() {
      return bestCombo;
    },
    /** Traffic currently on the road. The HUD reads it; so does the seed test. */
    get cars() {
      return obstacles.length;
    },
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
