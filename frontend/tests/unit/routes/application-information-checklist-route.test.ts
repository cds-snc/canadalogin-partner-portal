import { describe, expect, it, vi } from "vitest";

const redirectMock = vi.hoisted(() => vi.fn((options: unknown) => options));

vi.mock("@tanstack/react-router", () => ({
	createFileRoute: () => (options: unknown) => ({ options }),
	redirect: redirectMock,
}));

vi.mock("@/common/i18n", () => ({
	default: { t: () => "Back to application" },
}));

import { Route as ChecklistRoute } from "@/routes/workspaces/$workspaceUuid/applications/$applicationInformationUuid/checklist-and-evidence";
import { Route as ReadinessRoute } from "@/routes/workspaces/$workspaceUuid/applications/$applicationInformationUuid/readiness";

const params = {
	applicationInformationUuid: "application-information-uuid-1",
	workspaceUuid: "workspace-uuid-1",
};

describe("Application checklist and evidence routes", () => {
	it("provides Application ancestry on the canonical checklist route", () => {
		const beforeLoad = (ChecklistRoute as any).options?.beforeLoad;

		expect(beforeLoad({ params })).toEqual({
			backLink: {
				href: "/workspaces/workspace-uuid-1/applications/application-information-uuid-1",
				label: "Back to application",
			},
		});
	});

	it("keeps the old readiness URL only as a replace redirect", () => {
		const beforeLoad = (ReadinessRoute as any).options?.beforeLoad;
		let redirectResult: unknown;

		try {
			beforeLoad({ params });
		} catch (error) {
			redirectResult = error;
		}

		expect(redirectResult).toMatchObject({
			href: "/workspaces/workspace-uuid-1/applications/application-information-uuid-1/checklist-and-evidence",
			replace: true,
		});
		expect(redirectMock).toHaveBeenCalledWith({
			href: "/workspaces/workspace-uuid-1/applications/application-information-uuid-1/checklist-and-evidence",
			replace: true,
		});
	});
});
