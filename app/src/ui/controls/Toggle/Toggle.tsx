import { cva } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import styles from "./Toggle.module.scss";

const toggle = cva(styles.base, {
  defaultVariants: { on: false },
  variants: { on: { false: null, true: styles.on } },
});

export interface ToggleProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "onChange" | "type"> {
  /** Names the switch for screen readers — nothing inside it is text. */
  label: string;
  on: boolean;
  onChange: () => void;
}

/**
 * The on/off switch.
 *
 * Just the switch: the design system shows it inside a settings row, but the
 * row's icon and dimmed label belong to the screen that knows what is being
 * toggled. Keeping them apart is what lets the same switch sit in a row on
 * settings and stand alone elsewhere.
 *
 * `on` is a cva variant rather than a class join because the knob's position is
 * styled from the track — `.on .knob` is what slides it — so the state has to
 * land on the parent, not on the knob itself.
 *
 * `role="switch"` with `aria-checked` rather than a checkbox, because the state
 * is carried entirely by fill and knob position; there is no native control
 * underneath to inherit semantics from.
 */
const Toggle = ({ className, label, on, onChange, ...rest }: ToggleProps) => (
  <button
    aria-checked={on}
    aria-label={label}
    className={toggle({ className, on })}
    onClick={onChange}
    role="switch"
    type="button"
    {...rest}
  >
    <span className={styles.knob} />
  </button>
);

export default Toggle;
