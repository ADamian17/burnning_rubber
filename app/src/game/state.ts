import { Preferences } from "@capacitor/preferences";
import { type DailyState, FRESH_DAILY } from "./daily";
import { PLAYER_IDS, type PlayerId } from "./fleet";
import {
	FRESH_UPGRADES,
	maxLevel,
	UPGRADE_IDS,
	type UpgradeLevels,
} from "./upgrades";

/** Storage key. Exported so the store's persist adapter names the same slot. */
export const SAVE_KEY = "burning-rubber:save";

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

/** Result of the most recent run, so the summary survives a reload. */
export interface RunResult {
	/** Highest near-miss multiplier reached during the run. */
	bestCombo: number;
	coins: number;
	distance: number;
	isBest: boolean;
	score: number;
}

export interface SaveState {
	best: number;
	/** Daily challenge progress: last day completed, and the run of them. */
	daily: DailyState;
	coins: number;
	control: ControlScheme;
	equipped: PlayerId;
	lastRun: RunResult | null;
	/** False until onboarding has been dismissed once. */
	onboarded: boolean;
	owned: PlayerId[];
	/** Levels bought in the shop, per upgrade. */
	upgrades: UpgradeLevels;
}

const FRESH: SaveState = {
	best: 0,
	daily: { ...FRESH_DAILY },
	coins: 0,
	control: "drag",
	equipped: "straycat",
	lastRun: null,
	onboarded: false,
	owned: ["straycat"],
	upgrades: { ...FRESH_UPGRADES },
};

/**
 * Narrow the daily record.
 *
 * A streak is a count of days, so a fractional or negative one is meaningless;
 * a lastDone that is not a date string would silently break the streak
 * arithmetic rather than throw, which is the harder kind of bug to find.
 */
const reviveDaily = (raw: unknown): DailyState => {
	const value = (
		typeof raw === "object" && raw !== null ? raw : {}
	) as Partial<DailyState>;
	const streak = Number(value.streak);
	const lastDone =
		typeof value.lastDone === "string" &&
		/^\d{4}-\d{2}-\d{2}$/.test(value.lastDone)
			? value.lastDone
			: null;
	return {
		lastDone,
		streak: Number.isFinite(streak) ? Math.max(0, Math.floor(streak)) : 0,
	};
};

/**
 * Clamp stored upgrade levels to what the shop can actually sell.
 *
 * A level above the maximum would quietly hand out an effect no price was ever
 * paid for, and a fractional or negative one would feed NaN into a power's
 * duration. Anything unrecognised drops to zero rather than throwing — a broken
 * save should cost the player their upgrades, not the ability to play.
 */
const reviveUpgrades = (raw: unknown): UpgradeLevels => {
	const value = (
		typeof raw === "object" && raw !== null ? raw : {}
	) as Partial<UpgradeLevels>;
	const levels = { ...FRESH_UPGRADES };
	for (const id of UPGRADE_IDS) {
		const level = Number(value[id]);
		if (!Number.isFinite(level)) continue;
		levels[id] = Math.max(0, Math.min(maxLevel(id), Math.floor(level)));
	}
	return levels;
};

/**
 * Fill in a run summary written before a field existed.
 *
 * bestCombo arrived after the first saves did, so a returning player has a
 * lastRun without one. Defaulting to 1 here keeps the summary screen honest —
 * a run recorded before combos existed genuinely had no streak.
 */
const reviveRun = (raw: RunResult | undefined | null): RunResult | null => {
	if (!raw || typeof raw !== "object") return null;
	return {
		bestCombo: Number.isFinite(raw.bestCombo) ? Number(raw.bestCombo) : 1,
		coins: Number.isFinite(raw.coins) ? Number(raw.coins) : 0,
		distance: Number.isFinite(raw.distance) ? Number(raw.distance) : 0,
		isBest: raw.isBest === true,
		score: Number.isFinite(raw.score) ? Number(raw.score) : 0,
	};
};

/** Narrow unknown JSON to a SaveState, discarding anything that no longer exists. */
export const revive = (raw: unknown): SaveState => {
	if (typeof raw !== "object" || raw === null) return { ...FRESH };
	const value = raw as Partial<SaveState>;
	const owned = (Array.isArray(value.owned) ? value.owned : []).filter(
		(id): id is PlayerId => PLAYER_IDS.includes(id as PlayerId),
	);
	if (!owned.includes("straycat")) owned.push("straycat");
	const equipped =
		value.equipped && owned.includes(value.equipped)
			? value.equipped
			: "straycat";
	return {
		best: Number.isFinite(value.best) ? Number(value.best) : 0,
		coins: Number.isFinite(value.coins) ? Number(value.coins) : 0,
		daily: reviveDaily(value.daily),
		// a save from when tap-lanes or tilt could be chosen comes back as drag,
		// which is what those players were getting anyway
		control: "drag",
		equipped,
		lastRun: reviveRun(value.lastRun),
		onboarded: value.onboarded === true,
		owned,
		upgrades: reviveUpgrades(value.upgrades),
	};
};

export const loadState = async (): Promise<SaveState> => {
	try {
		const { value } = await Preferences.get({ key: SAVE_KEY });
		return value ? revive(JSON.parse(value)) : { ...FRESH };
	} catch {
		// a corrupt or unreadable save should cost the player their progress, not
		// the ability to launch the game
		return { ...FRESH };
	}
};

export const saveState = async (state: SaveState): Promise<void> => {
	await Preferences.set({ key: SAVE_KEY, value: JSON.stringify(state) });
};

export const resetState = async (): Promise<SaveState> => {
	await Preferences.remove({ key: SAVE_KEY });
	return { ...FRESH };
};
