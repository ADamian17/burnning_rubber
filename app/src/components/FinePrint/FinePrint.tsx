import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";
import styles from "./FinePrint.module.scss";

export interface FinePrintProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

/**
 * The closing line at the foot of a screen.
 *
 * Named for the treatment rather than the content, because the two screens that
 * use it put different things in it — settings ends on a version string,
 * credits on a copyright. The class it replaces was called `settings__version`,
 * which was already wrong for half its callers and made it look unsafe to touch
 * from anywhere but settings.
 *
 * No variants: there is one way this text looks, and a caller that needs it
 * placed differently passes `className` rather than asking for a mode.
 */
const FinePrint = ({ children, className, ...rest }: FinePrintProps) => (
  <p className={clsx(styles.base, className)} {...rest}>
    {children}
  </p>
);

export default FinePrint;
