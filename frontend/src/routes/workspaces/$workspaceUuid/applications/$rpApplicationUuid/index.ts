import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const RPApplicationDetailPage = lazy(async () => ({
	default: (
		await import("../../../../../features/workspaces/pages/RPApplicationDetailPage")
	).RPApplicationDetailPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$rpApplicationUuid/"
)({
	component: RPApplicationDetailPage,
});
