import { Outlet, createFileRoute } from "@tanstack/react-router";
import { requireAuthenticatedUser } from "../../features/auth/auth-routing";

export const Route = createFileRoute("/applications/$applicationUuid")({
	beforeLoad: async ({ params }) =>
		requireAuthenticatedUser(`/applications/${params.applicationUuid}`),
	component: Outlet,
});