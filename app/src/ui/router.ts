import type { SaveState } from '../game/state';

/**
 * Every destination in the game.
 *
 * `run` is not a rendered screen — it hides the UI layer so the canvas beneath
 * is visible. Keeping it in the same enum means the back stack and the router
 * treat "playing" like any other place you can be, which is what makes pause
 * and the run summary route cleanly.
 */
export type Route =
  | 'credits'
  | 'daily'
  | 'garage'
  | 'menu'
  | 'onboarding'
  | 'run'
  | 'settings'
  | 'shop'
  | 'splash'
  | 'summary';

/** Overlays sit on top of the current route rather than replacing it. */
export type Overlay = 'pause' | 'resetConfirm' | 'unlock' | null;

export interface Ctx {
  /** Pop the back stack. No-op at the root. */
  back: () => void;
  /** Dismiss whatever overlay is open. */
  close: () => void;
  go: (route: Route) => void;
  /** Open an overlay over the current route. */
  open: (overlay: Overlay) => void;
  /** Re-render without touching storage — for view-only changes. */
  refresh: () => void;
  /** Merge a patch into the save, persist it, and re-render. */
  save: (patch: Partial<SaveState>) => void;
  state: SaveState;
}

export interface ScreenDef {
  /** Attach listeners after the view is in the DOM. */
  bind?: (root: HTMLElement, ctx: Ctx) => void;
  view: (ctx: Ctx) => string;
}

export interface RouterOptions {
  readonly initial: Route;
  readonly onRoute?: (route: Route, previous: Route | null) => void;
  readonly overlays: Readonly<Partial<Record<NonNullable<Overlay>, ScreenDef>>>;
  readonly persist: (state: SaveState) => Promise<void>;
  readonly root: HTMLElement;
  readonly screens: Readonly<Record<Route, ScreenDef | null>>;
  state: SaveState;
}

export const createRouter = (options: RouterOptions) => {
  const { onRoute, overlays, persist, root, screens } = options;
  let overlay: Overlay = null;
  let route: Route = options.initial;
  let state = options.state;
  const stack: Route[] = [];

  const ctx: Ctx = {
    back: () => {
      const previous = stack.pop();
      if (previous) swap(previous, false);
    },
    close: () => {
      overlay = null;
      draw();
    },
    go: (next) => swap(next, true),
    open: (next) => {
      overlay = next;
      draw();
    },
    refresh: () => draw(),
    save: (patch) => {
      state = { ...state, ...patch };
      ctx.state = state;
      void persist(state);
      draw();
    },
    state
  };

  const draw = (): void => {
    const screen = screens[route];
    if (!screen) {
      // `run` has no markup — get the UI out of the canvas's way
      root.removeAttribute('data-open');
      root.innerHTML = '';
      return;
    }
    root.setAttribute('data-open', '');
    const panel = overlay ? overlays[overlay] : undefined;
    root.innerHTML = screen.view(ctx) + (panel ? panel.view(ctx) : '');
    screen.bind?.(root, ctx);
    panel?.bind?.(root, ctx);
  };

  const swap = (next: Route, push: boolean): void => {
    if (push && next !== route) stack.push(route);
    const previous = route;
    route = next;
    overlay = null;
    draw();
    onRoute?.(next, previous);
  };

  return {
    get overlay(): Overlay {
      return overlay;
    },
    get state(): SaveState {
      return state;
    },
    go: (next: Route): void => swap(next, true),
    save: ctx.save,
    get route(): Route {
      return route;
    },
    /** Re-render in place, e.g. after the game writes a new best score. */
    refresh: (next?: SaveState): void => {
      if (next) {
        state = next;
        ctx.state = next;
      }
      draw();
    },
    start: (): void => {
      draw();
      onRoute?.(route, null);
    }
  };
};

export type Router = ReturnType<typeof createRouter>;
