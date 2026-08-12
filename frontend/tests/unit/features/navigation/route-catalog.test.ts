import { describe, expect, it } from "vitest";
import type { AuthorizationContext } from "@/features/auth/authorization";
import {
	findRouteByPath,
	getActiveTaskArea,
	getBreadcrumbRoutes,
	getReturnRoute,
	getRoutesForSurface,
	getTaskAreaRoutes,
	isRouteActive,
	isRouteVisible,
	ROUTE_CATALOG,
	ROUTE_IDS,
} from "@/features/navigation/route-catalog";

const clAdminContext: AuthorizationContext = {
	globalRole: "cl_admin",
	partnerAccess: [],
};

const partnerContext: AuthorizationContext = {
	globalRole: null,
	partnerAccess: [
		{
			role: "rp_admin",
			workspaceUuid: "workspace-uuid-1",
		},
	],
};

const noAccessContext: AuthorizationContext = {
	globalRole: null,
	partnerAccess: [],
};

describe("route catalog", () => {
	it("owns identity, labels, task parents, visibility, surfaces, breadcrumbs, and return paths", () => {
		expect(Object.keys(ROUTE_CATALOG).sort()).toEqual([...ROUTE_IDS].sort());

		for (const routeId of ROUTE_IDS) {
			const route = ROUTE_CATALOG[routeId];
			expect(route.id).toBe(routeId);
			expect(route.labelKey).toMatch(/^nav\./);
			expect(route.activePathPrefixes.length).toBeGreaterThan(0);
			expect(route.surfaces.length).toBeGreaterThan(0);
		}
	});

	it("delegates visibility to the canonical authorization context", () => {
		expect(isRouteVisible(ROUTE_CATALOG.administration, clAdminContext)).toBe(
			true
		);
		expect(
			isRouteVisible(ROUTE_CATALOG.onboardingOversight, clAdminContext)
		).toBe(true);
		expect(isRouteVisible(ROUTE_CATALOG.yourApplications, clAdminContext)).toBe(
			false
		);
		expect(isRouteVisible(ROUTE_CATALOG.reports, clAdminContext)).toBe(true);

		expect(isRouteVisible(ROUTE_CATALOG.yourApplications, partnerContext)).toBe(
			true
		);
		expect(isRouteVisible(ROUTE_CATALOG.workspaces, partnerContext)).toBe(true);
		expect(isRouteVisible(ROUTE_CATALOG.reports, partnerContext)).toBe(true);
		expect(
			isRouteVisible(ROUTE_CATALOG.rpRegistrationAdoption, clAdminContext)
		).toBe(true);
		expect(
			isRouteVisible(ROUTE_CATALOG.rpRegistrationAdoption, partnerContext)
		).toBe(false);
		expect(isRouteVisible(ROUTE_CATALOG.administration, partnerContext)).toBe(
			false
		);

		expect(isRouteVisible(ROUTE_CATALOG.home, noAccessContext)).toBe(true);
		expect(isRouteVisible(ROUTE_CATALOG.workspaces, noAccessContext)).toBe(
			false
		);
		expect(isRouteVisible(ROUTE_CATALOG.reports, noAccessContext)).toBe(false);
		expect(isRouteVisible(ROUTE_CATALOG.support, undefined)).toBe(true);
	});

	it("derives active parent task areas from the recorded path families", () => {
		expect(getActiveTaskArea("/your-applications/rp-uuid")).toBe("partnerWork");
		expect(getActiveTaskArea("/workspaces/workspace-uuid/settings")).toBe(
			"partnerWork"
		);
		expect(getActiveTaskArea("/onboarding-oversight/queue")).toBe(
			"onboardingOversight"
		);
		expect(getActiveTaskArea("/users")).toBe("administration");
		expect(getActiveTaskArea("/reports/applications")).toBe("reports");
		expect(getActiveTaskArea("/support")).toBeNull();
		expect(isRouteActive(ROUTE_CATALOG.home, "/support")).toBe(false);
		expect(findRouteByPath("/users")?.id).toBe("usersAndAccess");
		expect(findRouteByPath("/users/invite")?.id).toBe("usersAndAccess");
		expect(findRouteByPath("/reports/workspaces")?.id).toBe("reports");
		expect(findRouteByPath("/users/user-uuid")?.id).toBe("usersAndAccess");
		expect(findRouteByPath("/workspaces/workspace-uuid/settings")?.id).toBe(
			"workspaces"
		);
		expect(
			findRouteByPath(
				"/workspaces/rp-registration-adoption/rp-application-uuid"
			)?.id
		).toBe("rpRegistrationAdoption");
		expect(findRouteByPath("/unknown-product-route")).toBeNull();
	});

	it("omits empty or unauthorized groups without changing route authority", () => {
		expect(
			getTaskAreaRoutes("partnerWork", clAdminContext).map(({ id }) => id)
		).toEqual(["workspaces"]);
		expect(
			getTaskAreaRoutes("partnerWork", partnerContext).map(({ id }) => id)
		).toEqual(["yourApplications", "workspaces"]);
		expect(getTaskAreaRoutes("administration", partnerContext)).toEqual([]);
		expect(
			getRoutesForSurface("primaryNavigation", noAccessContext).map(
				({ id }) => id
			)
		).toEqual(["home"]);
		expect(
			Object.values(ROUTE_CATALOG).some((route) =>
				(route.surfaces as ReadonlyArray<string>).includes("sideNavigation")
			)
		).toBe(false);
	});

	it("provides one breadcrumb and return-path source for flat admin children", () => {
		expect(getBreadcrumbRoutes("usersAndAccess").map(({ id }) => id)).toEqual([
			"home",
			"administration",
		]);
		expect(getReturnRoute("usersAndAccess")?.id).toBe("administration");
		expect(
			getBreadcrumbRoutes("rpRegistrationAdoption").map(({ id }) => id)
		).toEqual(["home", "workspaces"]);
		expect(getReturnRoute("rpRegistrationAdoption")?.id).toBe("workspaces");
		expect(getReturnRoute("home")).toBeNull();
	});
});
