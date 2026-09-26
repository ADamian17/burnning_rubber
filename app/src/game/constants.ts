/** The design canvas every screen was drawn against. */
export const DESIGN_WIDTH = 393;
export const DESIGN_HEIGHT = 852;

export const LANE_COUNT = 4;
/** 393 / 4. The one number the engine must not drift from. */
export const LANE_WIDTH = DESIGN_WIDTH / LANE_COUNT;

/**
 * No HUD may be drawn below this line: the player's thumb lives there.
 * Expressed as a fraction so it survives a change of design height.
 */
export const THUMB_ZONE_TOP = DESIGN_HEIGHT * 0.65;

/** Centre x of a lane, 0-indexed from the left. */
export const laneCentre = (lane: number): number => LANE_WIDTH * (lane + 0.5);

/** Every lane centre, left to right. */
export const LANE_CENTRES: readonly number[] = Array.from({ length: LANE_COUNT }, (_, i) =>
  laneCentre(i)
);

/**
 * Where the player starts.
 *
 * Named rather than inlined because DESIGN_WIDTH / 2 looks like the obvious
 * answer and is wrong: on an even lane count the road's centre is a divider,
 * not a lane. A test asserts this stays a lane centre.
 */
export const START_X = laneCentre(1);

/**
 * Hitboxes are inset from the artwork, because a sprite's box includes wheel
 * overhang and transparent padding. Clipping a wing mirror should not end a run.
 *
 * 0.86 was too generous: two cars overlapped by ~8pt on screen with no crash,
 * which reads as a broken collision rather than a forgiving one.
 */
export const HITBOX_INSET = 0.92;

/**
 * How far outside the crash box still counts as a near miss, in design points.
 *
 * Expressed as clearance beyond the hitbox rather than as its own multiple of
 * the car widths, for two reasons: it rides on HITBOX_INSET, so re-tuning the
 * crash box on a device carries into what counts as a shave; and it stays a
 * fixed distance for every pairing, where a multiplier would quietly exceed a
 * whole lane for the widest car against the widest lorry.
 */
export const NEAR_MISS_MARGIN = 34;

/** Seconds a combo survives without another near miss before it drops to 1. */
export const COMBO_WINDOW = 2.5;

export const COLORS = {
  asphalt: '#26241F',
  cream: '#F5EFE4',
  gold: '#FFC93C',
  hot: '#f77503',
  ink: '#0A0806',
  lane: '#EFE9DC',
  lite: '#FFB765',
  muted: '#9C9184',
  orange: '#F28D35',
  red: '#E4322B',
  rumble: '#B8342C'
} as const;

export const FONT_DISPLAY = "'Underdog', cursive";
export const FONT_UI = "'Outfit', system-ui, sans-serif";
