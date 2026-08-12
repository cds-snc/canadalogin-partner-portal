import { useParams, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Card, Grid, Heading, Link, Notice, Text } from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import {
	getEffectiveRoleForWorkspace,
	ROLE_LABEL_KEYS,
} from "@/features/auth/authorization";
import { useSession } from "@/hooks";
import { useWorkspace } from "../hooks/use-workspace";
import { getWorkspaceOnboardingStateLabel } from "../onboarding-display";
import {
	getWorkspaceRoutePath,
	getWorkspaceRoutesForSurface,
	type WorkspaceRouteDefinition,
} from "../workspace-route-catalog";

const WORKSPACE_TASK_DESCRIPTION_KEYS = {
	access: "workspaces.taskDescriptions.access",
	applicationInformation: "workspaces.taskDescriptions.applicationInformation",
	reports: "workspaces.taskDescriptions.reports",
	rpApplications: "workspaces.taskDescriptions.rpApplications",
	settings: "workspaces.taskDescriptions.settings",
} as const;

type WorkspaceTaskRoute = WorkspaceRouteDefinition & {
	id: keyof typeof WORKSPACE_TASK_DESCRIPTION_KEYS;
};

const isWorkspaceTaskRoute = (
	route: WorkspaceRouteDefinition
): route is WorkspaceTaskRoute => route.id in WORKSPACE_TASK_DESCRIPTION_KEYS;

const WORKSPACE_TASK_GROUPS = [
	{
		id: "setupAndApplications",
		routeIds: ["applicationInformation", "rpApplications"],
		titleKey: "workspaces.taskGroups.setupAndApplications",
	},
	{
		id: "access",
		routeIds: ["access"],
		titleKey: "workspaces.taskGroups.access",
	},
	{
		id: "insights",
		routeIds: ["reports"],
		titleKey: "workspaces.taskGroups.insights",
	},
	{
		id: "workspaceManagement",
		routeIds: ["settings"],
		titleKey: "workspaces.taskGroups.workspaceManagement",
	},
] as const;

export const WorkspaceDetailPage = (): FunctionComponent => {
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const { workspaceUuid } = useParams({ from: "/workspaces/$workspaceUuid" });
	const { currentUser } = useSession();
	const search = useSearch({ from: "/workspaces/$workspaceUuid" });
	const { error, isLoading, workspace } = useWorkspace(workspaceUuid);
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "workspaces.detailErrorBody",
		titleKey: "workspaces.detailErrorTitle",
	});
	const successMessage =
		search.created === "1"
			? t("workspaces.createdSuccess")
			: search.updated === "1"
				? t("workspaces.updatedSuccess")
				: null;
	const authorizationContext = currentUser?.authorizationContext;
	const effectiveRole = getEffectiveRoleForWorkspace(
		authorizationContext,
		workspaceUuid
	);
	const taskRoutes = getWorkspaceRoutesForSurface(
		"hub",
		authorizationContext,
		workspaceUuid
	).filter(isWorkspaceTaskRoute);

	return (
		<>
			<Heading tag="h1">
				{workspace?.name.trim() || t("workspaces.workspaceLabel")}
			</Heading>
			<Text>{t("workspaces.detailSummary")}</Text>
			{effectiveRole ? (
				<Text>
					{t("authorization.activeWorkspaceNameContext", {
						role: t(ROLE_LABEL_KEYS[effectiveRole]),
						workspaceName:
							workspace?.name.trim() || t("workspaces.workspaceLabel"),
					})}
				</Text>
			) : null}

			{successMessage ? (
				<Notice
					noticeRole="success"
					noticeTitle={successMessage}
					noticeTitleTag="h2"
				>
					<Text>{successMessage}</Text>
				</Notice>
			) : null}

			{isLoading ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("workspaces.detailLoadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.detailLoadingBody")}</Text>
				</Notice>
			) : null}

			{errorNotice ? (
				<Notice
					noticeRole={errorNotice.noticeRole}
					noticeTitle={t(errorNotice.titleKey)}
					noticeTitleTag="h2"
				>
					<Text>{errorNotice.bodyText ?? t(errorNotice.bodyKey)}</Text>
				</Notice>
			) : null}

			{workspace ? (
				<div className="grid gap-300">
					<Heading tag="h2">{t("workspaces.statusTitle")}</Heading>
					<Text>
						{`${t("workspaces.onboardingStateLabel")}: ${workspace.onboardingState?.trim() ? getWorkspaceOnboardingStateLabel(t, workspace.onboardingState) : t("common.notAvailable")}`}
					</Text>
					<Text>
						{`${t("workspaces.descriptionLabel")}: ${workspace.description ?? t("workspaces.noDescriptionText")}`}
					</Text>
					{WORKSPACE_TASK_GROUPS.map((group) => {
						const groupRoutes = taskRoutes.filter((route) =>
							(group.routeIds as ReadonlyArray<string>).includes(route.id)
						);
						if (groupRoutes.length === 0) return null;

						return (
							<section key={group.id}>
								<Heading tag="h2">{t(group.titleKey)}</Heading>
								<Grid columns="1fr" columnsTablet="1fr 1fr" tag="div">
									{groupRoutes.map((route) => (
										<Card
											key={route.id}
											cardTitle={String(t(route.labelKey as never))}
											cardTitleTag="h3"
											href={getWorkspaceRoutePath(route.id, workspaceUuid)}
											description={String(
												t(WORKSPACE_TASK_DESCRIPTION_KEYS[route.id] as never)
											)}
										/>
									))}
								</Grid>
							</section>
						);
					})}
					<Link href="/workspaces">{t("workspaces.chooseAnother")}</Link>
				</div>
			) : null}
		</>
	);
};
