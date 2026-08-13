import { describe, expect, it, vi } from "vitest";

const requireCapabilityMock = vi.hoisted(() => vi.fn(() => Promise.resolve()));
const redirectMock = vi.hoisted(() => vi.fn((options: unknown) => options));

vi.mock("@tanstack/react-router", () => ({
	createFileRoute: () => (options: unknown) => ({ options }),
	redirect: redirectMock,
}));

vi.mock("@/common/i18n", () => ({
	default: { t: () => "Back to application" },
}));

vi.mock("@/features/auth/auth-routing", () => ({
	requireCapability: requireCapabilityMock,
}));

import { Route as DeleteRoute } from "@/routes/workspaces/$workspaceUuid/applications/$applicationInformationUuid/delete";
import { Route as SettingsRoute } from "@/routes/workspaces/$workspaceUuid/applications/$applicationInformationUuid/settings";

const params = {
	applicationInformationUuid: "application-information-uuid-1",
	workspaceUuid: "workspace-uuid-1",
};

describe("Application deletion routes", () => {
	it("guards the focused delete route and provides Application ancestry", async () => {
		const beforeLoad = (DeleteRoute as any).options?.beforeLoad;
		const result = await beforeLoad({ params });

		expect(requireCapabilityMock).toHaveBeenCalledWith(
			"/workspaces/workspace-uuid-1/applications/application-information-uuid-1/delete",
			"application_information_write",
			"workspace-uuid-1"
		);
		expect(result).toEqual({
			backLink: {
				href: "/workspaces/workspace-uuid-1/applications/application-information-uuid-1",
				label: "Back to application",
			},
		});
	});

	it("keeps the old settings URL only as a guarded replace redirect", async () => {
		const beforeLoad = (SettingsRoute as any).options?.beforeLoad;

		await expect(beforeLoad({ params })).rejects.toEqual({
			params,
			replace: true,
			to: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid/delete",
		});
		expect(requireCapabilityMock).toHaveBeenCalledWith(
			"/workspaces/workspace-uuid-1/applications/application-information-uuid-1/settings",
			"application_information_write",
			"workspace-uuid-1"
		);
		expect(redirectMock).toHaveBeenCalledWith({
			params,
			replace: true,
			to: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid/delete",
		});
	});
});
