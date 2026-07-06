import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import {
	GcdsHeader,
	GcdsLangToggle,
	GcdsLink,
	GcdsNavLink,
	GcdsTopNav,
} from "@gcds-core/components-react";
import type { FunctionComponent } from "@/common/types";
import { useSession } from "@/hooks";
import { getOidcLoginUrl } from "@/fetch/auth";
import type { RouteBreadcrumbItem } from "@/types/route-breadcrumbs";
import { UserNavGroup } from "./UserNavGroup";

type NavigationItem = {
	href: string;
	label: string;
	target?: "_blank";
	rel?: string;
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
		typeof candidate.href === "string" && typeof candidate.label === "string"
	);
};

const selectBreadcrumbs = (
	routeMatches: Array<{ context?: unknown }>
): Array<RouteBreadcrumbItem> => {
	for (let index = routeMatches.length - 1; index >= 0; index -= 1) {
		const match = routeMatches[index];

		if (!match || typeof match.context !== "object" || match.context === null) {
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
	const navigate = useNavigate();
	const { currentUser, isAuthenticated, isLoading } = useSession();
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const breadcrumbs = useRouterState({
		select: (state) => selectBreadcrumbs(state.matches),
	});
	const serviceName = t("home.title");

	const lang = i18n.language?.startsWith("fr") ? "fr" : "en";
	const targetLang = lang === "en" ? "fr" : "en";
	const handleLangToggle = (): void => {
		localStorage.setItem("i18nextLng", targetLang);
		void navigate({ to: pathname });
		globalThis.location.reload();
	};

	const commonItems: Array<NavigationItem> = [
		{ href: "/", label: t("nav.home") },
	];

	const supportItem: NavigationItem = {
		href: "/support",
		label: t("nav.support"),
	};

	const authItems: Array<NavigationItem> = [
		{ href: "/your-applications", label: t("nav.dashboard") },
	];

	const superuserItems: Array<NavigationItem> = [
		{ href: "/users", label: t("nav.users") },
		{ href: "/departments", label: t("nav.departments") },
		{ href: "/policies", label: t("nav.policies") },
		{ href: "/roles", label: t("nav.roles") },
		{ href: "/tiers", label: t("nav.tiers") },
		{ href: "/audit-logs", label: t("nav.auditLogs") },
	];

	const publicItems: Array<NavigationItem> = [
		{ href: getOidcLoginUrl(), label: t("nav.login") },
	];

	let items: Array<NavigationItem>;
	if (isLoading) {
		items = [...commonItems];
	} else if (isAuthenticated) {
		items = [
			...authItems,
			...(currentUser?.isSuperuser ? superuserItems : []),
			supportItem,
		];
	} else {
		items = [...commonItems, supportItem, ...publicItems];
	}

	return (
		<GcdsHeader signatureHasLink skipToHref="#main-content">
			<GcdsLangToggle
				href="#"
				lang={lang}
				slot="toggle"
				onClick={handleLangToggle}
			/>
			{((): ReactNode => {
				const parentCrumb = breadcrumbs[breadcrumbs.length - 2];
				return parentCrumb ? (
					<div slot="breadcrumb">
						<GcdsLink href={parentCrumb.href}>
							{`← ${t("nav.backTo")} ${parentCrumb.label}`}
						</GcdsLink>
					</div>
				) : null;
			})()}
			<GcdsTopNav alignment="end" label={t("nav.label")} slot="menu">
				<GcdsNavLink href="/" slot="home">
					{serviceName}
				</GcdsNavLink>
				{items.map((item) => (
					<GcdsNavLink
						key={item.href}
						current={isCurrentPath(pathname, item.href)}
						href={item.href}
						rel={item.rel}
					>
						{item.label}
					</GcdsNavLink>
				))}
				{isAuthenticated && !isLoading ? <GcdsNavLink href="/logout">{t("nav.logout")}</GcdsNavLink> : null}
				{isAuthenticated && !isLoading ? <UserNavGroup /> : null}
			</GcdsTopNav>
		</GcdsHeader>
	);
};

export default Header;
