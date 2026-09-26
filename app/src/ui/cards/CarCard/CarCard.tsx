import { cva } from "class-variance-authority";
import Plate from "../../hud/Plate/Plate";
import Meter from "../Meter/Meter";
import styles from "./CarCard.module.scss";

/** Whether the player owns this car, and whether it is the one they drive. */
export type Ownership = "equipped" | "locked" | "owned";

const chip = cva(styles.chip, {
  variants: {
    ownership: {
      equipped: styles.equipped,
      locked: styles.locked,
      owned: styles.owned,
    },
  },
});

/* Locked cars are greyed and dimmed, so the art reads as unavailable at a
   glance rather than only through the chip above it. */
const art = cva(styles.art, {
  variants: {
    ownership: { equipped: null, locked: styles.artLocked, owned: null },
  },
});

export interface CarStat {
  name: string;
  /** Lit pips, out of six. */
  value: number;
}

export interface CarCardProps {
  klass: string;
  /** Points of clearance either side in a lane — width, restated as what it costs. */
  laneRoom: number;
  name: string;
  ownership: Ownership;
  src: string;
  stats: readonly CarStat[];
  width: number;
}

/**
 * One car, with the stats that decide whether it is worth buying.
 *
 * The card's job is to make width legible as a trade rather than a number.
 * SPEED, HANDLING and GRIP are authored; SLIMNESS is derived from width, and
 * LANE ROOM restates that as the concrete thing it buys. A wide car is genuinely
 * harder to drive, and this is where the player is told so before spending.
 *
 * The `data-ownership` and `data-car-name` hooks are the test seam. The class
 * names here are hashed by CSS modules, so a spec cannot select on them — the
 * end-to-end suite learned that the hard way when `.screen--centred` moved into
 * a module and took every snapshot down with it.
 *
 * Ownership drives two separate cva calls rather than one, because it styles two
 * unrelated elements — the chip's fill and the art's filter. Threading one
 * result into both would mean a class that means "locked" carrying rules for
 * elements it is not on.
 */
const CarCard = ({
  klass,
  laneRoom,
  name,
  ownership,
  src,
  stats,
  width,
}: CarCardProps) => (
  <article className={styles.card}>
    <span className={chip({ ownership })} data-ownership={ownership}>
      {ownership.toUpperCase()}
    </span>
    <div className={styles.artBox}>
      <img alt={name} className={art({ ownership })} src={src} />
    </div>
    <h1 className={styles.name} data-car-name>
      {name}
    </h1>
    <p className={styles.klass}>
      {klass} &middot; {width}PT
    </p>

    <div className={styles.stats}>
      {stats.map((stat) => (
        <div className={styles.stat} key={stat.name}>
          <span className={styles.statName}>{stat.name}</span>
          <Meter value={stat.value} />
        </div>
      ))}
    </div>

    <Plate className={styles.slack}>
      <span className="lbl">LANE ROOM</span>
      <span className="num" style={{ color: "var(--lite)", fontSize: "18px" }}>
        {laneRoom.toFixed(1)}PT
      </span>
    </Plate>
  </article>
);

export default CarCard;
