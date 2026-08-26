import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$applicationInformationUuid/readiness"
)({
	beforeLoad: ({ params }) => {
		throw redirect({
			href: `/workspaces/${params.workspaceUuid}/applications/${params.applicationInformationUuid}/checklist-and-evidence`,
			replace: true,
		}) as unknown as Error;
	},
});
