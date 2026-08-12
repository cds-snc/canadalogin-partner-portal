import {
	canReadWorkspace,
	hasCapability,
	hasPartnerAccess,
	type AuthorizationContext,
	type Capability,
} from "@/features/auth/authorization";

export const ROUTE_IDS = [
	"home",
	"yourApplications",
	"workspaces",
	"rpRegistrationAdoption",
	"reports",
	"onboardingOversight",
	"administration",
	"usersAndAccess",
	"departments",
	"tiers",
	"auditLogs",
	"roleReference",
	"support",
] as const;

export type RouteId = (typeof ROUTE_IDS)[number];

export const TASK_AREA_IDS = [
	"partnerWork",
	"reports",
	"onboardingOversight",
	"administration",
] as const;

export type TaskAreaId = (typeof TASK_AREA_IDS)[number];

export const ROUTE_SURFACES = [
	"primaryNavigation",
	"home",
	"breadcrumb",
	"utilityNavigation",
] as const;

export type RouteSurface = (typeof ROUTE_SURFACES)[number];

export type RouteVisibility =
	| { kind: "authenticated" }
	| { kind: "anyCapability"; capabilities: ReadonlyArray<Capability> }
	| { kind: "capability"; capability: Capability }
	| { kind: "partnerAccess" }
	| { kind: "public" }
	| { kind: "workspaceRead" };

export type RouteDefinition = {
	activePathPrefixes: ReadonlyArray<string>;
	breadcrumbRouteIds: ReadonlyArray<RouteId>;
	hiddenReasonKey: string | null;
	id: RouteId;
	labelKey: string;
	parentTaskArea: TaskAreaId | null;
	path: string;
	returnRouteId: RouteId | null;
	surfaces: ReadonlyArray<RouteSurface>;
	visibility: RouteVisibility;
};

export type TaskAreaDefinition = {
	id: TaskAreaId;
	labelKey: string;
	routeIds: ReadonlyArray<RouteId>;
};

const authenticated: RouteVisibility = { kind: "authenticated" };
const platformGovernance: RouteVisibility = {
	capability: "platform_governance",
	kind: "capability",
};

