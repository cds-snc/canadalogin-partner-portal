import { useParams, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, Heading, Notice, Text } from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import { hasCapability } from "@/features/auth/authorization";
import { RPApplicationSummaryCard } from "@/features/rp-applications/components/RPApplicationSummaryCard";
import { useSession } from "@/hooks";
import { useWorkspace } from "../hooks/use-workspace";
import { useWorkspaceRPApplications } from "../hooks/use-workspace-rp-applications";

export const WorkspaceApplicationsListPage = (): FunctionComponent => {
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const { currentUser } = useSession();
	const { workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/applications",
	});
	const search = useSearch({
		from: "/workspaces/$workspaceUuid/applications",
	});
	const { workspace } = useWorkspace(workspaceUuid);
	const { applications, error, isLoading } =
		useWorkspaceRPApplications(workspaceUuid);
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "workspaces.applicationsErrorBody",
		titleKey: "workspaces.applicationsErrorTitle",
	});
	const successMessage =
		search.deleted === "1" ? t("workspaces.applicationDeletedSuccess") : null;
	const canCreateApplication = hasCapability(
		currentUser?.authorizationContext,
		"rp_configuration_write",
		workspaceUuid
	);

	return (
		<>
			<Heading tag="h1">
				{workspace
					? t("workspaces.applicationsListTitle", { name: workspace.name })
					: t("workspaces.applicationsSectionTitle")}
			</Heading>
			<Text>{t("workspaces.applicationsListSummary")}</Text>
			{canCreateApplication ? (
				<div>
					<Button
						href={`/workspaces/${workspaceUuid}/applications/new`}
						type="link"
					>
						{t("workspaces.applicationsCreateAction")}
					</Button>
				</div>
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
					noticeTitle={t("workspaces.applicationsLoadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.applicationsLoadingBody")}</Text>
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

			{!isLoading && !error && applications.length === 0 ? (
				<Notice
					noticeRole="warning"
					noticeTitle={t("workspaces.applicationsEmptyTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.applicationsEmptyBody")}</Text>
					{canCreateApplication ? (
						<div className="mt-200">
							<Button
								href={`/workspaces/${workspaceUuid}/applications/new`}
								type="link"
							>
								{t("workspaces.applicationsCreateAction")}
							</Button>
						</div>
					) : null}
				</Notice>
			) : null}

			{applications.length > 0 ? (
				<div className="flex flex-col gap-200">
					{applications.map((application) => (
						<RPApplicationSummaryCard
							key={application.uuid}
							application={application}
						/>
					))}
				</div>
			) : null}
		</>
	);
};
