import { Link, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useDocumentTitle } from "@/common/use-document-title";
import { Card, Heading, Notice, Text } from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import { useUserAccessAdministration } from "../hooks/use-user-access-administration";

export const UserAccessPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const { userUuid } = useParams({ from: "/users/$userUuid/" });
	const { access, error, isLoading } = useUserAccessAdministration(userUuid);
	const title = access
		? t("users.accessTitle", { name: access.user.name })
		: t("users.accessLoadingTitle");
	useDocumentTitle(title, t("home.title"));
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "users.accessErrorBody",
		titleKey: "users.accessErrorTitle",
	});

	return (
		<>
			<Heading tag="h1">{title}</Heading>
			{isLoading ? <Text>{t("users.accessLoadingBody")}</Text> : null}
			{errorNotice ? (
				<Notice
					noticeRole={errorNotice.noticeRole}
					noticeTitle={t(errorNotice.titleKey as never)}
					noticeTitleTag="h2"
				>
					<Text>{errorNotice.bodyText ?? t(errorNotice.bodyKey as never)}</Text>
				</Notice>
			) : null}
			{access ? (
				<div className="grid gap-400">
					<section className="grid gap-100">
						<Heading tag="h2">{t("users.profileSummaryTitle")}</Heading>
						<Text>{access.user.email}</Text>
						<Text>
							{access.user.enabled
								? t("users.accountStatusActive")
								: t("users.accountStatusDisabled")}
						</Text>
					</section>
					<section className="grid gap-200">
						<Heading tag="h2">{t("users.accessTasksTitle")}</Heading>
						<div className="grid gap-300 md:grid-cols-2">
							<Card
								cardTitle={t("users.manageGlobalAccessAction")}
								cardTitleTag="h3"
								description={t("users.globalAccessTaskDescription")}
								href={`/users/${userUuid}/global-access`}
							/>
							{access.workspaceAssignments.length > 0 ? (
								<Card
									cardTitle={t("users.manageWorkspaceAccessAction")}
									cardTitleTag="h3"
									description={t("users.workspaceAccessTaskDescription")}
									href={`/users/${userUuid}/workspace-access`}
								/>
							) : null}
							{!access.globalAssignment ? (
								<Card
									cardTitle={t("users.addWorkspaceAccessAction")}
									cardTitleTag="h3"
									description={t("users.addWorkspaceAccessTaskDescription")}
									href={`/users/${userUuid}/workspace-access/new`}
								/>
							) : null}
							{access.pendingInvitations.length > 0 ? (
								<Card
									cardTitle={t("users.reviewPendingInvitationsAction")}
									cardTitleTag="h3"
									href={`/users/${userUuid}/invitations`}
									description={t("users.pendingInvitationsTaskDescription", {
										count: access.pendingInvitations.length,
									})}
								/>
							) : null}
						</div>
					</section>
					<Link to="/users">{t("users.returnToUsersAction")}</Link>
				</div>
			) : null}
		</>
	);
};
