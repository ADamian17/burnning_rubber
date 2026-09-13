import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

/**
 * The frame every screen sits in.
 *
 * `.screen` is what caps the layout at 393x852 and centres it, so a screen that
 * forgets it stretches to the window on the web build. `.glow` is the warm
 * radial behind everything; it carries no content and exists only so the ink
 * background is not flat.
 *
 * Both were repeated in every screen's template string. A component means a new
 * screen cannot leave one out.
 */
const Screen = ({ children }: Props) => {
  return (
    <div className="screen">
      <div className="glow" />
      {children}
    </div>
  );
};

export default Screen;
