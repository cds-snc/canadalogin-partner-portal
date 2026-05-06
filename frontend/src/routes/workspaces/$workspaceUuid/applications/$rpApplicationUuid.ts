import { Outlet, createFileRoute } from "@tanstack/react-router";
import React from "react";
import { requireAuthenticatedUser } from "../../../../features/auth/auth-routing";

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$rpApplicationUuid"
)({
	beforeLoad: async ({ params }) =>
		requireAuthenticatedUser(
			`/workspaces/${params.workspaceUuid}/applications/${params.rpApplicationUuid}`
		),
	component: () => React.createElement(Outlet),
});
