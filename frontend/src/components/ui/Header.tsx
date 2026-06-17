import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
	GcdsHeader,
	GcdsLangToggle,
	GcdsNavLink,
	GcdsTopNav,
} from "@gcds-core/components-react";
import type { FunctionComponent } from "@/common/types";
import { useSession } from "@/hooks";

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

const Header = (): FunctionComponent => {
	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	const { currentUser, isAuthenticated, isLoading } = useSession();
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const serviceName =
		import.meta.env.VITE_APP_TITLE?.trim() ||
		"Digital service delivery starter";

	const lang = i18n.language?.startsWith("fr") ? "fr" : "en";
	const targetLang = lang === "en" ? "fr" : "en";
	const handleLangToggle = (): void => {
		localStorage.setItem("i18nextLng", targetLang);
		void navigate({ to: pathname });
		globalThis.location.reload();
	};

	const commonItems: Array<NavigationItem> = [
		{ href: "/", label: t("nav.home") },
		{ href: "/health", label: t("nav.health") },
	];

	const authItems: Array<NavigationItem> = [
		{ href: "/dashboard", label: t("nav.dashboard") },
		{ href: "/profile", label: t("nav.profile") },
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
		<GcdsHeader signatureHasLink skipToHref="#main-content">
			<GcdsLangToggle href="#" lang={lang} slot="toggle" onClick={handleLangToggle} />
			<GcdsTopNav alignment="start" label={t("nav.label")} slot="menu">
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
