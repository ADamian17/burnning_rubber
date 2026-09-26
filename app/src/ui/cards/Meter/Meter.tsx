import { cva } from "class-variance-authority";
import styles from "./Meter.module.scss";

const pip = cva(styles.pip, {
  defaultVariants: { lit: false },
  variants: { lit: { false: null, true: styles.lit } },
});

interface Props {
  /** How many pips are lit, out of six. */
  value: number;
}

/**
 * Six discrete pips, never a bar.
 *
 * Players compare cars and upgrade levels by counting, and a continuous bar
 * makes two close values look identical.
 */
const Meter = ({ value }: Props) => (
  <span className={styles.meter}>
    {Array.from({ length: 6 }, (_, i) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: the pips are positions
      <i className={pip({ lit: i < value })} key={i} />
    ))}
  </span>
);

export default Meter;
