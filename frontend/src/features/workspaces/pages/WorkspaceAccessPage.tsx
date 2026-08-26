import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useDocumentTitle } from "@/common/use-document-title";
import { Card, Heading, Notice, Text } from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import { useWorkspace } from "../hooks/use-workspace";

export const WorkspaceAccessPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const { workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/access/",
	});
	const { error, isLoading, workspace } = useWorkspace(workspaceUuid);
	const title = workspace
		? t("workspaces.accessPageTitle", { name: workspace.name })
		: t("workspaces.navigation.access");
	useDocumentTitle(title, t("home.title"));
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "workspaces.detailErrorBody",
		titleKey: "workspaces.detailErrorTitle",
	});

	return (
		<>
			<Heading tag="h1">{title}</Heading>
			<Text>{t("workspaces.accessHubSummary")}</Text>
			{isLoading ? <Text>{t("workspaces.loading")}</Text> : null}
			{errorNotice ? (
				<Notice
					noticeRole={errorNotice.noticeRole}
					noticeTitle={t(errorNotice.titleKey as never)}
					noticeTitleTag="h2"
				>
					<Text>{errorNotice.bodyText ?? t(errorNotice.bodyKey as never)}</Text>
				</Notice>
			) : null}
			{workspace ? (
				<section className="grid gap-200">
					<Heading tag="h2">{t("workspaces.accessTasksTitle")}</Heading>
					<div className="grid gap-300 md:grid-cols-2">
						<Card
							cardTitle={t("workspaces.currentAssignments")}
							cardTitleTag="h3"
							description={t("workspaces.assignmentsTaskDescription")}
							href={`/workspaces/${workspaceUuid}/access/assignments`}
						/>
						<Card
							cardTitle={t("workspaces.addExistingUserTaskTitle")}
							cardTitleTag="h3"
							description={t("workspaces.addExistingUserTaskDescription")}
							href={`/workspaces/${workspaceUuid}/access/assignments/new`}
						/>
						<Card
							cardTitle={t("workspaces.accessInvitationsTitle")}
							cardTitleTag="h3"
							description={t("workspaces.invitationsTaskDescription")}
							href={`/workspaces/${workspaceUuid}/access/invitations`}
						/>
						<Card
							cardTitle={t("workspaces.accessInvitationCreateTitle")}
							cardTitleTag="h3"
							description={t("workspaces.inviteUserTaskDescription")}
							href={`/workspaces/${workspaceUuid}/access/invitations/new`}
						/>
					</div>
				</section>
			) : null}
		</>
	);
};
