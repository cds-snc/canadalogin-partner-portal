import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

export const Route = createFileRoute(
	"/applications/$applicationUuid/environments/$environmentUuid/post-logout-redirect-urls"
)({
	component: lazy(async () => ({
		default: (
			await import("../../../../../features/application-environments/pages/EnvironmentPostLogoutRedirectUrlsPage")
		).EnvironmentPostLogoutRedirectUrlsPage,
	})),
});
