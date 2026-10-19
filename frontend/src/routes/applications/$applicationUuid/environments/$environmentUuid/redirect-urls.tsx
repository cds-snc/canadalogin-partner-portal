import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

export const Route = createFileRoute(
	"/applications/$applicationUuid/environments/$environmentUuid/redirect-urls"
)({
	component: lazy(async () => ({
		default: (
			await import(
				"../../../../../features/application-environments/pages/EnvironmentRedirectUrlsPage"
			)
		).EnvironmentRedirectUrlsPage,
	})),
});