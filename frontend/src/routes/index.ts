import { createFileRoute } from "@tanstack/react-router";
import { Home } from "../pages/Home";
import { loadHomeAdmission } from "../features/auth/auth-routing";
import { sanitizeAppPath } from "../features/auth/login-search";

export type HomeSearch = {
	redirect?: string;
};

const validateSearch = (search: Record<string, unknown>): HomeSearch => ({
	redirect:
		typeof search["redirect"] === "string"
			? sanitizeAppPath(search["redirect"])
			: undefined,
});

export const Route = createFileRoute("/")({
	beforeLoad: async ({ search }) => loadHomeAdmission(search.redirect),
	component: Home,
	validateSearch,
});
