import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";
import styles from "./Plate.module.scss";

export interface PlateProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * The plate that readouts sit on.
 *
 * It carries its own ground — 86% opaque ink, hard black border, an inset warm
 * highlight — so the road underneath is free to run light without the value
 * ever dropping out.
 *
 * Only the ground, and so no variants: the design system draws three plates (a
 * stacked score, an inline distance, a coin count) that differ entirely in what
 * sits inside them. Callers supply that, and size the plate through `className`.
 *
 * This is the menu and garage plate. The score, distance and coin readouts
 * during a run are painted on the canvas by `game.ts`, not built from this.
 */
const Plate = ({ children, className, ...rest }: PlateProps) => (
  <div className={clsx(styles.base, className)} {...rest}>
    {children}
  </div>
);

export default Plate;
