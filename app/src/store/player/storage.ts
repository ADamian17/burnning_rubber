import type { PersistStorage } from "zustand/middleware";
import { loadState, resetState, saveState } from "../../game/state";
import type { PlayerState } from "./usePlayerStore.types";

/**
 * Persist's storage engine, over Capacitor Preferences.
 *
 * Written by hand rather than with `createJSONStorage` for one reason: the
 * default writes zustand's `{ state, version }` envelope, and every save that
 * already exists — on devices, and seeded by both e2e suites — is a bare
 * `SaveState` object. Switching format would silently orphan them all.
 *
 * So this reads and writes the bare shape, and delegates to the functions that
 * already do it. `loadState` keeps `revive()` as the single narrowing path, and
 * keeps its own catch: a corrupt save costs the player their progress, not the
 * ability to launch the game.
 *
 * `name` is ignored throughout — `state.ts` owns `SAVE_KEY`, and persist is
 * configured with the same value so the two cannot drift.
 */
export const playerStorage: PersistStorage<PlayerState> = {
	getItem: async () => ({ state: { save: await loadState() } }),
	removeItem: async () => {
		await resetState();
	},
	setItem: async (_name, value) => {
		await saveState(value.state.save);
	},
};