export const ROUTE_CATALOG = {
	administration: {
		activePathPrefixes: [
			"/administration",
			"/users",
			"/departments",
			"/tiers",
			"/audit-logs",
			"/roles",
		],
		breadcrumbRouteIds: ["home"],
		hiddenReasonKey: "navigation.hidden.platformGovernanceRequired",
		id: "administration",
		labelKey: "nav.administration",
		parentTaskArea: "administration",
		path: "/administration",
		returnRouteId: "home",
		surfaces: ["primaryNavigation", "home", "breadcrumb"],
		visibility: platformGovernance,
	},
	auditLogs: {
		activePathPrefixes: ["/audit-logs"],
		breadcrumbRouteIds: ["home", "administration"],
		hiddenReasonKey: "navigation.hidden.platformGovernanceRequired",
		id: "auditLogs",
		labelKey: "nav.auditLogs",
		parentTaskArea: "administration",
		path: "/audit-logs",
		returnRouteId: "administration",
		surfaces: ["breadcrumb"],
		visibility: platformGovernance,
	},
	departments: {
		activePathPrefixes: ["/departments"],
		breadcrumbRouteIds: ["home", "administration"],
		hiddenReasonKey: "navigation.hidden.platformGovernanceRequired",
		id: "departments",
		labelKey: "nav.departments",
		parentTaskArea: "administration",
		path: "/departments",
		returnRouteId: "administration",
		surfaces: ["breadcrumb"],
		visibility: platformGovernance,
	},
	home: {
		activePathPrefixes: ["/"],
		breadcrumbRouteIds: [],
		hiddenReasonKey: "navigation.hidden.authenticationRequired",
		id: "home",
		labelKey: "nav.home",
		parentTaskArea: null,
		path: "/",
		returnRouteId: null,
		surfaces: ["primaryNavigation", "breadcrumb"],
		visibility: authenticated,
	},
	onboardingOversight: {
		activePathPrefixes: ["/onboarding-oversight"],
		breadcrumbRouteIds: ["home"],
		hiddenReasonKey: "navigation.hidden.oversightRequired",
		id: "onboardingOversight",
		labelKey: "nav.onboardingOversight",
		parentTaskArea: "onboardingOversight",
		path: "/onboarding-oversight",
		returnRouteId: "home",
		surfaces: ["primaryNavigation", "home", "breadcrumb"],
		visibility: {
			capability: "onboarding_oversight_read",
			kind: "capability",
		},
	},
	reports: {
		activePathPrefixes: ["/reports"],
		breadcrumbRouteIds: ["home"],
		hiddenReasonKey: "navigation.hidden.reportingRequired",
		id: "reports",
		labelKey: "nav.reports",
		parentTaskArea: "reports",
		path: "/reports",
		returnRouteId: "home",
		surfaces: ["primaryNavigation", "home", "breadcrumb"],
		visibility: {
			capabilities: [
				"onboarding_oversight_read",
				"aggregate_report_read",
				"mau_report_read",
			],
			kind: "anyCapability",
		},
	},
	roleReference: {
		activePathPrefixes: ["/roles"],
		breadcrumbRouteIds: ["home", "administration"],
		hiddenReasonKey: "navigation.hidden.platformGovernanceRequired",
		id: "roleReference",
		labelKey: "nav.roles",
		parentTaskArea: "administration",
		path: "/roles",
		returnRouteId: "administration",
		surfaces: ["breadcrumb"],
		visibility: platformGovernance,
	},
	rpRegistrationAdoption: {
		activePathPrefixes: ["/workspaces/rp-registration-adoption"],
		breadcrumbRouteIds: ["home", "workspaces"],
		hiddenReasonKey: "navigation.hidden.partnerBootstrapRequired",
		id: "rpRegistrationAdoption",
		labelKey: "nav.rpRegistrationAdoption",
		parentTaskArea: "partnerWork",
		path: "/workspaces/rp-registration-adoption",
		returnRouteId: "workspaces",
		surfaces: ["breadcrumb"],
		visibility: {
			capability: "partner_bootstrap",
			kind: "capability",
		},
	},
	support: {
		activePathPrefixes: ["/support"],
		breadcrumbRouteIds: ["home"],
		hiddenReasonKey: null,
		id: "support",
		labelKey: "nav.support",
		parentTaskArea: null,
		path: "/support",
		returnRouteId: "home",
		surfaces: ["utilityNavigation", "breadcrumb"],
		visibility: { kind: "public" },
	},
	tiers: {
		activePathPrefixes: ["/tiers"],
		breadcrumbRouteIds: ["home", "administration"],
		hiddenReasonKey: "navigation.hidden.platformGovernanceRequired",
		id: "tiers",
		labelKey: "nav.tiers",
		parentTaskArea: "administration",
		path: "/tiers",
		returnRouteId: "administration",
		surfaces: ["breadcrumb"],
		visibility: platformGovernance,
	},
	usersAndAccess: {
		activePathPrefixes: ["/users"],
		breadcrumbRouteIds: ["home", "administration"],
		hiddenReasonKey: "navigation.hidden.platformGovernanceRequired",
		id: "usersAndAccess",
		labelKey: "nav.usersAndAccess",
		parentTaskArea: "administration",
		path: "/users",
		returnRouteId: "administration",
		surfaces: ["breadcrumb"],
		visibility: platformGovernance,
	},
	workspaces: {
		activePathPrefixes: ["/workspaces"],
		breadcrumbRouteIds: ["home"],
		hiddenReasonKey: "navigation.hidden.workspaceReadRequired",
		id: "workspaces",
		labelKey: "nav.workspaces",
		parentTaskArea: "partnerWork",
		path: "/workspaces",
		returnRouteId: "home",
		surfaces: ["primaryNavigation", "home", "breadcrumb"],
		visibility: { kind: "workspaceRead" },
	},
	yourApplications: {
		activePathPrefixes: ["/your-applications"],
		breadcrumbRouteIds: ["home"],
		hiddenReasonKey: "navigation.hidden.partnerAccessRequired",
		id: "yourApplications",
		labelKey: "nav.dashboard",
		parentTaskArea: "partnerWork",
		path: "/your-applications",
		returnRouteId: "home",
		surfaces: ["primaryNavigation", "home", "breadcrumb"],
		visibility: { kind: "partnerAccess" },
	},
} as const satisfies Readonly<Record<RouteId, RouteDefinition>>;

