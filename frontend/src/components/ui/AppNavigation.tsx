import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
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

const AppNavigation = (): FunctionComponent => {
	const { t } = useTranslation();
	const { currentUser, isAuthenticated, isLoading, logout } = useSession();
	const navigate = useNavigate();
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});

	const handleLogout = (): void => {
		void (async (): Promise<void> => {
			await logout();
			await navigate({ replace: true, to: "/" });
		})();
	};

	const commonItems: Array<NavigationItem> = [
		{ href: "/", label: t("nav.home") },
		{ href: "/health", label: t("nav.health") },
	];

	const authItems: Array<NavigationItem> = [
		{ href: "/dashboard", label: t("nav.dashboard") },
		{ href: "/profile", label: t("nav.profile") },
		{ href: "/logout", label: t("nav.logout") },
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
		];
	} else {
		items = [...commonItems, ...publicItems];
	}

	return (
		<nav
			aria-label={t("nav.label")}
			className="border-t border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)]"
		>
			<div className="mx-auto w-full max-w-[72rem] px-400 md:px-600">
				<ul className="flex flex-wrap gap-x-400 gap-y-150 py-250 text-sm">
					{items.map((item) => {
						if (item.href === "/logout") {
							return (
								<li key={item.href}>
									<button
										className="text-[var(--gcds-text-primary)] underline-offset-[0.16em] hover:text-[var(--gcds-text-secondary)]"
										type="button"
										onClick={handleLogout}
									>
										{item.label}
									</button>
								</li>
							);
						}

						const current = isCurrentPath(pathname, item.href);

						return (
							<li key={item.href}>
								<a
									aria-current={current ? "page" : undefined}
									href={item.href}
									className={[
										"underline-offset-[0.16em]",
										current
											? "font-semibold text-[var(--gcds-text-primary)] no-underline"
											: "text-[var(--gcds-text-primary)] hover:text-[var(--gcds-text-secondary)]",
									].join(" ")}
								>
									{item.label}
								</a>
							</li>
						);
					})}
				</ul>
			</div>
		</nav>
	);
};

export default AppNavigation;
