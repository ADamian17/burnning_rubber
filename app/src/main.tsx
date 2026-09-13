import "./style.css";
import "./ui/ui.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import mainRouter from "./routes/main-router";

/**
 * Mount, and nothing else.
 *
 * Loading the save is the root route's loader, not this function's job — the
 * router holds a route back until its loader resolves, so the guarantee that no
 * screen sees a fresh save survives anyone adding a second entry point here.
 */
const init = () => {
	const root = document.getElementById("root");
	if (!root) throw new Error("#root missing from the document");

	createRoot(root).render(
		<StrictMode>
			<RouterProvider router={mainRouter} />
		</StrictMode>,
	);
};

init();
