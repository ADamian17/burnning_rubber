import { Preferences } from "@capacitor/preferences";
import { type DailyState, FRESH_DAILY } from "../../game/daily";
import { PLAYER_IDS, type PlayerId } from "../../game/fleet";
import type { FinishedRun } from "../../game/run";
import {
	FRESH_UPGRADES,
	maxLevel,
	UPGRADE_IDS,
	type UpgradeLevels,
} from "../../game/upgrades";
import type { PersistStorage } from "zustand/middleware";

/**
 * The save: its shape, how unknown JSON is narrowed into it, and where it is
 * kept.
 *
 * This used to be `game/state.ts`, which made sense when it *was* the store —
 * the old router called load and save directly. Zustand owns the state now, so
 * a file defining the save had no business sitting in the game directory, where
 * nothing else imported it.
 *
 * It is one file rather than three because the chain was `state.ts` doing the
 * Preferences I/O, `storage.ts` adapting that for persist, and the store
 * configuring persist — two of those hops existed only to hand a value along.
 */

/** Storage key. The store's persist config names the same slot. */
export const SAVE_KEY = "burning-rubber:save";

/**
 * A run once it has been banked.
 *
 * `isBest` is the one thing the engine could not tell you: it is a comparison
 * against the previous best, which only the store holds.
 */
export interface RunResult extends FinishedRun {
	isBest: boolean;
}

export interface SaveState {
	best: number;
	/** Daily challenge progress: last day completed, and the run of them. */
	daily: DailyState;
	coins: number;
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

/**
 * Narrow unknown JSON to a SaveState, discarding anything that no longer exists.
 *
 * Discarding is the migration. A save written when steering was a stored
 * preference carries a `control` key; nothing reads it here, so it is simply
 * not copied across and disappears on the next write. No version number, no
 * migration step — the narrowing is the only way in, so anything it does not
 * name cannot survive.
 */
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
		equipped,
		lastRun: reviveRun(value.lastRun),
		onboarded: value.onboarded === true,
		owned,
		upgrades: reviveUpgrades(value.upgrades),
	};
};

/**
 * Persist's storage engine, over Capacitor Preferences.
 *
 * Written by hand rather than with `createJSONStorage` for one reason: the
 * default writes zustand's `{ state, version }` envelope, and every save that
 * already exists — on devices, and seeded by both e2e suites — is a bare
 * `SaveState` object. Switching format would silently orphan them all.
 *
 * Because the store's state *is* the save, both directions are a straight
 * hand-off. `revive` stays the single narrowing path in, and the catch stays
 * with it: a corrupt save should cost the player their progress, not the
 * ability to launch the game.
 *
 * `name` is ignored throughout — `SAVE_KEY` above is the one definition, and
 * persist is configured with it so the two cannot drift.
 */
export const playerStorage: PersistStorage<SaveState> = {
	getItem: async () => {
		try {
			const { value } = await Preferences.get({ key: SAVE_KEY });
			return { state: value ? revive(JSON.parse(value)) : { ...FRESH } };
		} catch {
			return { state: { ...FRESH } };
		}
	},
	removeItem: async () => {
		await Preferences.remove({ key: SAVE_KEY });
	},
	setItem: async (_name, value) => {
		await Preferences.set({
			key: SAVE_KEY,
			value: JSON.stringify(value.state),
		});
	},
};
