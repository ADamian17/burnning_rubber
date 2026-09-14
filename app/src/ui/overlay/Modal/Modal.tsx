import { cva } from "class-variance-authority";
import { type ReactNode, useEffect, useId, useRef } from "react";
import styles from "./Modal.module.scss";

const panel = cva(styles.panel, {
	defaultVariants: { tone: "default" },
	variants: { tone: { danger: styles.danger, default: null } },
});

const title = cva(styles.title, {
	defaultVariants: { tone: "default" },
	variants: { tone: { danger: styles.titleDanger, default: null } },
});

export interface ModalProps {
	children: ReactNode;
	/** Dismissal — the backdrop and Escape both route here, so it must be the safe outcome. */
	onClose: () => void;
	title: string;
	tone?: "danger" | "default";
}

/**
 * A dialog, on the native element.
 *
 * `showModal()` puts it in the top layer, which is what makes this work at all:
 * `RootLayout` clips to `overflow: hidden` at a fixed 393×852 frame, and the top
 * layer escapes ancestor clipping and stacking contexts. That was the job the
 * portal used to do, and the browser does it better — it also makes the rest of
 * the page `inert`, gives the dialog `role="dialog"` and `aria-modal="true"`
 * implicitly, closes on Escape, returns focus to whatever opened it, and paints
 * the scrim through `::backdrop`. None of that is written here any more.
 *
 * Mount it conditionally; it opens on mount and its removal from the DOM takes
 * it back out of the top layer.
 */
const Modal = ({ children, onClose, title: heading, tone }: ModalProps) => {
	const ref = useRef<HTMLDialogElement>(null);
	const headingId = useId();

	useEffect(() => {
		const dialog = ref.current;
		if (!dialog) return;

		dialog.showModal();

		/*
		 * Escape closes the dialog in the browser, not in React. Without this the
		 * panel would vanish while `confirming` stayed true, and the next press of
		 * RESET PROGRESS would set a flag that was already set and open nothing.
		 *
		 * `close` rather than `cancel`, so a dismissal from any source lands here.
		 */
		const sync = (): void => onClose();

		/*
		 * `::backdrop` presses are reported against the dialog itself; anything
		 * inside the panel targets the panel, so this cannot fire from within.
		 *
		 * Bound here rather than as an `onClick` prop so every piece of native
		 * dialog wiring sits in one place. It also keeps the JSX clear of a lone
		 * mouse handler, which reads as a mouse-only affordance and is flagged as
		 * one — inaccurately here, because dismissal's keyboard path is Escape and
		 * the browser already provides it.
		 */
		const onBackdropPress = (event: MouseEvent): void => {
			if (event.target === dialog) onClose();
		};

		dialog.addEventListener("close", sync);
		dialog.addEventListener("click", onBackdropPress);
		return () => {
			dialog.removeEventListener("close", sync);
			dialog.removeEventListener("click", onBackdropPress);
		};
	}, [onClose]);

	return (
		<dialog
			aria-labelledby={headingId}
			className={styles.dialog}
			data-modal
			ref={ref}
		>
			<div className={panel({ tone })}>
				<h2 className={title({ tone })} id={headingId}>
					{heading}
				</h2>
				{children}
			</div>
		</dialog>
	);
};

export default Modal;
