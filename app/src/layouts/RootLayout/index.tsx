import { Outlet } from "react-router-dom";
import styles from "./RootLayout.module.scss";

const RootLayout = () => {

  return (
    <main className={styles.root}>
      <div className={styles.glow} />

      <section className={styles.screen}>
        <Outlet />
      </section>
    </main>
  )
};

export default RootLayout;
