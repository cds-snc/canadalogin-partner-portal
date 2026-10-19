import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

export const Route = createFileRoute(
	"/applications/$applicationUuid/environments/$environmentUuid/messages-verified"
)({
	component: lazy(async () => ({
		default: (
			await import("../../../../../features/application-environments/pages/EnvironmentMessagesVerifiedPage")
		).EnvironmentMessagesVerifiedPage,
	})),
});
