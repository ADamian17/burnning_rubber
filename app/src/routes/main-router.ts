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

/**
 * Memory, not browser: there is no URL bar in a Capacitor webview, nothing
 * deep-links into the game, and keeping history in memory means the phone and
 * web builds behave identically.
 *
 * The three overlays — pause, reset confirm, unlock — are not here yet. They
 * layer over a screen rather than replacing it, so they want nested routes with
 * an <Outlet />, and that is still an open decision.
 */
const mainRouter = createMemoryRouter([
  {
    path: "/",
    Component: MainMenu,
    children: [
      {
        path: "/daily",
        Component: Daily,
      },
      {
        path: "/settings",
        Component: Settings,
      },
      {
        path: "/credits",
        Component: Credits,
      },
      {
        Component: Splash,
        path: "/splash",
      },
      {
        path: "/onboarding",
        Component: Onboarding,
      },
      {
        path: "/garage",
        Component: Garage,
      },
      {
        path: "/shop",
        Component: Shop,
      },
      {
        path: "/run",
        Component: Run,
      },
      {
        path: "/summary",
        Component: Summary,
      },
    ],
  },
]);

export default mainRouter;
