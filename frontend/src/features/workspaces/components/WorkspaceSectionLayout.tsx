import type { PropsWithChildren } from "react";
import { useParams, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Link } from "@/components";
import { useWorkspace } from "../hooks/use-workspace";
import {
	findWorkspaceRouteByPath,
	getWorkspaceRoutePath,
} from "../workspace-route-catalog";

export const WorkspaceSectionLayout = ({
	children,
}: PropsWithChildren): FunctionComponent => {
	const { t } = useTranslation();
	const { workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid",
	});
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const { workspace } = useWorkspace(workspaceUuid);
	const workspaceName =
		workspace?.name.trim() || t("workspaces.workspaceLabel");
	const currentRoute = findWorkspaceRouteByPath(pathname, workspaceUuid);
	const isFirstLevelChild =
		currentRoute !== null &&
		currentRoute.id !== "overview" &&
		(pathname === getWorkspaceRoutePath(currentRoute.id, workspaceUuid) ||
			pathname === `${getWorkspaceRoutePath(currentRoute.id, workspaceUuid)}/`);

	if (!isFirstLevelChild) {
		return <>{children}</>;
	}

	return (
		<div className="grid gap-400">
			<div>{children}</div>
			<Link href={getWorkspaceRoutePath("overview", workspaceUuid)}>
				{t("workspaces.backToHub", { name: workspaceName })}
			</Link>
		</div>
	);
};
