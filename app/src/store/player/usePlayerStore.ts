import { create } from "zustand";
import { persist } from "zustand/middleware";
import { challengeFor, met, streakAfter } from "../../features/daily/challenge";
import { PLAYERS } from "../../game/fleet";
import { revive, SAVE_KEY } from "./save";
import { nextCost } from "../../game/upgrades";
import { playerStorage } from "./save";
import type { PlayerState, PlayerStore } from "./usePlayerStore.types";

/**
 * Everything about this player that outlives a run, and the rules that change it.
 *
 * The state is the save, flat — `usePlayerStore(s => s.coins)`, not
 * `s.save.coins`. `partialize` is what keeps the actions out of what gets
 * written; see `./usePlayerStore.types.ts` for why that trade was taken.
 *
 * Named for the player rather than for storage: `save` described the mechanism,
 * not the contents. What is in here is progress (best, coins), what they own
 * (cars, upgrade levels), what they have chosen (audio and feel switches), and
 * where they are in the daily — all of it theirs, none of it about a file.
 *
 * Zustand holds only this. Navigation belongs to react-router, and the running
 * game to neither — it mutates sixty times a second and lives outside React.
 *
 * Persistence is the `persist` middleware over a hand-written storage engine
 * (`./storage.ts`), so no action has to remember to write.
 *
 * `skipHydration` is on, and boot awaits `hydrate()` before mounting React.
 * Capacitor Preferences is async, so letting persist hydrate on its own schedule
 * would paint a fresh save and swap in the real numbers a frame later — BEST 0
 * becoming BEST 12,480 in front of the player. Awaiting it keeps the first paint
 * correct, which is the one property worth preserving from the old boot.
 *
 * See `./usePlayerStore.types.ts` for what it holds and what each action promises.
 */
export const usePlayerStore = create<PlayerStore>()(
	persist(
		(set, get) => {
			return {
				// a real, valid save from the start. revive(null) is the existing way
				// to ask for defaults, so "fresh" is not defined in two places
				...revive(null),

				buyCar: (id) => {
					const { coins, owned } = get();
					const cost = PLAYERS[id].cost;
					// re-checked here, not trusted from the view that drew the button:
					// the render that offered it may be a frame behind the coins
					if (owned.includes(id) || cost > coins) return;
					set({ coins: coins - cost, equipped: id, owned: [...owned, id] });
				},

				buyUpgrade: (id) => {
					const { coins, upgrades } = get();
					const cost = nextCost(id, upgrades[id]);
					if (cost === null || cost > coins) return;
					set({
						coins: coins - cost,
						upgrades: { ...upgrades, [id]: upgrades[id] + 1 },
					});
				},

				completeOnboarding: () => set({ onboarded: true }),

				equip: (id) => {
					if (!get().owned.includes(id)) return;
					set({ equipped: id });
				},

				recordRun: (run, day) => {
					const { best, coins, daily } = get();

					/*
					 * A daily pays out only the first time it is met on its day,
					 * checked against `lastDone` rather than a flag set here — so a
					 * save carried across a reinstall cannot claim the same day twice.
					 */
					const earned =
						day !== null &&
						daily.lastDone !== day &&
						met(challengeFor(day), run)
							? challengeFor(day).reward
							: 0;

					set({
						best: Math.max(best, run.score),
						coins: coins + run.coins + earned,
						daily:
							earned > 0 && day !== null
								? { lastDone: day, streak: streakAfter(daily, day) }
								: daily,
						lastRun: run,
					});
				},

				reset: () => {
					/*
					 * Everything a fresh save has, except `onboarded` — sitting through
					 * the tutorial again is a punishment for using a settings button.
					 * Built from revive(null) so a field added to SaveState later is
					 * wiped by default rather than silently surviving a reset nobody
					 * remembered to update.
					 *
					 * The audio switches used to be spared here by name. They live in
					 * `useSettings` now, so a progress reset cannot reach them at all.
					 */
					const { onboarded } = get();
					set({ ...revive(null), onboarded });
				},
			};
		},
		{
			name: SAVE_KEY,
			/*
			 * Separates the data from the actions, which is the one job the old
			 * `save` wrapper did for free. Listed by name rather than rest-spread
			 * so the compiler checks it: `PlayerState` is `SaveState`, so a field
			 * added to the save and forgotten here fails to typecheck rather than
			 * silently stopping being persisted.
			 */
			partialize: (state): PlayerState => ({
				best: state.best,
				coins: state.coins,
				daily: state.daily,
				equipped: state.equipped,
				lastRun: state.lastRun,
				onboarded: state.onboarded,
				owned: state.owned,
				upgrades: state.upgrades,
			}),
			skipHydration: true,
			storage: playerStorage,
		},
	),
);

/**
 * Load the save before anything renders.
 *
 * Awaited by the root route's loader, so no screen's first render can read a
 * fresh save. That matters beyond a flash of BEST 0: the splash *navigates*
 * from `onboarded`, and a re-render cannot undo a navigation already made.
 *
 * Idempotent, because a loader is not a one-shot — react-router re-runs it on
 * revalidation, and re-reading storage each time would be wasted work at best
 * and a race against a pending write at worst.
 */
export const hydrate = async (): Promise<void> => {
	if (usePlayerStore.persist.hasHydrated()) return;
	await usePlayerStore.persist.rehydrate();
};
