import "./style.css";
import "./ui/ui.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import mainRouter from "./routes/main-router";
import { hydrate } from "./store/player/usePlayerStore";

/**
 * The save is loaded before anything renders.
 *
 * Capacitor Preferences is async, so the store starts on a fresh save and only
 * becomes the real one once storage resolves. Mounting first meant every screen
 * read defaults on its first render: the splash sent a returning player to
 * onboarding, and the menu would have shown BEST 0 before swapping in their
 * actual score a frame later.
 *
 * Awaiting it here is why `skipHydration` is set on the store — persist would
 * otherwise hydrate on its own schedule, which is exactly the race above.
 */
const init = async () => {
	const root = document.getElementById("root");
	if (!root) throw new Error("#root missing from the document");

	await hydrate();

	createRoot(root).render(
		<StrictMode>
			<RouterProvider router={mainRouter} />
		</StrictMode>,
	);
};

void init();
