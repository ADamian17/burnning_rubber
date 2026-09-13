import { createMemoryRouter } from "react-router-dom";
import RootLayout from "../layouts/RootLayout";
import Credits from "../screens/Credits/Credits";
import Daily from "../screens/Daily/Daily";
import Garage from "../screens/Garage/Garage";
import MainMenu from "../screens/MainMenu/MainMenu";
import Onboarding from "../screens/Onboarding/Onboarding";
import Run from "../screens/Run/Run";
import Settings from "../screens/Settings/Settings";
import Shop from "../screens/Shop/Shop";
import Splash from "../screens/Splash/Splash";
import Summary from "../screens/Summary/Summary";
import { hydrate } from "../store/player/usePlayerStore";

/**
 * Memory, not browser: there is no URL bar in a Capacitor webview, nothing
 * deep-links into the game, and keeping history in memory means the phone and
 * web builds behave identically.
 *
 * `RootLayout` is the parent rather than any real screen. A layout route always
 * renders, so putting a screen there shows it on top of everything else — and
 * with no <Outlet /> in it, nothing else renders at all.
 *
 * Splash is `index`, so it is what `/` shows and leaving it shows something
 * else. Child paths are relative, which is what nests them rather than only
 * appearing to.
 *
 * The three overlays — pause, reset confirm, unlock — are not here yet. They
 * layer over a screen rather than replacing it, so they want nested routes with
 * an outlet of their own, and that shape is still undecided.
 */
const mainRouter = createMemoryRouter(
	[
		{
			Component: RootLayout,
			/*
			 * The save is read here so no screen's first render can see a fresh one.
			 *
			 * It matters beyond a flash of BEST 0: the splash *navigates* from
			 * `onboarded`, and a re-render cannot undo a navigation already made.
			 *
			 * A loader rather than awaiting in main.tsx, because the router holds a
			 * route back until this resolves — the guarantee then survives anyone
			 * adding a second entry point. And a loader rather than `middleware`,
			 * which fits the intent better but sits behind the v8_middleware future
			 * flag; loading the save genuinely is fetching data a route needs.
			 */
			loader: async () => {
				await hydrate();
				return null;
			},
			children: [
				{ index: true, Component: Splash },
				{ path: "menu", Component: MainMenu },
				{ path: "onboarding", Component: Onboarding },
				{ path: "garage", Component: Garage },
				{ path: "shop", Component: Shop },
				{ path: "daily", Component: Daily },
				{ path: "settings", Component: Settings },
				{ path: "credits", Component: Credits },
				{ path: "run", Component: Run },
				{ path: "summary", Component: Summary },
			],
		},
	],
	{
		initialEntries: ["/"],
	},
);

export default mainRouter;
