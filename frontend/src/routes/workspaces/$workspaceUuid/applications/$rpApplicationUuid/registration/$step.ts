import { createFileRoute, redirect } from "@tanstack/react-router";
import { lazy } from "react";
import { requireCapability } from "../../../../../../features/auth/auth-routing";
import { isWorkspaceRPRegistrationStep } from "../../../../../../features/workspaces/workspace-rp-registration-flow";

const WorkspaceRPRegistrationStepPage = lazy(async () => ({
	default: (
		await import("../../../../../../features/workspaces/pages/WorkspaceRPRegistrationStepPage")
	).WorkspaceRPRegistrationStepPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$rpApplicationUuid/registration/$step"
)({
	beforeLoad: async ({ params }) => {
		if (!isWorkspaceRPRegistrationStep(params.step)) {
			throw redirect({
				href: `/workspaces/${encodeURIComponent(params.workspaceUuid)}/applications/${encodeURIComponent(params.rpApplicationUuid)}`,
				replace: true,
			}) as unknown as Error;
		}
		return requireCapability(
			`/workspaces/${params.workspaceUuid}/applications/${params.rpApplicationUuid}/registration/${params.step}`,
			"rp_configuration_write",
			params.workspaceUuid
		);
	},
	component: WorkspaceRPRegistrationStepPage,
});
