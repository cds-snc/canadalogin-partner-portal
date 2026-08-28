import { Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
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
	isClAdmin,
	ROLE_LABEL_KEYS,
	type PartnerRole,
} from "@/features/auth/authorization";
import { getRequestErrorNotice } from "@/fetch";
import { useSession } from "@/hooks";
import { useWorkspaceRoleAssignment } from "../hooks/use-workspace-role-assignment";

const lowerPartnerRoles: ReadonlyArray<PartnerRole> = [
	"rp_user_edit",
	"read_only",
];
const allPartnerRoles: ReadonlyArray<PartnerRole> = [
	"rp_admin",
	...lowerPartnerRoles,
];

export const WorkspaceAccessAssignmentPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const { currentUser } = useSession();
	const { assignmentUuid, workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/access/assignments/$assignmentUuid",
	});
	const {
		assignment,
		error,
		isLoading,
		isReplacing,
		isRevoking,
		replace,
		revoke,
	} = useWorkspaceRoleAssignment(workspaceUuid, assignmentUuid);
	const actorIsClAdmin = isClAdmin(currentUser?.authorizationContext);
	const manageable = Boolean(
		assignment && (actorIsClAdmin || assignment.role !== "rp_admin")
	);
	const roles = actorIsClAdmin ? allPartnerRoles : lowerPartnerRoles;
	const [roleOverride, setRoleOverride] = useState<PartnerRole | null>(null);
	const [confirmRevoke, setConfirmRevoke] = useState(false);
	const [localError, setLocalError] = useState<Error | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const title = assignment
		? t("workspaces.assignmentPageTitle", { name: assignment.userName })
		: t("workspaces.assignmentPageLoadingTitle");
	useDocumentTitle(title, t("home.title"));
	const errorNotice = getRequestErrorNotice(localError ?? error, {
		bodyKey: "workspaces.roleAssignmentsErrorBody",
		titleKey: "workspaces.roleAssignmentsErrorTitle",
	});

	const role =
		roleOverride ??
		(assignment?.role as PartnerRole | undefined) ??
		"read_only";

	const save = async (): Promise<void> => {
		if (!assignment || !manageable) return;
		setLocalError(null);
		try {
			await replace(role);
		} catch (requestError) {
			setLocalError(requestError as Error);
			return;
		}
		setSuccessMessage(t("workspaces.roleReplacedSuccess"));
	};

	const confirmRevokeAssignment = async (): Promise<void> => {
		if (!assignment || !manageable) return;
		setLocalError(null);
		try {
			await revoke();
		} catch (requestError) {
			setLocalError(requestError as Error);
			return;
		}
		setConfirmRevoke(false);
		setSuccessMessage(t("workspaces.roleRevokedSuccess"));
	};

	return (
		<>
			<Heading tag="h1">{title}</Heading>
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
			{successMessage ? (
				<Notice
					noticeRole="success"
					noticeTitle={successMessage}
					noticeTitleTag="h2"
				>
					<Text>{successMessage}</Text>
				</Notice>
			) : null}
			{!isLoading && !error && !assignment ? (
				<Notice
					noticeRole="warning"
					noticeTitle={t("workspaces.accessRecordUnavailableTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.accessRecordUnavailableBody")}</Text>
				</Notice>
			) : null}
			{assignment ? (
				<section className="grid gap-200">
					<Heading tag="h2">{t("workspaces.assignmentDetailsTitle")}</Heading>
					<Text>{assignment.userName}</Text>
					<Text>{assignment.userEmail}</Text>
					<Text>
						{`${t("workspaces.assignmentStatusLabel")}: ${t("workspaces.assignmentStatusActive")}`}
					</Text>
					{manageable ? (
						<>
							<Select
								label={t("workspaces.selectRole")}
								name="assignment-role"
								selectId="assignment-role"
								value={role}
								onInput={(event) => {
									setRoleOverride(
										(event.target as HTMLSelectElement).value as PartnerRole
									);
								}}
							>
								{roles.map((candidateRole) => (
									<option key={candidateRole} value={candidateRole}>
										{t(ROLE_LABEL_KEYS[candidateRole] as never)}
									</option>
								))}
							</Select>
							<div className="flex flex-wrap gap-200">
								<Button
									disabled={isReplacing || role === assignment.role}
									type="button"
									onGcdsClick={() => void save()}
								>
									{t("workspaces.saveRoleAction")}
								</Button>
								<Button
									buttonRole="danger"
									disabled={isRevoking}
									type="button"
									onGcdsClick={() => {
										setConfirmRevoke(true);
									}}
								>
									{t("workspaces.revokeRoleAction")}
								</Button>
							</div>
						</>
					) : (
						<Text>{t(ROLE_LABEL_KEYS[assignment.role] as never)}</Text>
					)}
				</section>
			) : null}
			<Link
				params={{ workspaceUuid }}
				to="/workspaces/$workspaceUuid/access/assignments"
			>
				{t("workspaces.backToAssignmentsAction")}
			</Link>
			<ConfirmDialog
				cancelLabel={t("common.cancel")}
				confirmLabel={t("workspaces.revokeRoleAction")}
				isOpen={confirmRevoke}
				isPending={isRevoking}
				title={t("workspaces.revokeRoleConfirmTitle")}
				description={t("workspaces.revokeRoleConfirmBody", {
					name: assignment?.userName ?? "",
				})}
				onConfirm={() => void confirmRevokeAssignment()}
				onClose={() => {
					setConfirmRevoke(false);
				}}
			/>
		</>
	);
};
