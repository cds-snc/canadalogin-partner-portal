import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useDocumentTitle } from "@/common/use-document-title";
import type { DataTableColumn } from "@/components/ui/DataTable";
import { DataTable, Heading, Notice, Pagination, Text } from "@/components/ui";
import { ROLE_LABEL_KEYS } from "@/features/auth/authorization";
import { getRequestErrorNotice } from "@/fetch";
import {
	useAdminListState,
	usePendingUserInvitations,
	useUserManagement,
} from "@/hooks";

type UserTableRow = {
	accountStatus: string;
	email: string;
	globalAccess: string;
	name: string;
	uuid: string;
	workspaceAccess: string;
};

type PendingInvitationTableRow = {
	email: string;
	expires: string;
	invitationUuid: string;
	role: string;
	status: string;
	workspace: string;
	workspaceUuid: string;
};

export const UsersPage = (): FunctionComponent => {
	const { i18n, t } = useTranslation();
	const navigate = useNavigate();
	const [invitationPage, setInvitationPage] = useState(1);
	useDocumentTitle(t("users.title"), t("home.title"));
	const { page, searchDraft, setPage, setSearchDraft } =
		useAdminListState("users");
	const itemsPerPage = 10;
	const { error, isLoading, response, users } = useUserManagement(
		page,
		itemsPerPage,
		searchDraft
	);
	const invitationItemsPerPage = 10;
	const {
		error: invitationError,
		invitations,
		isLoading: invitationsAreLoading,
		response: invitationResponse,
	} = usePendingUserInvitations(invitationPage, invitationItemsPerPage);
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "users.errorBody",
		titleKey: "users.errorTitle",
	});
	const hasUserSearchInput = searchDraft.length > 0;
	const invitationErrorNotice = getRequestErrorNotice(invitationError, {
		bodyKey: "users.pendingInvitationsErrorBody",
		titleKey: "users.pendingInvitationsErrorTitle",
	});
	const dateLocale = i18n.resolvedLanguage?.startsWith("fr")
		? "fr-CA"
		: "en-CA";
	const invitationRows: Array<PendingInvitationTableRow> = invitations.map(
		(invitation) => ({
			email: invitation.invitedEmail,
			expires: new Intl.DateTimeFormat(dateLocale, {
				dateStyle: "medium",
			}).format(new Date(invitation.inviteExpiresAt)),
			invitationUuid: invitation.invitationUuid,
			role: t(ROLE_LABEL_KEYS[invitation.role] as never),
			status: t("users.pendingInvitationStatus"),
			workspace: invitation.workspaceName,
			workspaceUuid: invitation.workspaceUuid,
		})
	);
	const rows: Array<UserTableRow> = users.map((user) => ({
		accountStatus: user.enabled
			? t("users.accountStatusActive")
			: t("users.accountStatusDisabled"),
		email: user.email,
		globalAccess: user.globalRole
			? t(ROLE_LABEL_KEYS[user.globalRole] as never)
			: t("users.noCanonicalGlobalRoleShort"),
		name: user.name,
		uuid: user.uuid,
		workspaceAccess:
			user.workspaceAssignments.length === 0
				? t("users.noWorkspaceAccess")
				: user.workspaceAssignments
						.map(
							(assignment) =>
								`${assignment.workspaceName} — ${String(t(ROLE_LABEL_KEYS[assignment.role] as never))}`
						)
						.join(", "),
	}));
	const columns: Array<DataTableColumn<UserTableRow>> = [
		{ field: "name", headerName: t("users.nameLabel"), pinned: "left" },
		{ field: "email", headerName: t("users.emailLabel") },
		{ field: "accountStatus", headerName: t("users.accountStatusLabel") },
		{ field: "globalAccess", headerName: t("users.globalAccessLabel") },
		{ field: "workspaceAccess", headerName: t("users.workspaceAccessLabel") },
	];
	const totalPages = response
		? Math.max(1, Math.ceil(response.total_count / response.items_per_page))
		: 1;
	const invitationTotalPages = invitationResponse
		? Math.max(
				1,
				Math.ceil(
					invitationResponse.total_count / invitationResponse.items_per_page
				)
			)
		: 1;
	const invitationColumns: Array<DataTableColumn<PendingInvitationTableRow>> = [
		{ field: "email", headerName: t("users.emailLabel"), pinned: "left" },
		{ field: "workspace", headerName: t("users.inviteWorkspaceLabel") },
		{ field: "role", headerName: t("users.requestedRoleLabel") },
		{ field: "status", headerName: t("users.invitationStatusLabel") },
		{ field: "expires", headerName: t("users.invitationExpiresLabel") },
	];

	return (
		<>
			<Heading tag="h1">{t("users.title")}</Heading>
			<Text>{t("users.summary")}</Text>
			{isLoading ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("users.loadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("users.loadingBody")}</Text>
				</Notice>
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
				<div className="grid gap-300">
					<DataTable
						columns={columns}
						itemLabel={t("users.itemLabel")}
						pagination={false}
						rows={rows}
						searchLabel={t("users.searchLabel")}
						searchLengthError={t("users.searchLengthError")}
						searchMaxLength={100}
						searchMinLength={2}
						searchMode="server"
						searchQuery={searchDraft}
						title={t("users.title")}
						action={[
							{
								buttonId: (row) => `manage-user-${row.uuid}`,
								buttonLabel: t("users.manageAction"),
								onAction: (row): void => {
									void navigate({
										params: { userUuid: row.uuid },
										to: "/users/$userUuid",
									});
								},
								screenReaderLabel: (row) => row.email,
							},
						]}
						emptyMessage={t(
							hasUserSearchInput ? "users.searchEmptyBody" : "users.emptyBody"
						)}
						primaryAction={{
							buttonId: "invite-user",
							buttonLabel: t("users.inviteAction"),
							onAction: (): void => {
								void navigate({ to: "/users/invite" });
							},
						}}
						onSearchChange={(query): void => {
							setSearchDraft(query);
							setPage(1);
						}}
					/>
					{!hasUserSearchInput ? (
						<Pagination
							currentPage={page}
							label={t("users.paginationLabel")}
							totalPages={totalPages}
							onPageChange={setPage}
						/>
					) : null}
				</div>
			) : null}
			<section className="grid gap-300">
				<Heading tag="h2">{t("users.pendingInvitationsTitle")}</Heading>
				<Text>{t("users.pendingInvitationsSummary")}</Text>
				{invitationsAreLoading ? (
					<Notice
						noticeRole="info"
						noticeTitle={t("users.pendingInvitationsLoadingTitle")}
						noticeTitleTag="h3"
					>
						<Text>{t("users.pendingInvitationsLoadingBody")}</Text>
					</Notice>
				) : null}
				{invitationErrorNotice ? (
					<Notice
						noticeRole={invitationErrorNotice.noticeRole}
						noticeTitle={t(invitationErrorNotice.titleKey as never)}
						noticeTitleTag="h3"
					>
						<Text>
							{invitationErrorNotice.bodyText ??
								t(invitationErrorNotice.bodyKey as never)}
						</Text>
					</Notice>
				) : null}
				{!invitationsAreLoading &&
				!invitationError &&
				invitations.length === 0 ? (
					<Text>{t("users.noPendingInvitations")}</Text>
				) : null}
				{invitations.length > 0 ? (
					<>
						<DataTable
							columns={invitationColumns}
							filter={false}
							itemLabel={t("users.invitationItemLabel")}
							pagination={false}
							rows={invitationRows}
							title={t("users.pendingInvitationsTitle")}
							action={[
								{
									buttonId: (row) => `manage-invitation-${row.invitationUuid}`,
									buttonLabel: t("users.manageAction"),
									onAction: (row): void => {
										void navigate({
											params: { workspaceUuid: row.workspaceUuid },
											to: "/workspaces/$workspaceUuid/access",
										});
									},
									screenReaderLabel: (row) => row.email,
								},
							]}
						/>
						{invitationTotalPages > 1 ? (
							<Pagination
								currentPage={invitationPage}
								label={t("users.invitationPaginationLabel")}
								totalPages={invitationTotalPages}
								onPageChange={setInvitationPage}
							/>
						) : null}
					</>
				) : null}
			</section>
		</>
	);
};
