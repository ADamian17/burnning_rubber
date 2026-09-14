import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";
import styles from "./Section.module.scss";

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

/**
 * A titled block of a screen — the settings groups, the daily card, the credits
 * list, the summary figures.
 *
 * It owns the column and the gap between its children, and nothing else. The
 * heading is deliberately not a prop: settings pairs its title with a reset
 * button on the same row, so a `title` string would only cover the simple cases
 * and force that screen back out to raw markup. `SectionTitle` is a separate
 * component the caller places.
 *
 * Renders `<section>` rather than a div, since that is what this is.
 */
const Section = ({ children, className, ...rest }: SectionProps) => (
  <section className={clsx(styles.section, className)} {...rest}>
    {children}
  </section>
);

export default Section;
