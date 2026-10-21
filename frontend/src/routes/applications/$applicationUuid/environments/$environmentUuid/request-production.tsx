import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

export const Route = createFileRoute(
	"/applications/$applicationUuid/environments/$environmentUuid/request-production"
)({
	component: lazy(async () => ({
		default: (
			await import(
				"../../../../../features/application-environments/pages/ProductionEnvironmentRequestPage"
			)
		).ProductionEnvironmentRequestPage,
	})),
});