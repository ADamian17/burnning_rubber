import { SplashScreen } from "@capacitor/splash-screen";
import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import styles from "./RootLayout.module.scss";

/**
 * The frame every screen is drawn in: the 393×852 box and the glow behind it.
 *
 * It also hides the native splash, which is the only thing here that is not
 * layout. `launchAutoHide: false` in capacitor.config means iOS holds its splash
 * until something asks it not to — so if nothing does, the game runs underneath
 * a picture of itself and no tap ever reaches it. That shipped once already
 * (5f1f7ec, "Hide the native splash, which was covering the game forever") and
 * came back when `main.ts` was rewritten as `main.tsx` and the call was not
 * carried over.
 *
 * Nothing can catch this but a device. On the web the plugin is a no-op, so the
 * unit tests, the 22 visual baselines and a full browser tour all pass with the
 * app unreachable on a phone.
 *
 * Here rather than in `main.tsx` because this effect runs after the first commit
 * — the frame and its screen are on the glass — so the native splash is replaced
 * by a painted app rather than by a blank window. Both grounds are `--ink`, so
 * the handoff is invisible.
 */
const RootLayout = () => {
  useEffect(() => {
    // fire and forget: a splash that will not hide is bad, but an app that will
    // not start because of it is worse
    SplashScreen.hide().catch((error: unknown) => {
      console.error("[burning-rubber] native splash failed to hide", error);
    });
  }, []);

  return (
    <main className={styles.root}>
      <div className={styles.glow} />

      <section className={styles.screen}>
        <Outlet />
      </section>
    </main>
  );
};

export default RootLayout;
