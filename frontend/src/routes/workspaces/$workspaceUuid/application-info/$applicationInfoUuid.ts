import { Outlet, createFileRoute } from "@tanstack/react-router";
import React from "react";
import { requireAuthenticatedUser } from "../../../../features/auth/auth-routing";

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/application-info/$applicationInfoUuid"
)({
	beforeLoad: async ({ params }) =>
		requireAuthenticatedUser(
			`/workspaces/${params.workspaceUuid}/application-info/${params.applicationInfoUuid}`
		),
	component: () => React.createElement(Outlet),
});