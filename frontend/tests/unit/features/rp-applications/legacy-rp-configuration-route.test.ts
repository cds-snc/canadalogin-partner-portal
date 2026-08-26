import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	buildCanonicalRPConfigurationPath,
	resolveLegacyRPConfigurationPath,
	resolveWorkspaceApplicationResource,
} from "@/features/rp-applications/legacy-rp-configuration-route";
import { getAccessibleRPApplication } from "@/fetch/rp-applications";
import { getApplicationInformation } from "@/fetch/workspaces";

vi.mock("@/fetch/rp-applications", () => ({
	getAccessibleRPApplication: vi.fn(),
}));
vi.mock("@/fetch/workspaces", () => ({
	getApplicationInformation: vi.fn(),
}));

const configuration = {
	applicationInformationUuid: "application-information-uuid-1",
	configurationName: "Partner test",
	dnrAppName: "Benefits app",
	role: "rp_admin" as const,
	serviceNameEn: "Benefits app",
	serviceNameFr: "Application de prestations",
	uuid: "rp-configuration-uuid-1",
	workspaceName: "Benefits Workspace",
	workspaceUuid: "workspace-uuid-1",
};

describe("legacy RP configuration route resolution", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getAccessibleRPApplication).mockResolvedValue(configuration);
		vi.mocked(getApplicationInformation).mockRejectedValue(
			new Error("Application not found")
		);
	});

	it("maps detail, Usage, credentials, and registration without loading sensitive data", async () => {
		for (const [legacySuffix, expectedSuffix] of [
			["", ""],
			["/mau-report", "/usage"],
			["/manage-credentials", "/manage-credentials"],
			["/registration/basics", "/registration/basics"],
		] as const) {
			await expect(
				resolveLegacyRPConfigurationPath({
					legacySuffix,
					rpConfigurationUuid: configuration.uuid,
				})
			).resolves.toBe(
				`/workspaces/workspace-uuid-1/applications/application-information-uuid-1/rp-configurations/rp-configuration-uuid-1${expectedSuffix}`
			);
		}
		expect(getAccessibleRPApplication).toHaveBeenCalledTimes(4);
	});

	it("fails closed for missing or revoked access", async () => {
		vi.mocked(getAccessibleRPApplication).mockRejectedValue(
			new Error("RP configuration not found")
		);
		await expect(
			resolveLegacyRPConfigurationPath({
				rpConfigurationUuid: configuration.uuid,
			})
		).resolves.toBeNull();
	});

	it("fails closed for a mismatched workspace or stale missing parent", async () => {
		await expect(
			resolveLegacyRPConfigurationPath({
				expectedWorkspaceUuid: "other-workspace",
				rpConfigurationUuid: configuration.uuid,
			})
		).resolves.toBeNull();

		expect(
			buildCanonicalRPConfigurationPath({
				...configuration,
				applicationInformationUuid: undefined,
			})
		).toBeNull();
	});

	it("rejects unknown legacy child paths instead of guessing a destination", () => {
		expect(
			buildCanonicalRPConfigurationPath(configuration, "/unknown-task")
		).toBeNull();
		expect(
			buildCanonicalRPConfigurationPath(configuration, "/audit")
		).toBeNull();
		expect(
			buildCanonicalRPConfigurationPath(configuration, "/department-setup")
		).toBeNull();
		expect(
			buildCanonicalRPConfigurationPath(configuration, "/edit")
		).toBeNull();
	});

	it("resolves an Application before consulting the legacy RP namespace", async () => {
		vi.mocked(getApplicationInformation).mockResolvedValue({
			uuid: configuration.applicationInformationUuid,
		} as never);

		await expect(
			resolveWorkspaceApplicationResource({
				resourceUuid: configuration.applicationInformationUuid,
				workspaceUuid: configuration.workspaceUuid,
			})
		).resolves.toEqual({ kind: "application" });
		expect(getAccessibleRPApplication).not.toHaveBeenCalled();
	});

	it("redirects an in-scope legacy RP UUID only after Application lookup fails", async () => {
		await expect(
			resolveWorkspaceApplicationResource({
				legacySuffix: "/usage",
				resourceUuid: configuration.uuid,
				workspaceUuid: configuration.workspaceUuid,
			})
		).resolves.toEqual({
			href: `/workspaces/workspace-uuid-1/applications/application-information-uuid-1/rp-configurations/rp-configuration-uuid-1/usage`,
			kind: "legacyRedirect",
		});
	});

	it("fails closed when neither namespace resolves in current scope", async () => {
		vi.mocked(getAccessibleRPApplication).mockRejectedValue(
			new Error("RP configuration not found")
		);

		await expect(
			resolveWorkspaceApplicationResource({
				resourceUuid: "missing-resource",
				workspaceUuid: configuration.workspaceUuid,
			})
		).resolves.toEqual({ kind: "unavailable" });
	});
});
