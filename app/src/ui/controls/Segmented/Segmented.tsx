import { cva } from "class-variance-authority";
import { type ReactNode, useId } from "react";
import styles from "./Segmented.module.scss";

const segment = cva(styles.item, {
  defaultVariants: { selected: false },
  variants: { selected: { false: null, true: styles.selected } },
});

export interface SegmentedOption<T extends string> {
  icon?: ReactNode;
  label: string;
  value: T;
}

export interface SegmentedProps<T extends string> {
  /** Names the group for assistive tech; rendered as a clipped legend. */
  label: string;
  onChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
  value: T;
}

/**
 * A one-of-several picker.
 *
 * Built on real `<input type="radio">` elements rather than buttons carrying
 * `role="radio"`. The role alone only claims the semantics; the native input
 * brings the behaviour with it — arrow keys move between segments, the group
 * takes a single tab stop, and the browser handles the roving focus. Hand-
 * rolling all of that onto buttons is the usual way a segmented control ends up
 * unreachable from a keyboard.
 *
 * Each input is clipped rather than hidden, because `display: none` and
 * `visibility: hidden` both take it out of the focus order and cost exactly the
 * keyboard support it is here for. The label is the visible control, and it
 * draws the focus ring on the input's behalf.
 *
 * `useId` supplies the shared `name`, which is what makes the browser treat the
 * inputs as one group; two Segmenteds on a screen would otherwise fight over
 * each other's selection.
 *
 * Selection is carried by fill rather than a check mark, so it reads at a glance
 * mid-run. Segments stay equal width (`flex: 1 1 0`) so all three clear the 44pt
 * touch minimum even at three-up.
 *
 * Nothing renders this yet — the steering-mode picker it was drawn for was
 * dropped when tap-lanes and tilt went. It is here because the design system
 * still specifies it, so keep that in mind before treating it as proven.
 */
const Segmented = <T extends string>({
  label,
  onChange,
  options,
  value,
}: SegmentedProps<T>) => {
  const name = useId();

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{label}</legend>
      {/* the flex row is its own element: fieldset has a long history of
          refusing to be a flex container, and this sidesteps the question */}
      <div className={styles.group}>
        {options.map((option) => (
          <label className={segment({ selected: option.value === value })} key={option.value}>
            <input
              checked={option.value === value}
              className={styles.input}
              name={name}
              onChange={() => onChange(option.value)}
              type="radio"
              value={option.value}
            />
            {option.icon}
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
};

export default Segmented;
