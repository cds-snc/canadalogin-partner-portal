import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useDocumentTitle } from "@/common/use-document-title";
import {
	Button,
	ConfirmDialog,
	DataTable,
	Heading,
	Input,
	Notice,
	Select,
	Text,
} from "@/components/ui";
import type { DataTableColumn } from "@/components/ui/DataTable";
import {
	getEffectiveRoleForWorkspace,
	isClAdmin,
	ROLE_LABEL_KEYS,
	type PartnerRole,
} from "@/features/auth/authorization";
import { getRequestErrorNotice } from "@/fetch";
import type {
	RoleAssignmentCandidateRead,
	RoleAssignmentRead,
} from "@/fetch/role-assignments";
import { useSession } from "@/hooks";
import {
	useWorkspaceAccessInvitations,
	type WorkspaceAccessInvitation,
} from "../hooks/use-workspace-access-invitations";
import { useWorkspace } from "../hooks/use-workspace";
import { useWorkspaceRoleAssignments } from "../hooks/use-workspace-role-assignments";

const lowerPartnerRoles: ReadonlyArray<PartnerRole> = [
	"rp_user_edit",
	"read_only",
];
const allPartnerRoles: ReadonlyArray<PartnerRole> = [
	"rp_admin",
	...lowerPartnerRoles,
];
const candidateSearchMinLength = 2;
const candidateSearchMaxLength = 100;
const exactEmailAddressPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

const invitationExpiryFromNow = (days: number): string =>
	new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

type AssignmentRow = RoleAssignmentRead;

type DraftRoleState = {
	roles: Record<string, PartnerRole>;
	sourceWorkspaceUuid: string;
};

type RevokeTargetState = {
	assignment: AssignmentRow;
	sourceWorkspaceUuid: string;
};

type InvitationRevokeTargetState = {
	invitation: WorkspaceAccessInvitation;
	sourceWorkspaceUuid: string;
};

type InvitationReissueTargetState = {
	invitation: WorkspaceAccessInvitation;
	sourceWorkspaceUuid: string;
};

const invitationStatusLabelKeys = {
	accepted: "workspaces.applicationsInvitationStatusAccepted",
	expired: "workspaces.applicationsInvitationStatusExpired",
	pending: "workspaces.applicationsInvitationStatusPending",
	revoked: "workspaces.applicationsInvitationStatusRevoked",
} as const;

