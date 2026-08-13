import {
	canReadApplicationInformation,
	canReadWorkspace,
	hasCapability,
	type AuthorizationContext,
	type Capability,
} from "@/features/auth/authorization";

export const WORKSPACE_ROUTE_IDS = [
	"overview",
	"applicationInformation",
	"access",
	"reports",
	"settings",
] as const;

export type WorkspaceRouteId = (typeof WORKSPACE_ROUTE_IDS)[number];

export const WORKSPACE_ROUTE_SURFACES = ["hub", "breadcrumb"] as const;

export type WorkspaceRouteSurface = (typeof WORKSPACE_ROUTE_SURFACES)[number];

type WorkspaceRouteVisibility =
	| { kind: "applicationInformationRead" }
	| { kind: "capability"; capability: Capability }
	| { kind: "workspaceRead" };

export type WorkspaceRouteDefinition = {
	activePathSuffixes: ReadonlyArray<string>;
	breadcrumbRouteIds: ReadonlyArray<WorkspaceRouteId>;
	compatibilityPathSuffixes: ReadonlyArray<string>;
	id: WorkspaceRouteId;
	labelKey: string;
	pathSuffix: string;
	returnRouteId: WorkspaceRouteId | "chooser";
	surfaces: ReadonlyArray<WorkspaceRouteSurface>;
	visibility: WorkspaceRouteVisibility;
};

const allWorkspaceSurfaces = [
	"hub",
	"breadcrumb",
] as const satisfies ReadonlyArray<WorkspaceRouteSurface>;

export const WORKSPACE_ROUTE_CATALOG = {
	access: {
		activePathSuffixes: ["/access", "/members"],
		breadcrumbRouteIds: ["overview"],
		compatibilityPathSuffixes: ["/members"],
		id: "access",
		labelKey: "workspaces.navigation.access",
		pathSuffix: "/access",
		returnRouteId: "overview",
		surfaces: allWorkspaceSurfaces,
		visibility: {
			capability: "partner_staff_assignment",
			kind: "capability",
		},
	},
	applicationInformation: {
		activePathSuffixes: ["/applications"],
		breadcrumbRouteIds: ["overview"],
		compatibilityPathSuffixes: [],
		id: "applicationInformation",
		labelKey: "workspaces.navigation.applications",
		pathSuffix: "/applications",
		returnRouteId: "overview",
		surfaces: allWorkspaceSurfaces,
		visibility: { kind: "applicationInformationRead" },
	},
	overview: {
		activePathSuffixes: [""],
		breadcrumbRouteIds: [],
		compatibilityPathSuffixes: [],
		id: "overview",
		labelKey: "workspaces.navigation.overview",
		pathSuffix: "",
		returnRouteId: "chooser",
		surfaces: allWorkspaceSurfaces,
		visibility: { kind: "workspaceRead" },
	},
	reports: {
		activePathSuffixes: ["/reports"],
		breadcrumbRouteIds: ["overview"],
		compatibilityPathSuffixes: [],
		id: "reports",
		labelKey: "workspaces.navigation.reports",
		pathSuffix: "/reports",
		returnRouteId: "overview",
		surfaces: allWorkspaceSurfaces,
		visibility: {
			capability: "aggregate_report_read",
			kind: "capability",
		},
	},
	settings: {
		activePathSuffixes: ["/settings"],
		breadcrumbRouteIds: ["overview"],
		compatibilityPathSuffixes: [],
		id: "settings",
		labelKey: "workspaces.navigation.settings",
		pathSuffix: "/settings",
		returnRouteId: "overview",
		surfaces: allWorkspaceSurfaces,
		visibility: {
			capability: "workspace_metadata_write",
			kind: "capability",
		},
	},
} as const satisfies Readonly<
	Record<WorkspaceRouteId, WorkspaceRouteDefinition>
>;

const getWorkspaceBasePath = (workspaceUuid: string): string =>
	`/workspaces/${encodeURIComponent(workspaceUuid)}`;

export const getWorkspaceUuidFromPath = (pathname: string): string | null => {
	const match = /^\/workspaces\/([^/]+)(?:\/|$)/u.exec(pathname);
	if (!match?.[1]) {
		return null;
	}
	if (["new", "rp-registration-adoption"].includes(match[1])) {
		return null;
	}

	try {
		return decodeURIComponent(match[1]);
	} catch {
		return null;
	}
};

