import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { requireAnyCapability } from "../../../../../../../features/auth/auth-routing";

const ApplicationRPConfigurationProductionReviewPage = lazy(async () => ({
	default: (
		await import("../../../../../../../features/workspaces/pages/ApplicationRPConfigurationProductionReviewPage")
	).ApplicationRPConfigurationProductionReviewPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/$rpConfigurationUuid/production-review"
)({
	beforeLoad: async ({ location, params }) =>
		requireAnyCapability(
			location.pathname,
			[
				"production_review_request_write",
				"production_review",
				"rp_configuration_read",
			],
			params.workspaceUuid
		),
	component: ApplicationRPConfigurationProductionReviewPage,
});
