import type { PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";
import { useRouterState } from "@tanstack/react-router";
import type { FunctionComponent } from "@/common/types";
import { Link } from "@/components";
import { findRouteByPath } from "@/features/navigation/route-catalog";

export const AdministrationSectionLayout = ({
	children,
}: PropsWithChildren): FunctionComponent => {
	const { t } = useTranslation();
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const currentRoute = findRouteByPath(pathname);

	const isFirstLevelChild =
		currentRoute?.parentTaskArea === "administration" &&
		currentRoute.id !== "administration" &&
		(pathname === currentRoute.path || pathname === `${currentRoute.path}/`);

	if (!isFirstLevelChild) {
		return <>{children}</>;
	}

	return (
		<div className="grid gap-400">
			<div>{children}</div>
			<Link href="/administration">{t("administration.backToHub")}</Link>
		</div>
	);
};
