import { createMemoryRouter } from "react-router-dom";
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
import RootLayout from "./RootLayout";

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
