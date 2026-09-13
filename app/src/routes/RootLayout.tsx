import { Outlet } from "react-router-dom";

/**
 * The shell every screen renders into.
 *
 * Deliberately empty. A layout route always renders, so anything put here
 * appears on every screen at once — which is why a real screen cannot be the
 * parent: with Splash in this position the wordmark sat over the whole app, and
 * without an `<Outlet />` nothing else rendered at all.
 *
 * Splash is the index route instead, so `/` shows it and leaving it shows
 * something else.
 *
 * When the overlays land (pause, reset confirm, unlock) their outlet belongs
 * here too — they layer over whatever screen is beneath rather than replacing
 * it.
 */
const RootLayout = () => {
  return <Outlet />;
};

export default RootLayout;
