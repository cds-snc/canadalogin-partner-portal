import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { requireApplicationInformationRead } from "../../../features/auth/auth-routing";

type ApplicationInformationListSearch = {
	deleted?: "1";
};

const validateSearch = (
	search: Record<string, unknown>
): ApplicationInformationListSearch => ({
	deleted: search["deleted"] === "1" ? "1" : undefined,
});

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/application-information"
)({
	beforeLoad: async ({ location, params }) => {
		const legacyBase = `/workspaces/${params.workspaceUuid}/application-information`;
		await requireApplicationInformationRead(legacyBase, params.workspaceUuid);
		throw redirect({
			href: location.pathname.replace(
				legacyBase,
				`/workspaces/${params.workspaceUuid}/applications`
			),
			replace: true,
		}) as unknown as Error;
	},
	component: Outlet,
	validateSearch,
});
