import { describe, expect, it } from "vitest";
import type { AuthorizationContext } from "@/features/auth/authorization";
import {
	findWorkspaceRouteByPath,
	getWorkspaceBreadcrumbRoutes,
	getWorkspaceCompatibilityRedirect,
	getWorkspaceReturnPath,
	getWorkspaceRoutePath,
	getWorkspaceRoutesForSurface,
	getWorkspaceUuidFromPath,
	isWorkspaceRouteActive,
	WORKSPACE_ROUTE_CATALOG,
	WORKSPACE_ROUTE_IDS,
} from "@/features/workspaces/workspace-route-catalog";

const workspaceUuid = "workspace-uuid-1";

const clAdminContext: AuthorizationContext = {
	globalRole: "cl_admin",
	partnerAccess: [],
};

const rpAdminContext: AuthorizationContext = {
	globalRole: null,
	partnerAccess: [{ role: "rp_admin", workspaceUuid }],
};

const readOnlyContext: AuthorizationContext = {
	globalRole: null,
	partnerAccess: [{ role: "read_only", workspaceUuid }],
};

const otherWorkspaceContext: AuthorizationContext = {
	globalRole: null,
	partnerAccess: [{ role: "rp_admin", workspaceUuid: "workspace-uuid-other" }],
};

describe("workspace route catalog", () => {
	it("owns labels, paths, visibility, navigation surfaces, ancestry, returns, and compatibility paths", () => {
		expect(Object.keys(WORKSPACE_ROUTE_CATALOG).sort()).toEqual(
			[...WORKSPACE_ROUTE_IDS].sort()
		);

		for (const routeId of WORKSPACE_ROUTE_IDS) {
			const route = WORKSPACE_ROUTE_CATALOG[routeId];
			expect(route.id).toBe(routeId);
			expect(route.labelKey).toMatch(/^workspaces\.navigation\./);
			expect(route.activePathSuffixes.length).toBeGreaterThan(0);
			expect(route.surfaces).toContain("breadcrumb");
		}

		expect(WORKSPACE_ROUTE_CATALOG.access.compatibilityPathSuffixes).toEqual([
			"/members",
		]);
	});

	it("filters workspace destinations through canonical capability and resource scope", () => {
		expect(
			getWorkspaceRoutesForSurface("hub", rpAdminContext, workspaceUuid).map(
				({ id }) => id
			)
		).toEqual(["overview", "applicationInformation", "access", "settings"]);
		expect(
			getWorkspaceRoutesForSurface("hub", readOnlyContext, workspaceUuid).map(
				({ id }) => id
			)
		).toEqual(["overview", "applicationInformation"]);
		expect(
			getWorkspaceRoutesForSurface("hub", clAdminContext, workspaceUuid).map(
				({ id }) => id
			)
		).toEqual(["overview", "applicationInformation", "access"]);
		expect(
			getWorkspaceRoutesForSurface("hub", otherWorkspaceContext, workspaceUuid)
		).toEqual([]);
		expect(
			Object.values(WORKSPACE_ROUTE_CATALOG).some((route) =>
				(route.surfaces as ReadonlyArray<string>).includes("sideNavigation")
			)
		).toBe(false);
	});

	it("builds paths and identifies the selected workspace route family", () => {
		expect(getWorkspaceRoutePath("overview", workspaceUuid)).toBe(
			`/workspaces/${workspaceUuid}`
		);
		expect(getWorkspaceRoutePath("access", workspaceUuid)).toBe(
			`/workspaces/${workspaceUuid}/access`
		);
		expect(
			findWorkspaceRouteByPath(
				`/workspaces/${workspaceUuid}/applications/record-uuid/edit`,
				workspaceUuid
			)?.id
		).toBe("applicationInformation");
		expect(
			findWorkspaceRouteByPath(
				`/workspaces/${workspaceUuid}/applications/application-uuid/rp-configurations/rp-uuid/usage`,
				workspaceUuid
			)?.id
		).toBe("applicationInformation");
		expect(
			findWorkspaceRouteByPath(
				`/workspaces/${workspaceUuid}/application-information/record-uuid`,
				workspaceUuid
			)
		).toBeNull();
		expect(
			isWorkspaceRouteActive(
				WORKSPACE_ROUTE_CATALOG.overview,
				`/workspaces/${workspaceUuid}/settings`,
				workspaceUuid
			)
		).toBe(false);
		expect(
			getWorkspaceUuidFromPath(
				`/workspaces/${encodeURIComponent("workspace uuid")}/applications`
			)
		).toBe("workspace uuid");
		expect(getWorkspaceUuidFromPath("/workspaces")).toBeNull();
		expect(
			getWorkspaceUuidFromPath("/workspaces/rp-registration-adoption")
		).toBeNull();
		expect(getWorkspaceUuidFromPath("/workspaces/new")).toBeNull();
		expect(getWorkspaceUuidFromPath("/users")).toBeNull();
	});

	it("provides breadcrumb ancestry and stable return paths", () => {
		expect(
			getWorkspaceBreadcrumbRoutes("settings").map(({ id }) => id)
		).toEqual(["overview"]);
		expect(getWorkspaceReturnPath("settings", workspaceUuid)).toBe(
			`/workspaces/${workspaceUuid}`
		);
		expect(getWorkspaceReturnPath("overview", workspaceUuid)).toBe(
			"/workspaces"
		);
	});

	it("resolves the legacy Members path only for a user authorized for Access", () => {
		const membersPath = `/workspaces/${workspaceUuid}/members`;

		expect(
			getWorkspaceCompatibilityRedirect(
				membersPath,
				rpAdminContext,
				workspaceUuid
			)
		).toBe(`/workspaces/${workspaceUuid}/access`);
		expect(
			getWorkspaceCompatibilityRedirect(
				membersPath,
				readOnlyContext,
				workspaceUuid
			)
		).toBeNull();
		expect(
			getWorkspaceCompatibilityRedirect(
				`${membersPath}/unexpected`,
				rpAdminContext,
				workspaceUuid
			)
		).toBeNull();
	});
});
