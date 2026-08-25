import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useDocumentTitle } from "@/common/use-document-title";
import { Button, Heading, Notice, Select, Text } from "@/components/ui";
import {
	ROLE_LABEL_KEYS,
	type PartnerRole,
} from "@/features/auth/authorization";
import { getRequestErrorNotice } from "@/fetch";
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces";
import { useUserAccessAdministration } from "../hooks/use-user-access-administration";

const partnerRoles: ReadonlyArray<PartnerRole> = [
	"rp_admin",
	"rp_user_edit",
	"read_only",
];

export const UserWorkspaceAccessNewPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { userUuid } = useParams({
		from: "/users/$userUuid/workspace-access/new",
	});
	const { access, assignWorkspace, error, isLoading, isMutating } =
		useUserAccessAdministration(userUuid);
	const {
		error: workspacesError,
		isLoading: workspacesLoading,
		workspaces,
	} = useWorkspaces();
	const [workspaceUuid, setWorkspaceUuid] = useState("");
	const [role, setRole] = useState<PartnerRole>("read_only");
	const title = t("users.addWorkspaceAccessPageTitle");
	useDocumentTitle(title, t("home.title"));
	const errorNotice = getRequestErrorNotice(error ?? workspacesError, {
		bodyKey: "users.accessErrorBody",
		titleKey: "users.accessErrorTitle",
	});
	const assignedWorkspaceUuids = new Set(
		access?.workspaceAssignments.map(
			(assignment) => assignment.workspaceUuid
		) ?? []
	);
	const availableWorkspaces = workspaces.filter(
		(workspace) => !assignedWorkspaceUuids.has(workspace.uuid)
	);

	const submit = async (): Promise<void> => {
		if (!workspaceUuid) return;
		try {
			await assignWorkspace(workspaceUuid, role);
		} catch {
			return;
		}
		await navigate({
			params: { userUuid },
			to: "/users/$userUuid/workspace-access",
		});
	};

	return (
		<>
			<Heading tag="h1">{title}</Heading>
			<Text>{t("users.addWorkspaceAccessSummary")}</Text>
			{isLoading ? <Text>{t("users.accessLoadingBody")}</Text> : null}
			{workspacesLoading ? (
				<Text>{t("users.inviteLoadingWorkspaces")}</Text>
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
			{access?.globalAssignment ? (
				<Notice
					noticeRole="warning"
					noticeTitle={t("users.workspaceAccessUnavailableTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("users.workspaceAccessUnavailableForClAdmin")}</Text>
				</Notice>
			) : access &&
			  !workspacesLoading &&
			  !workspacesError &&
			  availableWorkspaces.length > 0 ? (
				<form
					className="grid gap-300"
					onSubmit={(event) => {
						event.preventDefault();
						void submit();
					}}
				>
					<Select
						required
						label={t("users.inviteWorkspaceLabel")}
						name="workspace"
						selectId="workspace"
						value={workspaceUuid}
						onInput={(event) => {
							setWorkspaceUuid((event.target as HTMLSelectElement).value);
						}}
					>
						<option value="">{t("users.inviteWorkspacePlaceholder")}</option>
						{availableWorkspaces.map((workspace) => (
							<option key={workspace.uuid} value={workspace.uuid}>
								{workspace.name}
							</option>
						))}
					</Select>
					<Select
						label={t("users.roleLabel")}
						name="role"
						selectId="role"
						value={role}
						onInput={(event) => {
							setRole((event.target as HTMLSelectElement).value as PartnerRole);
						}}
					>
						{partnerRoles.map((partnerRole) => (
							<option key={partnerRole} value={partnerRole}>
								{t(ROLE_LABEL_KEYS[partnerRole] as never)}
							</option>
						))}
					</Select>
					<Button disabled={isMutating || !workspaceUuid} type="submit">
						{isMutating ? t("users.assigningAction") : t("users.assignAction")}
					</Button>
				</form>
			) : access && !workspacesLoading && !workspacesError ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("users.noAvailableWorkspaces")}
					noticeTitleTag="h2"
				>
					<Text>{t("users.noAvailableWorkspaces")}</Text>
				</Notice>
			) : null}
			<Link params={{ userUuid }} to="/users/$userUuid/workspace-access">
				{t("users.backToWorkspaceAccessAction")}
			</Link>
		</>
	);
};