const hasPathPrefix = (pathname: string, pathPrefix: string): boolean =>
	pathname === pathPrefix || pathname.startsWith(`${pathPrefix}/`);

export const getWorkspaceRoutePath = (
	routeId: WorkspaceRouteId,
	workspaceUuid: string
): string =>
	`${getWorkspaceBasePath(workspaceUuid)}${WORKSPACE_ROUTE_CATALOG[routeId].pathSuffix}`;

export const isWorkspaceRouteVisible = (
	route: WorkspaceRouteDefinition,
	authorizationContext: AuthorizationContext | null | undefined,
	workspaceUuid: string
): boolean => {
	switch (route.visibility.kind) {
		case "applicationInformationRead":
			return canReadApplicationInformation(authorizationContext, workspaceUuid);
		case "capability":
			return hasCapability(
				authorizationContext,
				route.visibility.capability,
				workspaceUuid
			);
		case "workspaceRead":
			return canReadWorkspace(authorizationContext, workspaceUuid);
	}
};

export const getWorkspaceRoutesForSurface = (
	surface: WorkspaceRouteSurface,
	authorizationContext: AuthorizationContext | null | undefined,
	workspaceUuid: string
): ReadonlyArray<WorkspaceRouteDefinition> =>
	WORKSPACE_ROUTE_IDS.map((routeId) => WORKSPACE_ROUTE_CATALOG[routeId]).filter(
		(route) =>
			route.surfaces.includes(surface) &&
			isWorkspaceRouteVisible(route, authorizationContext, workspaceUuid)
	);

export const isWorkspaceRouteActive = (
	route: WorkspaceRouteDefinition,
	pathname: string,
	workspaceUuid: string
): boolean => {
	const basePath = getWorkspaceBasePath(workspaceUuid);

	return route.activePathSuffixes.some((pathSuffix) => {
		const pathPrefix = `${basePath}${pathSuffix}`;
		return pathSuffix === ""
			? pathname === pathPrefix || pathname === `${pathPrefix}/`
			: hasPathPrefix(pathname, pathPrefix);
	});
};

export const findWorkspaceRouteByPath = (
	pathname: string,
	workspaceUuid: string
): WorkspaceRouteDefinition | null => {
	let bestMatch: WorkspaceRouteDefinition | null = null;
	let bestMatchScore = -1;

	for (const routeId of WORKSPACE_ROUTE_IDS) {
		const route: WorkspaceRouteDefinition = WORKSPACE_ROUTE_CATALOG[routeId];
		if (!isWorkspaceRouteActive(route, pathname, workspaceUuid)) {
			continue;
		}

		const matchScore = Math.max(
			...route.activePathSuffixes.map((pathSuffix) => pathSuffix.length)
		);
		if (matchScore > bestMatchScore) {
			bestMatch = route;
			bestMatchScore = matchScore;
		}
	}

	return bestMatch;
};

export const getWorkspaceBreadcrumbRoutes = (
	routeId: WorkspaceRouteId
): ReadonlyArray<WorkspaceRouteDefinition> =>
	WORKSPACE_ROUTE_CATALOG[routeId].breadcrumbRouteIds.map(
		(breadcrumbRouteId) => WORKSPACE_ROUTE_CATALOG[breadcrumbRouteId]
	);

export const getWorkspaceReturnPath = (
	routeId: WorkspaceRouteId,
	workspaceUuid: string
): string => {
	const returnRouteId = WORKSPACE_ROUTE_CATALOG[routeId].returnRouteId;
	return returnRouteId === "chooser"
		? "/workspaces"
		: getWorkspaceRoutePath(returnRouteId, workspaceUuid);
};

export const getWorkspaceCompatibilityRedirect = (
	pathname: string,
	authorizationContext: AuthorizationContext | null | undefined,
	workspaceUuid: string
): string | null => {
	const basePath = getWorkspaceBasePath(workspaceUuid);

	for (const routeId of WORKSPACE_ROUTE_IDS) {
		const route: WorkspaceRouteDefinition = WORKSPACE_ROUTE_CATALOG[routeId];
		if (
			isWorkspaceRouteVisible(route, authorizationContext, workspaceUuid) &&
			route.compatibilityPathSuffixes.some(
				(pathSuffix) => pathname === `${basePath}${pathSuffix}`
			)
		) {
			return getWorkspaceRoutePath(route.id, workspaceUuid);
		}
	}

	return null;
};
