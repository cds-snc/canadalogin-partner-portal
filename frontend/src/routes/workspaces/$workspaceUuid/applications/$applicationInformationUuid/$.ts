import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$applicationInformationUuid/$"
)({
	beforeLoad: () => {
		throw redirect({
			href: "/error?kind=not_found",
			replace: true,
		}) as unknown as Error;
	},
});
