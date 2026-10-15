import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

export const Route = createFileRoute(
	"/applications/$applicationUuid/environments/$environmentUuid/credentials"
)({
	component: lazy(async () => ({
		default: (
			await import(
				"../../../../../features/application-environments/pages/EnvironmentCredentialsPage"
			)
		).EnvironmentCredentialsPage,
	})),
});