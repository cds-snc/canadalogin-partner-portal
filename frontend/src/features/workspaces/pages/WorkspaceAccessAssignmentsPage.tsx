import { Link, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useDocumentTitle } from "@/common/use-document-title";
import { DataTable, Heading, Notice, Text } from "@/components/ui";
import { isClAdmin, ROLE_LABEL_KEYS } from "@/features/auth/authorization";
import { getRequestErrorNotice } from "@/fetch";
import type { RoleAssignmentRead } from "@/fetch/role-assignments";
import { useSession } from "@/hooks";
import { useWorkspace } from "../hooks/use-workspace";
import { useWorkspaceRoleAssignments } from "../hooks/use-workspace-role-assignments";

type AssignmentRow = RoleAssignmentRead & { [key: string]: unknown };

export const WorkspaceAccessAssignmentsPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const { currentUser } = useSession();
	const { workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/access/assignments/",
	});
	const { workspace } = useWorkspace(workspaceUuid);
	const { assignments, error, isLoading } =
		useWorkspaceRoleAssignments(workspaceUuid);
	const actorIsClAdmin = isClAdmin(currentUser?.authorizationContext);
	const title = t("workspaces.currentAssignments");
	useDocumentTitle(title, t("home.title"));
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "workspaces.roleAssignmentsErrorBody",
		titleKey: "workspaces.roleAssignmentsErrorTitle",
	});
	const canManage = (row: AssignmentRow): boolean =>
		actorIsClAdmin || row.role !== "rp_admin";

	return (
		<>
			<Heading tag="h1">{title}</Heading>
			<Text>
				{t("workspaces.assignmentsPageSummary", {
					name: workspace?.name ?? t("workspaces.workspaceLabel"),
				})}
			</Text>
			{isLoading ? <Text>{t("workspaces.membersLoadingBody")}</Text> : null}
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
				<DataTable<AssignmentRow>
					emptyMessage={t("workspaces.noAssignmentsBody")}
					itemLabel={t("workspaces.roleAssignmentsItemLabel")}
					rows={assignments}
					title={title}
					action={{
						buttonLabel: t("workspaces.manage"),
						href: (row) =>
							`/workspaces/${workspaceUuid}/access/assignments/${row.assignmentUuid}`,
						isVisible: canManage,
						screenReaderLabel: (row) => row.userName,
						variant: "link",
					}}
					columns={[
						{
							field: "userName",
							headerName: t("workspaces.memberName"),
							rowHeader: true,
						},
						{ field: "userEmail", headerName: t("workspaces.memberEmail") },
						{
							field: "role",
							headerName: t("workspaces.memberRole"),
							valueFormatter: (row) => t(ROLE_LABEL_KEYS[row.role] as never),
						},
						{
							field: "assignmentUuid",
							headerName: t("workspaces.assignmentStatusLabel"),
							valueFormatter: () => t("workspaces.assignmentStatusActive"),
						},
					]}
				/>
			) : null}
			{!isLoading && !error ? (
				<Link
					params={{ workspaceUuid }}
					to="/workspaces/$workspaceUuid/access/assignments/new"
				>
					{t("workspaces.addExistingUserTaskTitle")}
				</Link>
			) : null}
			<Link params={{ workspaceUuid }} to="/workspaces/$workspaceUuid/access">
				{t("workspaces.backToAccessHubAction")}
			</Link>
		</>
	);
};
