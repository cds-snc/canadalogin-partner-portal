import { Link, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useDocumentTitle } from "@/common/use-document-title";
import { DataTable, Heading, Notice, Text } from "@/components/ui";
import { ROLE_LABEL_KEYS } from "@/features/auth/authorization";
import { getRequestErrorNotice } from "@/fetch";
import { useUserAccessAdministration } from "../hooks/use-user-access-administration";

type WorkspaceAccessRow = {
	[key: string]: unknown;
	assignmentUuid: string;
	role: string;
	status: string;
	workspaceName: string;
	workspaceUuid: string;
};

export const UserWorkspaceAccessPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const { userUuid } = useParams({
		from: "/users/$userUuid/workspace-access/",
	});
	const { access, error, isLoading } = useUserAccessAdministration(userUuid);
	const title = t("users.workspaceAccessPageTitle");
	useDocumentTitle(title, t("home.title"));
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "users.accessErrorBody",
		titleKey: "users.accessErrorTitle",
	});
	const rows: Array<WorkspaceAccessRow> =
		access?.workspaceAssignments.map((assignment) => ({
			assignmentUuid: assignment.assignmentUuid,
			role: assignment.role,
			status: t("users.assignmentStatusActive"),
			workspaceName: assignment.workspaceName,
			workspaceUuid: assignment.workspaceUuid,
		})) ?? [];

	return (
		<>
			<Heading tag="h1">{title}</Heading>
			<Text>{t("users.workspaceAccessSummary")}</Text>
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
				access.globalAssignment ? (
					<Notice
						noticeRole="warning"
						noticeTitle={t("users.workspaceAccessUnavailableTitle")}
						noticeTitleTag="h2"
					>
						<Text>{t("users.workspaceAccessUnavailableForClAdmin")}</Text>
					</Notice>
				) : (
					<DataTable<WorkspaceAccessRow>
						emptyMessage={t("users.noWorkspaceAccess")}
						itemLabel={t("users.workspaceAssignmentItemLabel")}
						rows={rows}
						title={t("users.workspaceAssignmentsTableTitle")}
						action={{
							buttonLabel: t("users.manageAction"),
							href: (row) =>
								`/workspaces/${row.workspaceUuid}/access/assignments/${row.assignmentUuid}`,
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
								headerName: t("users.roleLabel"),
								valueFormatter: (row) =>
									t(
										ROLE_LABEL_KEYS[
											row.role as keyof typeof ROLE_LABEL_KEYS
										] as never
									),
							},
							{
								field: "status",
								headerName: t("users.assignmentStatusLabel"),
							},
						]}
					/>
				)
			) : null}
			{access && !access.globalAssignment ? (
				<Link params={{ userUuid }} to="/users/$userUuid/workspace-access/new">
					{t("users.addWorkspaceAccessAction")}
				</Link>
			) : null}
			<Link params={{ userUuid }} to="/users/$userUuid">
				{t("users.backToSelectedUserAction")}
			</Link>
		</>
	);
};
