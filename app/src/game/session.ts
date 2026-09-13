/**
 * What the next run is, when that is not the ordinary thing.
 *
 * Deliberately not part of SaveState: "the next run is today's daily" is true
 * for one tap, and persisting it would mean a player who force-quits on the
 * daily screen comes back still owing a daily run they never started.
 *
 * Module state rather than a router field because the router's state is the
 * save, and this is not saved. The garage's carousel index already lives this
 * way for the same reason.
 */
let pendingDay: string | null = null;

/** Mark the next run as the daily for `key`. */
export const queueDaily = (key: string): void => {
  pendingDay = key;
};

/** Consume the queued daily, if any. Reading it clears it. */
export const takeDaily = (): string | null => {
  const day = pendingDay;
  pendingDay = null;
  return day;
};

/** Forget any queued daily, for a run started from somewhere else. */
export const clearDaily = (): void => {
  pendingDay = null;
};
