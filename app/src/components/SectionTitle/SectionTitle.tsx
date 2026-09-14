import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";
import styles from "./SectionTitle.module.scss";

export interface SectionTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

/**
 * The label above a section.
 *
 * An `<h2>` rather than the mix of `<div>` and `<p>` the screens had been using
 * for the same thing — it reads as a heading, so it is one, and the screens now
 * have a real outline under their `<h1>`. The styling is unchanged: every visual
 * property here is set explicitly, so the heading's user-agent size and weight
 * never show through.
 */
const SectionTitle = ({ children, className, ...rest }: SectionTitleProps) => (
  <h2 className={clsx(styles.base, className)} {...rest}>
    {children}
  </h2>
);

export default SectionTitle;
