import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import mainRouter from "./routes/main-router";

const init = () => {
	const root = document.getElementById("root");

	if (root) {
		const reactRoot = createRoot(root);

		reactRoot.render(
			<StrictMode>
				<RouterProvider router={mainRouter} />
			</StrictMode>,
		);
	}
};

init();
