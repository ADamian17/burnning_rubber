import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import IconButton from "../../ui/buttons/IconButton/IconButton";

interface Props {
  /** Sits at the right of the bar — the garage and shop put a coin plate here. */
  children?: ReactNode;
  title: string;
}

/**
 * Title bar with a back button.
 *
 * Back is `navigate(-1)` rather than a route, so it returns wherever the player
 * came from. The old router hand-rolled a stack to do this; history already is
 * one.
 *
 * The class names are `garage__*` because the garage is where this bar was
 * first designed and every other screen borrowed it. Worth renaming eventually,
 * but not while the visual baselines are the thing proving this refactor
 * changed nothing.
 */
const ScreenHeader = ({ children, title }: Props) => {
  const navigate = useNavigate();

  return (
    <header className="garage__head">
      <IconButton
        aria-label="Back"
        data-back
        icon={
          <svg
            fill="none"
            height="21"
            stroke="#F28D35"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.6"
            viewBox="0 0 24 24"
            width="21"
          >
            <title>Back</title>
            <path d="M14.6 5.4 8 12l6.6 6.6" />
          </svg>
        }
        onClick={() => navigate(-1)}
      />
      <div className="garage__title">{title}</div>
      {children}
    </header>
  );
};

export default ScreenHeader;
