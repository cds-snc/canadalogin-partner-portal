import { useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
	GcdsBreadcrumbs,
	GcdsBreadcrumbsItem,
	GcdsHeader,
	GcdsLangToggle,
	GcdsNavLink,
	GcdsTopNav,
} from "@gcds-core/components-react";
import type { FunctionComponent } from "@/common/types";
import { useSession } from "@/hooks";
import type { RouteBreadcrumbItem } from "@/types/route-breadcrumbs";

type NavigationItem = {
	href: string;
	label: string;
};

const isCurrentPath = (pathname: string, href: string): boolean => {
	if (href === "/") {
		return pathname === "/";
	}

	return pathname === href || pathname.startsWith(`${href}/`);
};

const isRouteBreadcrumbItem = (
	value: unknown
): value is RouteBreadcrumbItem => {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	const candidate = value as {
		href?: unknown;
		label?: unknown;
	};

	return (
		typeof candidate.href === "string" &&
		typeof candidate.label === "string"
	);
};

const selectBreadcrumbs = (
	routeMatches: Array<{ context?: unknown }>
): Array<RouteBreadcrumbItem> => {
	for (let index = routeMatches.length - 1; index >= 0; index -= 1) {
		const match = routeMatches[index];

		if (typeof match.context !== "object" || match.context === null) {
			continue;
		}

		const context = match.context as {
			breadcrumbs?: unknown;
		};

		if (!Array.isArray(context.breadcrumbs)) {
			continue;
		}

		return context.breadcrumbs.filter(isRouteBreadcrumbItem);
	}

	return [];
};

const Header = (): FunctionComponent => {
	const { t, i18n } = useTranslation();
	const { currentUser, isAuthenticated, isLoading } = useSession();
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const breadcrumbs = useRouterState({
		select: (state) => selectBreadcrumbs(state.matches),
	});
	const serviceName = t("home.title");

	const lang = i18n.language?.startsWith("fr") ? "fr" : "en";
	const langHref = lang === "en" ? "/fr" : "/en";

	const commonItems: Array<NavigationItem> = [
		{ href: "/", label: t("nav.home") },
	];

	const authItems: Array<NavigationItem> = [
		{ href: "/dashboard", label: t("nav.dashboard") },
	];

	const superuserItems: Array<NavigationItem> = [
		{ href: "/users", label: t("nav.users") },
		{ href: "/departments", label: t("nav.departments") },
		{ href: "/policies", label: t("nav.policies") },
		{ href: "/roles", label: t("nav.roles") },
		{ href: "/tiers", label: t("nav.tiers") },
	];

	const publicItems: Array<NavigationItem> = [
		{ href: "/login", label: t("nav.login") },
	];

	let items: Array<NavigationItem>;
	if (isLoading) {
		items = [...commonItems];
	} else if (isAuthenticated) {
		items = [
			...commonItems,
			...authItems,
			...(currentUser?.isSuperuser ? superuserItems : []),
			{ href: "/logout", label: t("nav.logout") },
		];
	} else {
		items = [...commonItems, ...publicItems];
	}

	return (
		<GcdsHeader signatureHasLink langHref={langHref} skipToHref="#main-content">
			<GcdsLangToggle href={langHref} lang={lang} slot="toggle" />
			{breadcrumbs.length > 0 ? (
				<GcdsBreadcrumbs slot="breadcrumb">
					{breadcrumbs.map((item) => (
						<GcdsBreadcrumbsItem key={`${item.href}-${item.label}`} href={item.href}>
							{item.label}
						</GcdsBreadcrumbsItem>
					))}
				</GcdsBreadcrumbs>
			) : null}
			<GcdsTopNav alignment="end" label={t("nav.label")} slot="menu">
				<GcdsNavLink href="/" slot="home">
					{serviceName}
				</GcdsNavLink>
				{items.map((item) => (
					<GcdsNavLink
						key={item.href}
						current={isCurrentPath(pathname, item.href)}
						href={item.href}
					>
						{item.label}
					</GcdsNavLink>
				))}
			</GcdsTopNav>
		</GcdsHeader>
	);
};

export default Header;
