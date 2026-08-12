import { useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useDocumentTitle } from "@/common/use-document-title";
import {
	Button,
	ConfirmDialog,
	Heading,
	Notice,
	Select,
	Text,
} from "@/components/ui";
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

type RevokeTarget =
	| { kind: "global" }
	| { kind: "invitation"; invitationUuid: string; workspaceUuid: string }
	| { kind: "workspace"; workspaceUuid: string };

export const UserAccessPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const { userUuid } = useParams({ from: "/users/$userUuid" });
	const {
		access,
		assignGlobal,
		assignWorkspace,
		error,
		isLoading,
		isMutating,
		replaceWorkspace,
		revokeGlobal,
		revokeInvitation,
		revokeWorkspace,
	} = useUserAccessAdministration(userUuid);
	const { workspaces } = useWorkspaces();
	useDocumentTitle(
		access
			? t("users.accessTitle", { name: access.user.name })
			: t("users.accessLoadingTitle"),
		t("home.title")
	);
	const [newWorkspaceUuid, setNewWorkspaceUuid] = useState("");
	const [newRole, setNewRole] = useState<PartnerRole>("read_only");
	const [draftRoles, setDraftRoles] = useState<Record<string, PartnerRole>>({});
	const [revokeTarget, setRevokeTarget] = useState<RevokeTarget | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const errorNotice = getRequestErrorNotice(error, {
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

	const confirmRevoke = async (): Promise<void> => {
		if (!revokeTarget) {
			return;
		}
		try {
			if (revokeTarget.kind === "global") {
				await revokeGlobal();
			} else if (revokeTarget.kind === "workspace") {
				await revokeWorkspace(revokeTarget.workspaceUuid);
			} else {
				await revokeInvitation(
					revokeTarget.workspaceUuid,
					revokeTarget.invitationUuid
				);
			}
		} catch {
			return;
		}
		setRevokeTarget(null);
		setSuccessMessage(t("users.accessRevokedSuccess"));
	};
	const completeMutation = async (
		action: () => Promise<unknown>,
		successMessageKey: string
	): Promise<boolean> => {
		try {
			await action();
		} catch {
			return false;
		}
		setSuccessMessage(t(successMessageKey as never));
		return true;
	};

	return (
		<>
			<Heading tag="h1">
				{access
					? t("users.accessTitle", { name: access.user.name })
					: t("users.accessLoadingTitle")}
			</Heading>
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
			{successMessage ? (
				<Notice
					noticeRole="success"
					noticeTitle={successMessage}
					noticeTitleTag="h2"
				>
					<Text>{successMessage}</Text>
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
						<Heading tag="h2">{t("users.globalAccessTitle")}</Heading>
						<Text>
							{access.globalAssignment
								? t("users.clAdminAssignedBody")
								: t("users.noCanonicalGlobalRole")}
						</Text>
						{access.globalAssignment ? (
							<Button
								buttonRole="danger"
								disabled={isMutating}
								type="button"
								onGcdsClick={() => {
									setRevokeTarget({ kind: "global" });
								}}
							>
								{t("users.revokeAction")}
							</Button>
						) : access.workspaceAssignments.length === 0 ? (
							<Button
								disabled={isMutating || !access.user.enabled}
								type="button"
								onGcdsClick={() => {
									void completeMutation(
										assignGlobal,
										"users.clAdminAssignedSuccess"
									);
								}}
							>
								{t("users.assignClAdminAction")}
							</Button>
						) : null}
					</section>
					<section className="grid gap-200">
						<Heading tag="h2">{t("users.workspaceAccessTitle")}</Heading>
						{access.workspaceAssignments.length === 0 ? (
							<Text>{t("users.noWorkspaceAccess")}</Text>
						) : (
							access.workspaceAssignments.map((assignment) => (
								<div
									key={assignment.assignmentUuid}
									className="grid gap-200 rounded-sm border border-solid border-[#d9d9d9] p-200"
								>
									<Heading tag="h3">{assignment.workspaceName}</Heading>
									<Select
										label={t("users.roleLabel")}
										name={`role-${assignment.workspaceUuid}`}
										selectId={`role-${assignment.workspaceUuid}`}
										value={
											draftRoles[assignment.workspaceUuid] ?? assignment.role
										}
										onInput={(event): void => {
											setDraftRoles((current) => ({
												...current,
												[assignment.workspaceUuid]: (
													event.target as HTMLSelectElement
												).value as PartnerRole,
											}));
										}}
									>
										{partnerRoles.map((role) => (
											<option key={role} value={role}>
												{t(ROLE_LABEL_KEYS[role] as never)}
											</option>
										))}
									</Select>
									<div className="flex flex-wrap gap-200">
										<Button
											type="button"
											disabled={
												isMutating ||
												(draftRoles[assignment.workspaceUuid] ??
													assignment.role) === assignment.role
											}
											onGcdsClick={() => {
												void completeMutation(
													() =>
														replaceWorkspace(
															assignment.workspaceUuid,
															draftRoles[assignment.workspaceUuid] ??
																assignment.role
														),
													"users.accessSavedSuccess"
												);
											}}
										>
											{t("users.saveActionShort")}
										</Button>
										<Button
											buttonRole="danger"
											disabled={isMutating}
											type="button"
											onGcdsClick={() => {
												setRevokeTarget({
													kind: "workspace",
													workspaceUuid: assignment.workspaceUuid,
												});
											}}
										>
											{t("users.revokeAction")}
										</Button>
									</div>
								</div>
							))
						)}
						{!access.globalAssignment && availableWorkspaces.length > 0 ? (
							<div className="grid gap-200 rounded-sm border border-solid border-[#d9d9d9] p-200">
								<Heading tag="h3">{t("users.addWorkspaceAccessTitle")}</Heading>
								<Select
									label={t("users.inviteWorkspaceLabel")}
									name="new-workspace-access"
									selectId="new-workspace-access"
									value={newWorkspaceUuid}
									onInput={(event): void => {
										setNewWorkspaceUuid(
											(event.target as HTMLSelectElement).value
										);
									}}
								>
									<option value="">
										{t("users.inviteWorkspacePlaceholder")}
									</option>
									{availableWorkspaces.map((workspace) => (
										<option key={workspace.uuid} value={workspace.uuid}>
											{workspace.name}
										</option>
									))}
								</Select>
								<Select
									label={t("users.roleLabel")}
									name="new-workspace-role"
									selectId="new-workspace-role"
									value={newRole}
									onInput={(event): void => {
										setNewRole(
											(event.target as HTMLSelectElement).value as PartnerRole
										);
									}}
								>
									{partnerRoles.map((role) => (
										<option key={role} value={role}>
											{t(ROLE_LABEL_KEYS[role] as never)}
										</option>
									))}
								</Select>
								<Button
									disabled={isMutating || newWorkspaceUuid.length === 0}
									type="button"
									onGcdsClick={() => {
										void completeMutation(
											() => assignWorkspace(newWorkspaceUuid, newRole),
											"users.accessAssignedSuccess"
										).then((succeeded) => {
											if (succeeded) {
												setNewWorkspaceUuid("");
											}
										});
									}}
								>
									{t("users.assignAction")}
								</Button>
							</div>
						) : null}
					</section>
					<section className="grid gap-200">
						<Heading tag="h2">{t("users.pendingInvitationsTitle")}</Heading>
						{access.pendingInvitations.length === 0 ? (
							<Text>{t("users.noPendingInvitations")}</Text>
						) : (
							access.pendingInvitations.map((invitation) => (
								<div
									key={invitation.invitationUuid}
									className="grid gap-100 rounded-sm border border-solid border-[#d9d9d9] p-200"
								>
									<Heading tag="h3">{invitation.workspaceName}</Heading>
									<Text>{t(ROLE_LABEL_KEYS[invitation.role] as never)}</Text>
									<Button
										buttonRole="danger"
										disabled={isMutating}
										type="button"
										onGcdsClick={() => {
											setRevokeTarget({
												invitationUuid: invitation.invitationUuid,
												kind: "invitation",
												workspaceUuid: invitation.workspaceUuid,
											});
										}}
									>
										{t("users.revokeAction")}
									</Button>
								</div>
							))
						)}
					</section>
					<Button buttonRole="secondary" href="/users" type="link">
						{t("users.backToUsersAction")}
					</Button>
				</div>
			) : null}
			<ConfirmDialog
				cancelLabel={t("common.cancel")}
				confirmLabel={t("users.revokeAction")}
				description={t("users.revokeAccessConfirmBody")}
				errorMessage={null}
				errorTitle={t("users.accessErrorTitle")}
				isOpen={revokeTarget !== null}
				isPending={isMutating}
				title={t("users.revokeAccessConfirmTitle")}
				onClose={() => {
					setRevokeTarget(null);
				}}
				onConfirm={() => {
					void confirmRevoke();
				}}
			/>
		</>
	);
};
