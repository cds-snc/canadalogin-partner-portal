import { useParams, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, Heading, Notice, Text } from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import { useWorkspace } from "../hooks/use-workspace";
import { getWorkspaceOnboardingStateLabel } from "../onboarding-display";

export const WorkspaceDetailPage = (): FunctionComponent => {
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const { workspaceUuid } = useParams({ from: "/workspaces/$workspaceUuid" });
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

	return (
		<>
			<Heading tag="h1">
				{workspace
					? t("workspaces.workspaceTitle", { name: workspace.name })
					: t("workspaces.workspaceLabel")}
			</Heading>
			<Text>{t("workspaces.detailSummary")}</Text>

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
					<Heading tag="h2">{t("workspaces.metadataTitle")}</Heading>
					<Text>{`${t("workspaces.nameLabel")}: ${workspace.name}`}</Text>
					<Text>{`${t("workspaces.slugLabel")}: ${workspace.slug}`}</Text>
					<Text>
						{`${t("workspaces.onboardingStateLabel")}: ${workspace.onboardingState?.trim() ? getWorkspaceOnboardingStateLabel(t, workspace.onboardingState) : t("common.notAvailable")}`}
					</Text>
					<Text>
						{`${t("workspaces.descriptionLabel")}: ${workspace.description ?? t("workspaces.noDescriptionText")}`}
					</Text>
					<Text>
						{`${t("workspaces.submittedAtLabel")}: ${workspace.submittedAt ?? t("common.notAvailable")}`}
					</Text>
					<Text>
						{`${t("workspaces.underReviewAtLabel")}: ${workspace.underReviewAt ?? t("common.notAvailable")}`}
					</Text>
					<Text>
						{`${t("workspaces.approvedAtLabel")}: ${workspace.approvedAt ?? t("common.notAvailable")}`}
					</Text>
					<Text>
						{`${t("workspaces.launchedAtLabel")}: ${workspace.launchedAt ?? t("common.notAvailable")}`}
					</Text>
					<Text>{`${t("workspaces.createdAtLabel")}: ${workspace.createdAt}`}</Text>
					<Text>
						{`${t("workspaces.updatedAtLabel")}: ${workspace.updatedAt ?? t("workspaces.noDescriptionText")}`}
					</Text>
					<div className="flex flex-wrap gap-200">
						<Button
							buttonRole="secondary"
							href={`/workspaces/${workspace.uuid}/applications`}
							type="link"
						>
							{t("workspaces.manageApplications")}
						</Button>
						<Button
							buttonRole="secondary"
							href={`/workspaces/${workspace.uuid}/application-information`}
							type="link"
						>
							{t("workspaces.manageApplicationInformation")}
						</Button>
						<Button
							buttonRole="secondary"
							href={`/workspaces/${workspace.uuid}/members`}
							type="link"
						>
							{t("workspaces.manageMembers")}
						</Button>
						<Button
							buttonRole="secondary"
							href={`/workspaces/${workspace.uuid}/settings`}
							type="link"
						>
							{t("workspaces.settingsAction")}
						</Button>
						<Button href="/workspaces" type="link">
							{t("nav.workspaces")}
						</Button>
					</div>
				</div>
			) : null}
		</>
	);
};
