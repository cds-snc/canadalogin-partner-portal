import type { MouseEvent as ReactMouseEvent } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
	GcdsHeader,
	GcdsBreadcrumbs,
	GcdsBreadcrumbsItem,
	GcdsLangToggle,
	GcdsLink,
	GcdsNavLink,
	GcdsTopNav,
} from "@gcds-core/components-react";
import type { FunctionComponent } from "@/common/types";
import { useAppPreferencesState, useSession } from "@/hooks";
import { getOidcLoginUrl } from "@/fetch/auth";
import {
	getBreadcrumbRoutes,
	findRouteByPath,
	isRouteActive,
	isRouteVisible,
	ROUTE_CATALOG,
	type RouteDefinition,
} from "@/features/navigation/route-catalog";
import { useWorkspace } from "@/features/workspaces/hooks/use-workspace";
import {
	findWorkspaceRouteByPath,
	getWorkspaceBreadcrumbRoutes,
	getWorkspaceRoutePath,
	getWorkspaceUuidFromPath,
} from "@/features/workspaces/workspace-route-catalog";
import { ROLE_LABEL_KEYS } from "@/features/auth/authorization";
import {
	allowNextPendingNavigation,
	confirmPendingNavigation,
} from "@/features/navigation/pending-navigation-guard";
import { useNavigationDisclosureCoordinator } from "@/features/navigation/use-navigation-disclosure-coordinator";
import type { RouteBackLink } from "@/types/route-breadcrumbs";
import { UserNavGroup } from "./UserNavGroup";

type HeaderBreadcrumb = {
	href?: string;
	key: string;
	label: string;
};

const getEquivalentLanguageHref = (
	href: string,
	targetLanguage: "en" | "fr"
): string => {
	const url = new URL(href, "https://local.invalid");
	url.searchParams.set("lng", targetLanguage);

	return `${url.pathname}${url.search}${url.hash}`;
};

const selectBackLink = (
	routeMatches: Array<{ context?: unknown }>
): RouteBackLink | null => {
	for (let index = routeMatches.length - 1; index >= 0; index -= 1) {
		const match = routeMatches[index];

		if (!match || typeof match.context !== "object" || match.context === null) {
			continue;
		}

		const context = match.context as { backLink?: unknown };
		const { backLink } = context;

		if (
			typeof backLink === "object" &&
			backLink !== null &&
			typeof (backLink as { href?: unknown }).href === "string" &&
			typeof (backLink as { label?: unknown }).label === "string"
		) {
			return backLink as RouteBackLink;
		}
	}

	return null;
};

