import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.scss";

const button = cva(styles.base, {
  defaultVariants: { disabled: false, size: "default", variant: "primary" },
  variants: {
    /*
     * A variant rather than a bare attribute, because disabled is a fill here,
     * not only a state: it replaces the variant's gradient and cancels the
     * press. Declaring it lets cva pick the enabled/disabled pair, so the CSS
     * never has to exclude one in a `:not()`.
     */
    disabled: { false: styles.enabled, true: styles.disabled },
    /* `default` takes its height from the fill; `small` overrides it. */
    size: { default: null, small: styles.small },
    variant: {
      danger: styles.danger,
      primary: styles.primary,
      secondary: styles.secondary,
    },
  },
});

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "disabled" | "type">,
    VariantProps<typeof button> {
  children: ReactNode;
}

/**
 * The primary, secondary and danger buttons.
 *
 * There is deliberately no `icon` prop. The base is already a flex row with a
 * 12px gap, so an icon is just another child and the caller decides where it
 * sits — which matters, because the garage reads BUY 🪙 1,200 with the coin in
 * the middle while the pause overlay reads ↺ RESTART with it in front. An
 * `icon` prop would have to pick one order and be wrong on the other screen.
 *
 * Disabled renders as a real `<button disabled>` rather than the `<div>` the
 * screens used to emit, so the control stays announced and focusable. Every
 * variant paints its own background, so this never exposes the native
 * `buttonface` grey a bare button over the ink ground would.
 *
 * `type` is pinned rather than defaulted: these sit inside screens that may
 * later contain a form, where a bare button submits it.
 */
const Button = ({ children, className, disabled, size, variant, ...rest }: ButtonProps) => (
  <button
    className={button({ className, disabled, size, variant })}
    disabled={disabled || undefined}
    type="button"
    {...rest}
  >
    {children}
  </button>
);

export default Button;
