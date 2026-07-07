import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
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
import type { RouteBackLink } from "@/types/route-breadcrumbs";
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
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const backLink = useRouterState({
		select: (state) => selectBackLink(state.matches),
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
		{ href: "/roles", label: t("nav.roles") },
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
			{backLink ? (
				<div slot="breadcrumb">
					<GcdsLink href={backLink.href}>
						{`← ${t("nav.backTo")} ${backLink.label}`}
					</GcdsLink>
				</div>
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
						rel={item.rel}
					>
						{item.label}
					</GcdsNavLink>
				))}
				{isAuthenticated && !isLoading ? (
					<GcdsNavLink href="/logout">{t("nav.logout")}</GcdsNavLink>
				) : null}
				{isAuthenticated && !isLoading ? <UserNavGroup /> : null}
			</GcdsTopNav>
		</GcdsHeader>
	);
};

export default Header;
