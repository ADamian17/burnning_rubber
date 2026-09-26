import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./IconButton.module.scss";

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "type"> {
  /** Required: there is no text child, so this is the control's only name. */
  "aria-label": string;
  icon: ReactNode;
}

/**
 * The 48×48 icon button — the garage arrows, the run pause control.
 *
 * 48 rather than the 44pt minimum because these sit near the screen edge, where
 * touch accuracy is worst.
 *
 * No cva here: the button has one look. Its disabled state is a fade the
 * stylesheet applies from the attribute, not a second set of styling to pick
 * between, so there is no variant to declare.
 *
 * `aria-label` is a required prop rather than an optional pass-through. The
 * button renders an icon and nothing else, so there is no text to fall back on
 * and omitting it ships an unnamed control.
 */
const IconButton = ({ className, icon, ...rest }: IconButtonProps) => (
  <button className={clsx(styles.base, className)} type="button" {...rest}>
    {icon}
  </button>
);

export default IconButton;