export const WorkspaceMembersPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const { currentUser } = useSession();
	const { workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/access",
	});
	const { workspace } = useWorkspace(workspaceUuid);
	useDocumentTitle(
		workspace
			? t("workspaces.accessPageTitle", { name: workspace.name })
			: t("workspaces.navigation.access"),
		t("home.title")
	);
	const {
		assign,
		assignments,
		error,
		isAssigning,
		isLoading,
		isReplacing,
		isRevoking,
		isSearching,
		replace,
		revoke,
		searchCandidates,
	} = useWorkspaceRoleAssignments(workspaceUuid);
	const {
		createInvitation,
		error: invitationsError,
		invitations,
		isCreating: isCreatingInvitation,
		isLoading: isLoadingInvitations,
		isReissuing: isReissuingInvitation,
		isRevoking: isRevokingInvitation,
		refetch: refetchInvitations,
		reissueInvitation,
		revokeInvitation,
	} = useWorkspaceAccessInvitations(workspaceUuid);
	const actorIsClAdmin = isClAdmin(currentUser?.authorizationContext);
	const requiresExactCandidateEmail = !actorIsClAdmin;
	const manageableRoles = actorIsClAdmin ? allPartnerRoles : lowerPartnerRoles;
	const activeRole = getEffectiveRoleForWorkspace(
		currentUser?.authorizationContext,
		workspaceUuid
	);
	const [candidateRole, setCandidateRole] = useState<PartnerRole>("read_only");
	const [draftRoleState, setDraftRoleState] = useState<DraftRoleState>({
		roles: {},
		sourceWorkspaceUuid: workspaceUuid,
	});
	const [hasSearched, setHasSearched] = useState(false);
	const [localError, setLocalError] = useState<Error | null>(null);
	const [revokeErrorMessage, setRevokeErrorMessage] = useState<string | null>(
		null
	);
	const [revokeTarget, setRevokeTarget] = useState<RevokeTargetState | null>(
		null
	);
	const [invitationRevokeTarget, setInvitationRevokeTarget] =
		useState<InvitationRevokeTargetState | null>(null);
	const [invitationRevokeErrorMessage, setInvitationRevokeErrorMessage] =
		useState<string | null>(null);
	const [invitationReissueTarget, setInvitationReissueTarget] =
		useState<InvitationReissueTargetState | null>(null);
	const [invitationReissueErrorMessage, setInvitationReissueErrorMessage] =
		useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchValidationError, setSearchValidationError] = useState<
		string | null
	>(null);
	const [searchResults, setSearchResults] = useState<
		Array<RoleAssignmentCandidateRead>
	>([]);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [invitationEmail, setInvitationEmail] = useState("");
	const [invitationExpiryDays, setInvitationExpiryDays] = useState("7");
	const [invitationRole, setInvitationRole] =
		useState<PartnerRole>("read_only");
	const [createdInvitationUrl, setCreatedInvitationUrl] = useState<
		string | null
	>(null);
	const workspaceRequestVersion = useRef(0);
	const requestWorkspaceUuid = useRef(workspaceUuid);
	const resetWorkspaceUuid = useRef(workspaceUuid);

	useLayoutEffect((): void => {
		requestWorkspaceUuid.current = workspaceUuid;
		workspaceRequestVersion.current += 1;
	}, [workspaceUuid]);
	const draftRoles =
		draftRoleState.sourceWorkspaceUuid === workspaceUuid
			? draftRoleState.roles
			: {};
	const pageError = localError ?? error;
	const errorNotice = getRequestErrorNotice(pageError, {
		bodyKey: "workspaces.roleAssignmentsErrorBody",
		titleKey: "workspaces.roleAssignmentsErrorTitle",
	});
	const invitationErrorNotice = getRequestErrorNotice(invitationsError, {
		bodyKey: "workspaces.accessInvitationsErrorBody",
		titleKey: "workspaces.accessInvitationsErrorTitle",
	});
	const candidateSearchLabel = requiresExactCandidateEmail
		? t("workspaces.searchUserByEmail")
		: t("workspaces.searchUsers");
	const candidateSearchHint = requiresExactCandidateEmail
		? t("workspaces.rpAdminSearchUsersHint")
		: t("workspaces.searchUsersHint");
	const candidateSearchSummary = requiresExactCandidateEmail
		? t("workspaces.rpAdminMembersSearchSummary")
		: t("workspaces.membersSearchSummary");
	const isCandidateQueryValid = (query: string): boolean =>
		query.length >= candidateSearchMinLength &&
		query.length <= candidateSearchMaxLength &&
		(!requiresExactCandidateEmail || exactEmailAddressPattern.test(query));

	useEffect((): void => {
		if (resetWorkspaceUuid.current === workspaceUuid) {
			return;
		}
		resetWorkspaceUuid.current = workspaceUuid;
		const requestVersion = workspaceRequestVersion.current;
		void Promise.resolve().then(() => {
			if (workspaceRequestVersion.current !== requestVersion) {
				return;
			}
			setCandidateRole("read_only");
			setDraftRoleState({ roles: {}, sourceWorkspaceUuid: workspaceUuid });
			setHasSearched(false);
			setLocalError(null);
			setInvitationRevokeErrorMessage(null);
			setInvitationRevokeTarget(null);
			setInvitationReissueErrorMessage(null);
			setInvitationReissueTarget(null);
			setInvitationEmail("");
			setInvitationExpiryDays("7");
			setInvitationRole("read_only");
			setCreatedInvitationUrl(null);
			setRevokeErrorMessage(null);
			setRevokeTarget(null);
			setSearchQuery("");
			setSearchResults([]);
			setSearchValidationError(null);
			setSuccessMessage(null);
		});
	}, [workspaceUuid]);

	const isCurrentWorkspaceRequest = (requestVersion: number): boolean =>
		workspaceRequestVersion.current === requestVersion &&
		requestWorkspaceUuid.current === workspaceUuid;

	const canManageAssignment = (assignment: AssignmentRow): boolean =>
		actorIsClAdmin || assignment.role !== "rp_admin";

	const updateDraftRole = (userUuid: string, role: PartnerRole): void => {
		setDraftRoleState((current) => ({
			roles: {
				...(current.sourceWorkspaceUuid === workspaceUuid ? current.roles : {}),
				[userUuid]: role,
			},
			sourceWorkspaceUuid: workspaceUuid,
		}));
	};

	const columns: Array<DataTableColumn<AssignmentRow>> = [
		{ field: "userName", headerName: t("workspaces.memberName") },
		{ field: "userEmail", headerName: t("workspaces.memberEmail") },
		{
			cellRenderer: (row) =>
				canManageAssignment(row) ? (
					<Select
						name={`assignment-role-${row.userUuid}`}
						selectId={`assignment-role-${row.userUuid}`}
						value={draftRoles[row.userUuid] ?? row.role}
						label={t("workspaces.memberRoleForUser", {
							name: row.userName,
						})}
						onInput={(event): void => {
							updateDraftRole(
								row.userUuid,
								(event.target as HTMLSelectElement).value as PartnerRole
							);
						}}
					>
						{manageableRoles.map((role) => (
							<option key={role} value={role}>
								{t(ROLE_LABEL_KEYS[role] as never)}
							</option>
						))}
					</Select>
				) : (
					<Text>{t(ROLE_LABEL_KEYS[row.role] as never)}</Text>
				),
			field: "role",
			headerName: t("workspaces.memberRole"),
			sortable: false,
		},
	];

	const handleSearch = async (): Promise<void> => {
		const requestVersion = workspaceRequestVersion.current;
		const query = searchQuery.trim();
		setLocalError(null);
		setSuccessMessage(null);
		setHasSearched(true);
		if (!isCandidateQueryValid(query)) {
			setSearchResults([]);
			setSearchValidationError(
				requiresExactCandidateEmail
					? t("workspaces.rpAdminSearchUsersEmailError")
					: t("workspaces.searchUsersLengthError")
			);
			return;
		}
		setSearchValidationError(null);
		try {
			const candidates = await searchCandidates(query);
			if (isCurrentWorkspaceRequest(requestVersion)) {
				setSearchResults(candidates);
			}
		} catch (requestError) {
			if (isCurrentWorkspaceRequest(requestVersion)) {
				setSearchResults([]);
				setLocalError(requestError as Error);
			}
		}
	};

	const handleAssign = async (userUuid: string): Promise<void> => {
		const requestVersion = workspaceRequestVersion.current;
		setLocalError(null);
		try {
			await assign({ role: candidateRole, userUuid });
			if (isCurrentWorkspaceRequest(requestVersion)) {
				setSuccessMessage(t("workspaces.roleAssignedSuccess"));
				setSearchResults((current) =>
					current.filter((candidate) => candidate.uuid !== userUuid)
				);
			}
		} catch (requestError) {
			if (isCurrentWorkspaceRequest(requestVersion)) {
				setLocalError(requestError as Error);
			}
		}
	};

	const handleReplace = async (row: AssignmentRow): Promise<void> => {
		const requestVersion = workspaceRequestVersion.current;
		const role = draftRoles[row.userUuid] ?? (row.role as PartnerRole);
		setLocalError(null);
		try {
			await replace(row.userUuid, role);
			if (isCurrentWorkspaceRequest(requestVersion)) {
				setSuccessMessage(t("workspaces.roleReplacedSuccess"));
			}
		} catch (requestError) {
			if (isCurrentWorkspaceRequest(requestVersion)) {
				setLocalError(requestError as Error);
			}
		}
	};

	const handleRevoke = async (): Promise<void> => {
		if (!revokeTarget || revokeTarget.sourceWorkspaceUuid !== workspaceUuid) {
			return;
		}
		const requestVersion = workspaceRequestVersion.current;
		const targetUserUuid = revokeTarget.assignment.userUuid;
		setLocalError(null);
		setRevokeErrorMessage(null);
		try {
			await revoke(targetUserUuid);
			if (isCurrentWorkspaceRequest(requestVersion)) {
				setSuccessMessage(t("workspaces.roleRevokedSuccess"));
				setRevokeTarget(null);
			}
		} catch {
			if (isCurrentWorkspaceRequest(requestVersion)) {
				setRevokeErrorMessage(t("workspaces.roleMutationError"));
			}
		}
	};

	const handleRevokeInvitation = async (): Promise<void> => {
		if (
			!invitationRevokeTarget ||
			invitationRevokeTarget.sourceWorkspaceUuid !== workspaceUuid
		) {
			return;
		}
		const requestVersion = workspaceRequestVersion.current;
		setInvitationRevokeErrorMessage(null);
		try {
			await revokeInvitation(invitationRevokeTarget.invitation.uuid);
			if (isCurrentWorkspaceRequest(requestVersion)) {
				setInvitationRevokeTarget(null);
				setSuccessMessage(t("workspaces.accessInvitationRevokedSuccess"));
			}
		} catch {
			if (isCurrentWorkspaceRequest(requestVersion)) {
				setInvitationRevokeErrorMessage(
					t("workspaces.accessInvitationRevokeError")
				);
			}
		}
	};

	const handleCreateInvitation = async (): Promise<void> => {
		const requestVersion = workspaceRequestVersion.current;
		setCreatedInvitationUrl(null);
		setLocalError(null);
		try {
			const expiryDays = Number(invitationExpiryDays);
			const invitation = await createInvitation({
				invitedEmail: invitationEmail.trim(),
				inviteExpiresAt: invitationExpiryFromNow(expiryDays),
				role: invitationRole,
			});
			if (isCurrentWorkspaceRequest(requestVersion)) {
				setCreatedInvitationUrl(invitation.acceptanceUrl);
				setInvitationEmail("");
				setSuccessMessage(t("workspaces.accessInvitationCreatedSuccess"));
			}
		} catch (requestError) {
			if (isCurrentWorkspaceRequest(requestVersion)) {
				setLocalError(requestError as Error);
			}
		}
	};

	const handleReissueInvitation = async (): Promise<void> => {
		if (
			!invitationReissueTarget ||
			invitationReissueTarget.sourceWorkspaceUuid !== workspaceUuid
		) {
			return;
		}
		const requestVersion = workspaceRequestVersion.current;
		setCreatedInvitationUrl(null);
		setInvitationReissueErrorMessage(null);
		try {
			const invitation = await reissueInvitation(
				invitationReissueTarget.invitation.uuid,
				{ inviteExpiresAt: invitationExpiryFromNow(7) }
			);
			if (isCurrentWorkspaceRequest(requestVersion)) {
				setCreatedInvitationUrl(invitation.acceptanceUrl);
				setInvitationReissueTarget(null);
				setSuccessMessage(t("workspaces.accessInvitationReissuedSuccess"));
			}
		} catch {
			if (isCurrentWorkspaceRequest(requestVersion)) {
				setInvitationReissueErrorMessage(
					t("workspaces.accessInvitationReissueError")
				);
			}
		}
	};

	return (
		<>
			<Heading tag="h1">
				{workspace
					? t("workspaces.accessPageTitle", { name: workspace.name })
					: t("workspaces.navigation.access")}
			</Heading>
			<Text>{t("workspaces.accessSummary")}</Text>
			<Text>
				{t("authorization.activeWorkspaceNameContext", {
					role: activeRole
						? t(ROLE_LABEL_KEYS[activeRole] as never)
						: t("common.notAvailable"),
					workspaceName:
						workspace?.name.trim() || t("workspaces.workspaceLabel"),
				})}
			</Text>

			{successMessage ? (
				<Notice
					noticeRole="success"
					noticeTitle={successMessage}
					noticeTitleTag="h2"
				>
					<Text>{successMessage}</Text>
				</Notice>
			) : null}
			{isLoading ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("workspaces.membersLoadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.membersLoadingBody")}</Text>
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

			{!error ? (
				<div className="grid gap-300">
					<div className="grid gap-200 rounded-sm border border-solid border-[#d9d9d9] p-300">
						<Heading tag="h2">{candidateSearchLabel}</Heading>
						<Text>{candidateSearchSummary}</Text>
						<Input
							errorMessage={searchValidationError ?? undefined}
							hint={candidateSearchHint}
							inputId="workspace-role-candidate-search"
							label={candidateSearchLabel}
							maxLength={candidateSearchMaxLength}
							minLength={candidateSearchMinLength}
							name="workspace-role-candidate-search"
							type={requiresExactCandidateEmail ? "email" : "search"}
							validateOn="other"
							value={searchQuery}
							onInput={(event): void => {
								const nextQuery = (event.target as HTMLInputElement).value;
								setSearchQuery(nextQuery);
								if (isCandidateQueryValid(nextQuery.trim())) {
									setSearchValidationError(null);
								}
							}}
						/>
						<Select
							label={t("workspaces.selectRole")}
							name="workspace-candidate-role"
							selectId="workspace-candidate-role"
							value={candidateRole}
							onInput={(event): void => {
								setCandidateRole(
									(event.target as HTMLSelectElement).value as PartnerRole
								);
							}}
						>
							{manageableRoles.map((role) => (
								<option key={role} value={role}>
									{t(ROLE_LABEL_KEYS[role] as never)}
								</option>
							))}
						</Select>
						<div>
							<Button
								type="button"
								onGcdsClick={() => {
									void handleSearch();
								}}
							>
								{isSearching ? t("common.searching") : t("common.search")}
							</Button>
						</div>

						{hasSearched ? (
							<div className="grid gap-200">
								<p aria-live="polite" className="sr-only" role="status">
									{t("workspaces.searchResultsStatus", {
										count: searchResults.length,
									})}
								</p>
								<Heading tag="h3">{t("workspaces.searchResults")}</Heading>
								{searchResults.length === 0 ? (
									<Text>
										{requiresExactCandidateEmail
											? t("workspaces.rpAdminNoSearchResults")
											: t("workspaces.noSearchResults")}
									</Text>
								) : (
									searchResults.map((candidate) => (
										<div
											key={candidate.uuid}
											className="flex flex-wrap items-center justify-between gap-200 rounded-sm border border-solid border-[#d9d9d9] p-200"
										>
											<div className="grid gap-100">
												<Text>{candidate.name}</Text>
												<Text>{candidate.email}</Text>
											</div>
											<Button
												disabled={isAssigning}
												type="button"
												onGcdsClick={() => {
													void handleAssign(candidate.uuid);
												}}
											>
												{isAssigning
													? t("workspaces.assigningRoleAction")
													: t("workspaces.assignRoleAction")}{" "}
												<span className="sr-only">{candidate.name}</span>
											</Button>
										</div>
									))
								)}
							</div>
						) : null}
					</div>

					<Heading tag="h2">{t("workspaces.currentAssignments")}</Heading>
					{assignments.length === 0 && !isLoading ? (
						<Notice
							noticeRole="warning"
							noticeTitle={t("workspaces.noAssignmentsTitle")}
							noticeTitleTag="h3"
						>
							<Text>{t("workspaces.noAssignmentsBody")}</Text>
						</Notice>
					) : null}
					{assignments.length > 0 ? (
						<DataTable
							columns={columns}
							itemLabel={t("workspaces.roleAssignmentsItemLabel")}
							pagination={false}
							rows={assignments}
							title={t("workspaces.currentAssignments")}
							action={[
								{
									buttonLabel: t("workspaces.saveRoleAction"),
									buttonRole: "secondary",
									isVisible: (row): boolean =>
										canManageAssignment(row) &&
										(draftRoles[row.userUuid] ?? row.role) !== row.role,
									onAction: (row): void => {
										void handleReplace(row);
									},
									screenReaderLabel: (row): string => row.userName,
								},
								{
									buttonLabel: t("workspaces.revokeRoleAction"),
									buttonRole: "danger",
									isVisible: canManageAssignment,
									onAction: (row): void => {
										setRevokeErrorMessage(null);
										setRevokeTarget({
											assignment: row,
											sourceWorkspaceUuid: workspaceUuid,
										});
									},
									screenReaderLabel: (row): string => row.userName,
								},
							]}
						/>
					) : null}
				</div>
			) : null}

			<section className="grid gap-300">
				<Heading tag="h2">{t("workspaces.accessInvitationsTitle")}</Heading>
				<Text>{t("workspaces.accessInvitationsSummary")}</Text>
				<div className="grid gap-200 rounded-sm border border-solid border-[#d9d9d9] p-300">
					<Heading tag="h3">
						{t("workspaces.accessInvitationCreateTitle")}
					</Heading>
					<Input
						required
						inputId="workspace-invitation-email"
						label={t("workspaces.applicationsInvitationEmailLabel")}
						name="workspace-invitation-email"
						type="email"
						value={invitationEmail}
						onInput={(event): void => {
							setInvitationEmail((event.target as HTMLInputElement).value);
						}}
					/>
					<Select
						label={t("workspaces.selectRole")}
						name="workspace-invitation-role"
						selectId="workspace-invitation-role"
						value={invitationRole}
						onInput={(event): void => {
							setInvitationRole(
								(event.target as HTMLSelectElement).value as PartnerRole
							);
						}}
					>
						{manageableRoles.map((role) => (
							<option key={role} value={role}>
								{t(ROLE_LABEL_KEYS[role] as never)}
							</option>
						))}
					</Select>
					<Select
						label={t("workspaces.accessInvitationExpiryLabel")}
						name="workspace-invitation-expiry"
						selectId="workspace-invitation-expiry"
						value={invitationExpiryDays}
						onInput={(event): void => {
							setInvitationExpiryDays(
								(event.target as HTMLSelectElement).value
							);
						}}
					>
						<option value="7">
							{t("workspaces.accessInvitationExpirySevenDays")}
						</option>
						<option value="14">
							{t("workspaces.accessInvitationExpiryFourteenDays")}
						</option>
						<option value="30">
							{t("workspaces.accessInvitationExpiryThirtyDays")}
						</option>
					</Select>
					<Button
						type="button"
						disabled={
							isCreatingInvitation || invitationEmail.trim().length === 0
						}
						onGcdsClick={() => {
							void handleCreateInvitation();
						}}
					>
						{isCreatingInvitation
							? t("workspaces.accessInvitationCreatingAction")
							: t("workspaces.accessInvitationCreateAction")}
					</Button>
					{createdInvitationUrl ? (
						<Notice
							noticeRole="success"
							noticeTitle={t("workspaces.accessInvitationLinkTitle")}
							noticeTitleTag="h4"
						>
							<Text>{t("workspaces.accessInvitationLinkBody")}</Text>
							<Text>{createdInvitationUrl}</Text>
						</Notice>
					) : null}
				</div>
				{isLoadingInvitations ? (
					<Notice
						noticeRole="info"
						noticeTitle={t("workspaces.accessInvitationsLoadingTitle")}
						noticeTitleTag="h3"
					>
						<Text>{t("workspaces.accessInvitationsLoadingBody")}</Text>
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
						<Button
							type="button"
							onGcdsClick={() => {
								void refetchInvitations();
							}}
						>
							{t("workspaces.accessInvitationsRetryAction")}
						</Button>
					</Notice>
				) : null}
				{!isLoadingInvitations &&
				!invitationErrorNotice &&
				invitations.length === 0 ? (
					<Notice
						noticeRole="info"
						noticeTitle={t("workspaces.accessInvitationsEmptyTitle")}
						noticeTitleTag="h3"
					>
						<Text>{t("workspaces.accessInvitationsEmptyBody")}</Text>
					</Notice>
				) : null}
				{invitations.length > 0 ? (
					<div className="grid gap-200">
						{invitations.map((invitation) => (
							<div
								key={invitation.uuid}
								className="grid gap-100 rounded-sm border border-solid border-[#d9d9d9] p-200"
							>
								<Heading tag="h3">{invitation.invitedEmail}</Heading>
								<Text>
									{`${t("workspaces.applicationsInvitationEmailLabel")}: ${invitation.invitedEmail}`}
								</Text>
								<Text>
									{`${t("workspaces.applicationsInvitationRoleLabel")}: ${String(t(ROLE_LABEL_KEYS[invitation.role] as never))}`}
								</Text>
								<Text>
									{`${t("workspaces.applicationsInvitationStatusLabel")}: ${t(invitationStatusLabelKeys[invitation.status])}`}
								</Text>
								<Text>
									{`${t("workspaces.applicationsInvitationExpiresAtDisplayLabel")}: ${invitation.inviteExpiresAt}`}
								</Text>
								<div className="flex flex-wrap gap-200">
									{invitation.status !== "accepted" ? (
										<Button
											buttonRole="secondary"
											type="button"
											onGcdsClick={() => {
												setInvitationReissueErrorMessage(null);
												setInvitationReissueTarget({
													invitation,
													sourceWorkspaceUuid: workspaceUuid,
												});
											}}
										>
											{t("workspaces.accessInvitationReissueAction")}{" "}
											<span className="sr-only">{invitation.invitedEmail}</span>
										</Button>
									) : null}
									{invitation.status === "pending" ? (
										<Button
											buttonRole="danger"
											type="button"
											onGcdsClick={() => {
												setInvitationRevokeErrorMessage(null);
												setInvitationRevokeTarget({
													invitation,
													sourceWorkspaceUuid: workspaceUuid,
												});
											}}
										>
											{t("workspaces.applicationsInvitationRevokeAction")}{" "}
											<span className="sr-only">{invitation.invitedEmail}</span>
										</Button>
									) : null}
								</div>
							</div>
						))}
					</div>
				) : null}
			</section>

			<ConfirmDialog
				cancelLabel={t("common.cancel")}
				errorMessage={invitationReissueErrorMessage}
				errorTitle={t("workspaces.accessInvitationsErrorTitle")}
				isOpen={invitationReissueTarget !== null}
				isPending={isReissuingInvitation}
				title={t("workspaces.accessInvitationReissueConfirmTitle")}
				confirmLabel={
					isReissuingInvitation
						? t("workspaces.accessInvitationReissuingAction")
						: t("workspaces.accessInvitationReissueAction")
				}
				description={t("workspaces.accessInvitationReissueConfirmBody", {
					email: invitationReissueTarget?.invitation.invitedEmail ?? "",
				})}
				onClose={() => {
					setInvitationReissueErrorMessage(null);
					setInvitationReissueTarget(null);
				}}
				onConfirm={() => {
					void handleReissueInvitation();
				}}
			/>
			<ConfirmDialog
				cancelLabel={t("common.cancel")}
				errorMessage={revokeErrorMessage}
				errorTitle={t("workspaces.roleMutationErrorTitle")}
				isOpen={revokeTarget !== null}
				isPending={isRevoking || isReplacing}
				title={t("workspaces.revokeRoleConfirmTitle")}
				confirmLabel={
					isRevoking
						? t("workspaces.revokingRoleAction")
						: t("workspaces.revokeRoleAction")
				}
				description={t("workspaces.revokeRoleConfirmBody", {
					name: revokeTarget?.assignment.userName ?? "",
				})}
				onClose={() => {
					setRevokeErrorMessage(null);
					setRevokeTarget(null);
				}}
				onConfirm={() => {
					void handleRevoke();
				}}
			/>
			<ConfirmDialog
				cancelLabel={t("common.cancel")}
				errorMessage={invitationRevokeErrorMessage}
				errorTitle={t("workspaces.accessInvitationsErrorTitle")}
				isOpen={invitationRevokeTarget !== null}
				isPending={isRevokingInvitation}
				title={t("workspaces.accessInvitationRevokeConfirmTitle")}
				confirmLabel={
					isRevokingInvitation
						? t("workspaces.applicationsInvitationRevokingAction")
						: t("workspaces.applicationsInvitationRevokeAction")
				}
				description={t("workspaces.accessInvitationRevokeConfirmBody", {
					email: invitationRevokeTarget?.invitation.invitedEmail ?? "",
				})}
				onClose={() => {
					setInvitationRevokeErrorMessage(null);
					setInvitationRevokeTarget(null);
				}}
				onConfirm={() => {
					void handleRevokeInvitation();
				}}
			/>
		</>
	);
};
