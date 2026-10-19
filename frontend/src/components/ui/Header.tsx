import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
	GcdsHeader,
	GcdsLangToggle,
	GcdsNavLink,
	GcdsTopNav,
} from "@gcds-core/components-react";
import type { FunctionComponent } from "@/common/types";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
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

	if (href === "/applications") {
		return pathname === href;
	}

	return pathname === href || pathname.startsWith(`${href}/`);
};

const isRouteBackLink = (value: unknown): value is RouteBackLink =>
	typeof value === "object" &&
	value !== null &&
	typeof (value as { href?: unknown }).href === "string" &&
	typeof (value as { label?: unknown }).label === "string";

const selectBreadcrumbs = (
	routeMatches: Array<{ context?: unknown }>
): Array<RouteBackLink> => {
	for (let index = routeMatches.length - 1; index >= 0; index -= 1) {
		const match = routeMatches[index];

		if (!match || typeof match.context !== "object" || match.context === null) {
			continue;
		}

		const context = match.context as {
			backLink?: unknown;
			breadcrumbs?: unknown;
		};

		if (
			Array.isArray(context.breadcrumbs) &&
			context.breadcrumbs.length > 0 &&
			context.breadcrumbs.every(isRouteBackLink)
		) {
			return context.breadcrumbs;
		}

		if (isRouteBackLink(context.backLink)) {
			return [context.backLink];
		}
	}

	return [];
};

const Header = (): FunctionComponent => {
	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	const { isAuthenticated, isLoading } = useSession();
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const breadcrumbs = useRouterState({
		select: (state) => selectBreadcrumbs(state.matches),
	});
	const showNavigation = pathname !== "/logout";
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
		{ href: "/applications", label: t("nav.applications") },
		{ href: "#", label: t("nav.technicalDocumentation") },
	];

	const publicItems: Array<NavigationItem> = [
		{ href: getOidcLoginUrl(), label: t("nav.login") },
	];

	let items: Array<NavigationItem>;
	if (isLoading) {
		items = [...commonItems];
	} else if (isAuthenticated) {
		items = [...authItems, supportItem];
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
			{breadcrumbs.length > 0 ? (
				<Breadcrumbs
					slot="breadcrumb"
					items={[
						...breadcrumbs.map((breadcrumb) => ({
							href: breadcrumb.href,
							label:
								breadcrumb.showBackLabel === false
									? breadcrumb.label
									: `← ${t("nav.backTo")} ${breadcrumb.label}`,
						})),
					]}
				/>
			) : null}
			<GcdsTopNav alignment="start" label={t("nav.label")} slot="menu">
				<GcdsNavLink href="/" slot="home">
					{serviceName}
				</GcdsNavLink>
				{showNavigation ? (
					<>
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
						{isAuthenticated && !isLoading ? <UserNavGroup /> : null}
					</>
				) : null}
			</GcdsTopNav>
		</GcdsHeader>
	);
};

export default Header;
