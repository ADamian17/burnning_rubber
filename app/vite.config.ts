import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite ran on defaults until React arrived; this exists for the plugin.
 *
 * Note that `vitest.config.ts` is separate and does not load this. The invariant
 * tests import plain .ts modules from `src/game/`, which need no JSX transform —
 * if a test ever imports a component, that config needs the plugin too.
 */
export default defineConfig({
  plugins: [react()]
});