const Header = (): FunctionComponent => {
	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	const { currentUser, isAuthenticated, isLoading } = useSession();
	const { setLanguage } = useAppPreferencesState();
	const currentLocation = useRouterState({
		select: (state) => state.location,
	});
	const { href: currentHref, pathname } = currentLocation;
	const backLink = useRouterState({
		select: (state) => selectBackLink(state.matches),
	});
	const lang = i18n.language?.startsWith("fr") ? "fr" : "en";
	const { closeOpenNavigation, topNavRef, userNavGroupRef } =
		useNavigationDisclosureCoordinator({
			languageKey: lang,
			routeKey: pathname,
		});
	const serviceName = t("home.title");
	const targetLanguage = lang === "en" ? "fr" : "en";
	const languageToggleHref = getEquivalentLanguageHref(
		currentHref,
		targetLanguage
	);
	const handleLangToggle = async (): Promise<void> => {
		if (!confirmPendingNavigation()) return;
		await closeOpenNavigation();
		const clearNavigationAllowance = allowNextPendingNavigation();
		try {
			await setLanguage(targetLanguage);
			await navigate({ replace: true, to: currentHref });
		} finally {
			clearNavigationAllowance();
		}
	};
	const handleLangToggleClick = (event: ReactMouseEvent): void => {
		if (
			event.button !== 0 ||
			event.altKey ||
			event.ctrlKey ||
			event.metaKey ||
			event.shiftKey
		) {
			return;
		}

		event.preventDefault();
		void handleLangToggle();
	};

	const authorizationContext = currentUser?.authorizationContext;
	const currentCatalogRoute = findRouteByPath(pathname);
	const isCatalogLanding =
		currentCatalogRoute !== null &&
		(pathname === currentCatalogRoute.path ||
			pathname === `${currentCatalogRoute.path}/`);
	const catalogBreadcrumbRoutes =
		currentCatalogRoute && currentCatalogRoute.id !== "home"
			? [
					...getBreadcrumbRoutes(currentCatalogRoute.id),
					...(isCatalogLanding ? [] : [currentCatalogRoute]),
				]
			: [];
	const workspaceUuid = getWorkspaceUuidFromPath(pathname);
	const { workspace } = useWorkspace(workspaceUuid ?? "");
	const currentWorkspaceRoute = workspaceUuid
		? findWorkspaceRouteByPath(pathname, workspaceUuid)
		: null;
	const isWorkspaceLanding =
		workspaceUuid !== null &&
		currentWorkspaceRoute !== null &&
		(pathname ===
			getWorkspaceRoutePath(currentWorkspaceRoute.id, workspaceUuid) ||
			pathname ===
				`${getWorkspaceRoutePath(currentWorkspaceRoute.id, workspaceUuid)}/`);
	const workspaceBreadcrumbs: Array<HeaderBreadcrumb> = workspaceUuid
		? [
				{
					href: ROUTE_CATALOG.home.path,
					key: ROUTE_CATALOG.home.id,
					label: String(t(ROUTE_CATALOG.home.labelKey as never)),
				},
				{
					href: ROUTE_CATALOG.workspaces.path,
					key: ROUTE_CATALOG.workspaces.id,
					label: String(t(ROUTE_CATALOG.workspaces.labelKey as never)),
				},
				...(currentWorkspaceRoute
					? [
							...getWorkspaceBreadcrumbRoutes(currentWorkspaceRoute.id).map(
								(route) => ({
									href: getWorkspaceRoutePath(route.id, workspaceUuid),
									key: `workspace-${route.id}`,
									label:
										workspace?.name.trim() || t("workspaces.workspaceLabel"),
								})
							),
							...(isWorkspaceLanding
								? []
								: [
										{
											href: getWorkspaceRoutePath(
												currentWorkspaceRoute.id,
												workspaceUuid
											),
											key: `workspace-${currentWorkspaceRoute.id}`,
											label:
												currentWorkspaceRoute.id === "overview"
													? workspace?.name.trim() ||
														t("workspaces.workspaceLabel")
													: String(t(currentWorkspaceRoute.labelKey as never)),
										},
									]),
						]
					: []),
			]
		: [];
	const catalogBreadcrumbs: Array<HeaderBreadcrumb> = [
		...catalogBreadcrumbRoutes.map((route) => ({
			href: route.path,
			key: route.id,
			label: String(t(route.labelKey as never)),
		})),
	];
	const headerBreadcrumbs: Array<HeaderBreadcrumb> =
		workspaceBreadcrumbs.length > 0 ? workspaceBreadcrumbs : catalogBreadcrumbs;
	const renderRouteLink = (route: RouteDefinition): FunctionComponent => (
		<GcdsNavLink
			key={route.id}
			current={isRouteActive(route, pathname)}
			href={route.path}
			onGcdsClick={() => {
				void closeOpenNavigation();
			}}
		>
			{String(t(route.labelKey as never))}
		</GcdsNavLink>
	);
	const activePartnerAccess = workspaceUuid
		? authorizationContext?.partnerAccess.find(
				(access) => access.workspaceUuid === workspaceUuid
			)
		: null;
	const userContextLabel = authorizationContext?.globalRole
		? String(t(ROLE_LABEL_KEYS[authorizationContext.globalRole] as never))
		: activePartnerAccess
			? t("nav.accountWorkspaceContext", {
					role: t(ROLE_LABEL_KEYS[activePartnerAccess.role] as never),
					workspace: workspace?.name.trim() || t("workspaces.workspaceLabel"),
				})
			: authorizationContext?.partnerAccess.length
				? t("nav.partnerAccess")
				: null;

	return (
		<GcdsHeader signatureHasLink lang={lang} skipToHref="#main-content">
			<GcdsLangToggle
				href={languageToggleHref}
				lang={lang}
				slot="toggle"
				onClickCapture={handleLangToggleClick}
			/>
			{headerBreadcrumbs.length > 0 ? (
				<GcdsBreadcrumbs lang={lang} slot="breadcrumb">
					{headerBreadcrumbs.map((breadcrumb) => (
						<GcdsBreadcrumbsItem key={breadcrumb.key} href={breadcrumb.href}>
							{breadcrumb.label}
						</GcdsBreadcrumbsItem>
					))}
				</GcdsBreadcrumbs>
			) : backLink ? (
				<div slot="breadcrumb">
					<GcdsLink href={backLink.href}>
						{`← ${t("nav.backTo")} ${backLink.label}`}
					</GcdsLink>
				</div>
			) : null}
			<GcdsTopNav
				ref={topNavRef}
				alignment="end"
				label={t("nav.label")}
				lang={lang}
				slot="menu"
			>
				<GcdsNavLink
					href="/"
					slot="home"
					onGcdsClick={() => {
						void closeOpenNavigation();
					}}
				>
					{serviceName}
				</GcdsNavLink>
				{!isLoading ? renderRouteLink(ROUTE_CATALOG.home) : null}
				{isAuthenticated &&
				!isLoading &&
				isRouteVisible(ROUTE_CATALOG.workspaces, authorizationContext)
					? renderRouteLink(ROUTE_CATALOG.workspaces)
					: null}
				{isAuthenticated &&
				!isLoading &&
				isRouteVisible(ROUTE_CATALOG.reports, authorizationContext)
					? renderRouteLink(ROUTE_CATALOG.reports)
					: null}
				{isAuthenticated &&
				!isLoading &&
				isRouteVisible(ROUTE_CATALOG.onboardingOversight, authorizationContext)
					? renderRouteLink(ROUTE_CATALOG.onboardingOversight)
					: null}
				{isAuthenticated &&
				!isLoading &&
				isRouteVisible(ROUTE_CATALOG.administration, authorizationContext)
					? renderRouteLink(ROUTE_CATALOG.administration)
					: null}
				{!isAuthenticated && !isLoading ? (
					<GcdsNavLink
						href={getOidcLoginUrl()}
						onGcdsClick={() => {
							void closeOpenNavigation();
						}}
					>
						{t("nav.login")}
					</GcdsNavLink>
				) : null}
				{isAuthenticated && !isLoading ? (
					<UserNavGroup
						contextLabel={userContextLabel}
						navGroupRef={userNavGroupRef}
						onRequestClose={(returnFocus) => {
							void closeOpenNavigation(returnFocus);
						}}
					/>
				) : null}
			</GcdsTopNav>
		</GcdsHeader>
	);
};

export default Header;
