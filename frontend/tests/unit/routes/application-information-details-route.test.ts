import { describe, expect, it, vi } from "vitest";

const outletMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", () => ({
	createFileRoute: (routeId: string) => (options: unknown) => ({
		options,
		routeId,
	}),
	Outlet: outletMock,
}));

vi.mock("@/common/i18n", () => ({
	default: { t: () => "Back to application" },
}));

import { Route as DetailsRoute } from "@/routes/workspaces/$workspaceUuid/applications/$applicationInformationUuid/details";
import { Route as DetailsIndexRoute } from "@/routes/workspaces/$workspaceUuid/applications/$applicationInformationUuid/details/index";

describe("Application information details routes", () => {
	it("keeps the details page in an index route beneath an Outlet layout", () => {
		expect((DetailsRoute as any).routeId).toBe(
			"/workspaces/$workspaceUuid/applications/$applicationInformationUuid/details"
		);
		expect((DetailsRoute as any).options?.component).toBe(outletMock);

		expect((DetailsIndexRoute as any).routeId).toBe(
			"/workspaces/$workspaceUuid/applications/$applicationInformationUuid/details/"
		);
		expect((DetailsIndexRoute as any).options?.component).toBeDefined();
		expect((DetailsIndexRoute as any).options?.component).not.toBe(outletMock);
	});

	it("preserves the parent Application backlink", () => {
		const beforeLoad = (DetailsRoute as any).options?.beforeLoad;

		expect(
			beforeLoad({
				params: {
					applicationInformationUuid: "application-information-uuid-1",
					workspaceUuid: "workspace-uuid-1",
				},
			})
		).toEqual({
			backLink: {
				href: "/workspaces/workspace-uuid-1/applications/application-information-uuid-1",
				label: "Back to application",
			},
		});
	});
});
