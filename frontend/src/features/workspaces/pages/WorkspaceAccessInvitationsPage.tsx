import { Link, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useDocumentTitle } from "@/common/use-document-title";
import { DataTable, Heading, Notice, Text } from "@/components/ui";
import { ROLE_LABEL_KEYS } from "@/features/auth/authorization";
import { getRequestErrorNotice } from "@/fetch";
import { formatLocalizedDate } from "@/common/format-localized-date";
import {
	useWorkspaceAccessInvitations,
	type WorkspaceAccessInvitation,
} from "../hooks/use-workspace-access-invitations";

const invitationStatusLabelKeys = {
	accepted: "workspaces.applicationsInvitationStatusAccepted",
	expired: "workspaces.applicationsInvitationStatusExpired",
	pending: "workspaces.applicationsInvitationStatusPending",
	revoked: "workspaces.applicationsInvitationStatusRevoked",
} as const;
type InvitationRow = WorkspaceAccessInvitation & { [key: string]: unknown };

export const WorkspaceAccessInvitationsPage = (): FunctionComponent => {
	const { i18n, t } = useTranslation();
	const { workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/access/invitations/",
	});
	const { error, invitations, isLoading } =
		useWorkspaceAccessInvitations(workspaceUuid);
	const title = t("workspaces.accessInvitationsTitle");
	useDocumentTitle(title, t("home.title"));
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "workspaces.accessInvitationsErrorBody",
		titleKey: "workspaces.accessInvitationsErrorTitle",
	});

	return (
		<>
			<Heading tag="h1">{title}</Heading>
			<Text>{t("workspaces.accessInvitationsSummary")}</Text>
			{isLoading ? (
				<Text>{t("workspaces.accessInvitationsLoadingBody")}</Text>
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
			{!isLoading && !error ? (
				<DataTable<InvitationRow>
					emptyMessage={t("workspaces.accessInvitationsEmptyBody")}
					itemLabel={t("workspaces.accessInvitationsItemLabel")}
					rows={invitations}
					title={title}
					action={{
						buttonLabel: t("workspaces.manage"),
						href: (row) =>
							`/workspaces/${workspaceUuid}/access/invitations/${row.uuid}`,
						screenReaderLabel: (row) => row.invitedEmail,
						variant: "link",
					}}
					columns={[
						{
							field: "invitedEmail",
							headerName: t("workspaces.applicationsInvitationEmailLabel"),
							rowHeader: true,
						},
						{
							field: "role",
							headerName: t("workspaces.applicationsInvitationRoleLabel"),
							valueFormatter: (row) => t(ROLE_LABEL_KEYS[row.role] as never),
						},
						{
							field: "status",
							headerName: t("workspaces.applicationsInvitationStatusLabel"),
							valueFormatter: (row) =>
								t(invitationStatusLabelKeys[row.status] as never),
						},
						{
							field: "inviteExpiresAt",
							headerName: t(
								"workspaces.applicationsInvitationExpiresAtDisplayLabel"
							),
							valueFormatter: (row) =>
								formatLocalizedDate(row.inviteExpiresAt, i18n.language),
						},
					]}
				/>
			) : null}
			{!isLoading && !error ? (
				<Link
					params={{ workspaceUuid }}
					to="/workspaces/$workspaceUuid/access/invitations/new"
				>
					{t("workspaces.accessInvitationCreateTitle")}
				</Link>
			) : null}
			<Link params={{ workspaceUuid }} to="/workspaces/$workspaceUuid/access">
				{t("workspaces.backToAccessHubAction")}
			</Link>
		</>
	);
};
