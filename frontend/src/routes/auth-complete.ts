import { createFileRoute } from "@tanstack/react-router";
import { completeLoginRedirect } from "../features/auth/auth-routing";
import type { LoginRedirectSearch } from "../features/auth/login-search";
import { AuthCompletePage } from "../features/auth/pages/AuthCompletePage";

const validateSearch = (
	search: Record<string, unknown>
): LoginRedirectSearch => ({
	redirect:
		typeof search["redirect"] === "string" ? search["redirect"] : undefined,
	uiLocales:
		typeof search["ui_locales"] === "string" ? search["ui_locales"] : undefined,
});

export const Route = createFileRoute("/auth-complete")({
	beforeLoad: async ({ search }) =>
		completeLoginRedirect(search.redirect, search.uiLocales),
	component: AuthCompletePage,
	validateSearch,
});
