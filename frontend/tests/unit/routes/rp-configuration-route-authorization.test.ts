import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	requireAnyCapability,
	requireCapability,
} from "@/features/auth/auth-routing";
import { Route as RPConfigurationRoute } from "@/routes/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/$rpConfigurationUuid";
import { Route as ConfigurationRoute } from "@/routes/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/$rpConfigurationUuid/configuration";
import { Route as ProductionReviewRoute } from "@/routes/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/$rpConfigurationUuid/production-review";

vi.mock("@/features/auth/auth-routing", () => ({
	requireAnyCapability: vi.fn(() => Promise.resolve()),
	requireCapability: vi.fn(() => Promise.resolve()),
}));

const params = {
	applicationInformationUuid: "application-uuid-1",
	rpConfigurationUuid: "configuration-uuid-1",
	workspaceUuid: "workspace-uuid-1",
};

describe("RP configuration route authorization", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("allows only partner metadata readers or CL Admin into the safe summary parent", async () => {
		const beforeLoad = (RPConfigurationRoute as any).options?.beforeLoad;

		await beforeLoad({ params });

		expect(requireAnyCapability).toHaveBeenCalledWith(
			"/workspaces/workspace-uuid-1/applications/application-uuid-1/rp-configurations/configuration-uuid-1",
			["rp_configuration_read", "cross_workspace_metadata_read"],
			"workspace-uuid-1"
		);
	});

	it("keeps questionnaire answers behind partner RP-configuration read", async () => {
		const beforeLoad = (ConfigurationRoute as any).options?.beforeLoad;

		await beforeLoad({ params });

		expect(requireCapability).toHaveBeenCalledWith(
			"/workspaces/workspace-uuid-1/applications/application-uuid-1/rp-configurations/configuration-uuid-1/configuration",
			"rp_configuration_read",
			"workspace-uuid-1"
		);
	});

	it("allows scoped Production-review readers without granting questionnaire access", async () => {
		const beforeLoad = (ProductionReviewRoute as any).options?.beforeLoad;
		const pathname =
			"/workspaces/workspace-uuid-1/applications/application-uuid-1/rp-configurations/configuration-uuid-1/production-review";

		await beforeLoad({ location: { pathname }, params });

		expect(requireAnyCapability).toHaveBeenCalledWith(
			pathname,
			[
				"production_review_request_write",
				"production_review",
				"rp_configuration_read",
			],
			"workspace-uuid-1"
		);
	});
});
