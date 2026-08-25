import { Link, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useDocumentTitle } from "@/common/use-document-title";
import { DataTable, Heading, Notice, Text } from "@/components/ui";
import { ROLE_LABEL_KEYS } from "@/features/auth/authorization";
import { getRequestErrorNotice } from "@/fetch";
import { formatLocalizedDate } from "@/common/format-localized-date";
import { useUserAccessAdministration } from "../hooks/use-user-access-administration";

type InvitationRow = {
	[key: string]: unknown;
	expiresAt: string;
	invitationUuid: string;
	role: string;
	status: string;
	workspaceName: string;
	workspaceUuid: string;
};

export const UserInvitationsPage = (): FunctionComponent => {
	const { i18n, t } = useTranslation();
	const { userUuid } = useParams({ from: "/users/$userUuid/invitations" });
	const { access, error, isLoading } = useUserAccessAdministration(userUuid);
	const title = t("users.pendingInvitationsPageTitle");
	useDocumentTitle(title, t("home.title"));
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "users.accessErrorBody",
		titleKey: "users.accessErrorTitle",
	});
	const rows: Array<InvitationRow> =
		access?.pendingInvitations.map((invitation) => ({
			expiresAt: formatLocalizedDate(invitation.inviteExpiresAt, i18n.language),
			invitationUuid: invitation.invitationUuid,
			role: invitation.role,
			status: t("users.pendingInvitationStatus"),
			workspaceName: invitation.workspaceName,
			workspaceUuid: invitation.workspaceUuid,
		})) ?? [];

	return (
		<>
			<Heading tag="h1">{title}</Heading>
			<Text>{t("users.selectedUserPendingInvitationsSummary")}</Text>
			{isLoading ? (
				<Text>{t("users.pendingInvitationsLoadingBody")}</Text>
			) : null}
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
				<DataTable<InvitationRow>
					emptyMessage={t("users.noPendingInvitations")}
					itemLabel={t("users.invitationItemLabel")}
					rows={rows}
					title={title}
					action={{
						buttonLabel: t("users.manageAction"),
						href: (row) =>
							`/workspaces/${row.workspaceUuid}/access/invitations/${row.invitationUuid}`,
						screenReaderLabel: (row) => row.workspaceName,
						variant: "link",
					}}
					columns={[
						{
							field: "workspaceName",
							headerName: t("users.inviteWorkspaceLabel"),
							rowHeader: true,
						},
						{
							field: "role",
							headerName: t("users.requestedRoleLabel"),
							valueFormatter: (row) =>
								t(
									ROLE_LABEL_KEYS[
										row.role as keyof typeof ROLE_LABEL_KEYS
									] as never
								),
						},
						{
							field: "expiresAt",
							headerName: t("users.invitationExpiresLabel"),
						},
						{
							field: "status",
							headerName: t("users.invitationStatusLabel"),
						},
					]}
				/>
			) : null}
			<Link params={{ userUuid }} to="/users/$userUuid">
				{t("users.backToSelectedUserAction")}
			</Link>
		</>
	);
};
