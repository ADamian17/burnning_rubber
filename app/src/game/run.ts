/**
 * What a run is, in the game's own terms.
 *
 * Here rather than with the save, because these are things the engine and the
 * rules deal in: `daily.ts` asks whether a run met a challenge, and it should
 * not have to know that runs get written to disk. The save imports from here,
 * never the other way round — `game/` has no idea a store exists.
 */

/**
 * How the car is steered.
 *
 * Tap-lanes and tilt were dropped rather than built. Both were offered in
 * settings and neither was ever implemented, so choosing one silently gave you
 * drag under a different name — a setting that lies is worse than a setting
 * that is absent.
 *
 * Left as a union of one rather than collapsed away: re-adding a scheme should
 * be a type change the compiler walks you through, not a rediscovery.
 */
export type ControlScheme = "drag";

/**
 * A run as the engine finishes it.
 *
 * No `isBest`. The engine cannot know whether this beat the previous best —
 * only the store holds that — and a field the producer has to invent a value
 * for is a field in the wrong place. `RunResult` adds it at the point the
 * answer is actually available.
 */
export interface FinishedRun {
	/** Highest near-miss multiplier reached during the run. */
	bestCombo: number;
	coins: number;
	distance: number;
	score: number;
}
