import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireCapability } from "@/features/auth/auth-routing";
import { Route as CopyRoute } from "@/routes/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/$rpConfigurationUuid/copy";
import { Route as ProgressionRoute } from "@/routes/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/$rpConfigurationUuid/progression";

vi.mock("@/features/auth/auth-routing", () => ({
	requireCapability: vi.fn(() => Promise.resolve()),
}));

const params = {
	applicationInformationUuid: "application-1",
	rpConfigurationUuid: "configuration-1",
	workspaceUuid: "workspace-1",
};

describe("RP configuration copy routes", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("reauthorizes direct copy entry for the selected workspace", async () => {
		const beforeLoad = (CopyRoute as any).options?.beforeLoad;
		await beforeLoad({ params });

		expect(requireCapability).toHaveBeenCalledWith(
			"/workspaces/workspace-1/applications/application-1/rp-configurations/configuration-1/copy",
			"rp_configuration_write",
			"workspace-1"
		);
	});

	it("reauthorizes and redirects a saved progression URL without mutation", async () => {
		const beforeLoad = (ProgressionRoute as any).options?.beforeLoad;

		await expect(beforeLoad({ params })).rejects.toMatchObject({
			options: {
				params,
				replace: true,
				to: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/$rpConfigurationUuid/copy",
			},
		});
		expect(requireCapability).toHaveBeenCalledWith(
			"/workspaces/workspace-1/applications/application-1/rp-configurations/configuration-1/progression",
			"rp_configuration_write",
			"workspace-1"
		);
	});
});
