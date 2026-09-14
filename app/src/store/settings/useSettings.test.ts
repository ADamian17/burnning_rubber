import { beforeEach, describe, expect, it } from 'vitest';
import useSettings from './useSettings';
import { DEFAULT_SETTINGS } from './useSettings.utils';

const state = () => useSettings.getState();

beforeEach(() => {
  useSettings.setState({ ...DEFAULT_SETTINGS });
});

/*
 * These cases came from the player store, which used to own the three switches.
 * They moved here with the state rather than being deleted along with it — the
 * guarantees are the same, only the store answering for them changed.
 */
describe('settings', () => {
  it('toggles each switch independently', () => {
    state().toggle('music');
    expect(state().music).toBe(false);
    expect(state().sfx).toBe(true);
    expect(state().haptics).toBe(true);

    state().toggle('music');
    expect(state().music).toBe(true);
  });

  it('starts every switch on', () => {
    // `value !== false` and `!!value` differ on a missing flag, and getting it
    // wrong silently mutes a returning player
    expect(state().haptics).toBe(true);
    expect(state().music).toBe(true);
    expect(state().sfx).toBe(true);
  });

  it('restores the defaults on reset', () => {
    state().toggle('music');
    state().toggle('sfx');
    state().reset();
    expect(state().music).toBe(true);
    expect(state().sfx).toBe(true);
  });

  /*
   * A progress reset must not reach the switches. They live in a different
   * store now, so this holds by construction rather than by remembering to
   * spare them by name — but that is exactly the kind of guarantee worth
   * pinning, since it used to be a hand-written exception.
   */
  it('is untouched by a progress reset', async () => {
    const { usePlayerStore } = await import('../player/usePlayerStore');
    state().toggle('music');
    usePlayerStore.getState().reset();
    expect(state().music).toBe(false);
  });
});