export const TASK_AREA_CATALOG = {
	administration: {
		id: "administration",
		labelKey: "nav.administration",
		routeIds: [
			"administration",
			"usersAndAccess",
			"departments",
			"tiers",
			"auditLogs",
			"roleReference",
		],
	},
	onboardingOversight: {
		id: "onboardingOversight",
		labelKey: "nav.onboardingOversight",
		routeIds: ["onboardingOversight"],
	},
	reports: {
		id: "reports",
		labelKey: "nav.reports",
		routeIds: ["reports"],
	},
	partnerWork: {
		id: "partnerWork",
		labelKey: "nav.partnerWork",
		routeIds: ["yourApplications", "workspaces"],
	},
} as const satisfies Readonly<Record<TaskAreaId, TaskAreaDefinition>>;

const hasPathPrefix = (pathname: string, pathPrefix: string): boolean => {
	if (pathPrefix === "/") {
		return pathname === "/";
	}

	return pathname === pathPrefix || pathname.startsWith(`${pathPrefix}/`);
};

export const isRouteActive = (
	route: RouteDefinition,
	pathname: string
): boolean =>
	route.activePathPrefixes.some((pathPrefix) =>
		hasPathPrefix(pathname, pathPrefix)
	);

export const isRouteVisible = (
	route: RouteDefinition,
	authorizationContext: AuthorizationContext | null | undefined
): boolean => {
	switch (route.visibility.kind) {
		case "authenticated":
			return (
				authorizationContext !== null && authorizationContext !== undefined
			);
		case "anyCapability":
			return route.visibility.capabilities.some((capability) =>
				hasCapability(authorizationContext, capability)
			);
		case "capability":
			return hasCapability(authorizationContext, route.visibility.capability);
		case "partnerAccess":
			return hasPartnerAccess(authorizationContext);
		case "public":
			return true;
		case "workspaceRead":
			return canReadWorkspace(authorizationContext);
	}
};

export const getRoutesForSurface = (
	surface: RouteSurface,
	authorizationContext: AuthorizationContext | null | undefined
): ReadonlyArray<RouteDefinition> =>
	ROUTE_IDS.map((routeId) => ROUTE_CATALOG[routeId]).filter(
		(route) =>
			route.surfaces.includes(surface) &&
			isRouteVisible(route, authorizationContext)
	);

export const getTaskAreaRoutes = (
	taskAreaId: TaskAreaId,
	authorizationContext: AuthorizationContext | null | undefined
): ReadonlyArray<RouteDefinition> =>
	TASK_AREA_CATALOG[taskAreaId].routeIds
		.map((routeId) => ROUTE_CATALOG[routeId])
		.filter((route) => isRouteVisible(route, authorizationContext));

export const getActiveTaskArea = (pathname: string): TaskAreaId | null => {
	for (const taskAreaId of TASK_AREA_IDS) {
		const taskArea = TASK_AREA_CATALOG[taskAreaId];
		if (
			taskArea.routeIds.some((routeId) =>
				isRouteActive(ROUTE_CATALOG[routeId], pathname)
			)
		) {
			return taskAreaId;
		}
	}

	return null;
};

export const findRouteByPath = (pathname: string): RouteDefinition | null => {
	let bestMatch: RouteDefinition | null = null;
	let bestMatchScore = -1;

	for (const routeId of ROUTE_IDS) {
		const route: RouteDefinition = ROUTE_CATALOG[routeId];
		for (const pathPrefix of route.activePathPrefixes) {
			const matchScore =
				pathPrefix.length +
				(route.path === pathPrefix ? 100 : 0) +
				(route.path === pathname ? 10_000 : 0);
			if (hasPathPrefix(pathname, pathPrefix) && matchScore > bestMatchScore) {
				bestMatch = route;
				bestMatchScore = matchScore;
			}
		}
	}

	return bestMatch;
};

export const getBreadcrumbRoutes = (
	routeId: RouteId
): ReadonlyArray<RouteDefinition> =>
	ROUTE_CATALOG[routeId].breadcrumbRouteIds.map(
		(breadcrumbRouteId) => ROUTE_CATALOG[breadcrumbRouteId]
	);

export const getReturnRoute = (routeId: RouteId): RouteDefinition | null => {
	const returnRouteId = ROUTE_CATALOG[routeId].returnRouteId;
	return returnRouteId === null ? null : ROUTE_CATALOG[returnRouteId];
};
