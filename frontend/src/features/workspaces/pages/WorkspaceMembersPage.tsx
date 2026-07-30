import { useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
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
import { getRequestErrorNotice } from "@/fetch";
import type { UserRead } from "@/fetch/workspaces";
import { useWorkspace } from "../hooks/use-workspace";
import { useWorkspaceMembers } from "../hooks/use-workspace-members";

const WORKSPACE_ADMIN_ROLE = "workspace_admin";
const WORKSPACE_MEMBER_ROLE = "workspace_member";

type MemberRow = {
	role: string;
	userEmail: string;
	userName: string;
	userUuid: string;
	uuid: string;
};

type DraftRoleState = {
	roles: Record<string, string>;
	sourceWorkspaceUuid: string;
};

export const WorkspaceMembersPage = (): FunctionComponent => {
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const { workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/members",
	});
	const { workspace } = useWorkspace(workspaceUuid);
	const {
		addMember,
		error,
		isAdding,
		isLoading,
		isRemoving,
		isSearching,
		isUpdatingRole,
		members,
		removeMember,
		searchCandidates,
		updateMemberRole,
	} = useWorkspaceMembers(workspaceUuid);
	const [candidateRole, setCandidateRole] = useState(WORKSPACE_MEMBER_ROLE);
	const [draftRoleState, setDraftRoleState] = useState<DraftRoleState>({
		roles: {},
		sourceWorkspaceUuid: workspaceUuid,
	});
	const [hasSearched, setHasSearched] = useState(false);
	const [localError, setLocalError] = useState<Error | null>(null);
	const [removeTarget, setRemoveTarget] = useState<MemberRow | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<Array<UserRead>>([]);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const draftRoles: Record<string, string> =
		draftRoleState.sourceWorkspaceUuid === workspaceUuid
			? draftRoleState.roles
			: {};

	const pageError = localError ?? error;
	const errorNotice = getRequestErrorNotice(pageError, {
		bodyKey: "workspaces.errorBody",
		titleKey: "workspaces.errorTitle",
	});

	const memberRows: Array<MemberRow> = members.map((member) => ({
		role: member.role,
		userEmail: member.userEmail ?? t("common.notAvailable"),
		userName: member.userName ?? t("common.notAvailable"),
		userUuid: member.userUuid ?? "",
		uuid: member.uuid,
	}));

	const updateDraftRole = (userUuid: string, role: string): void => {
		setDraftRoleState((currentDraftState) => ({
			roles: {
				...(currentDraftState.sourceWorkspaceUuid === workspaceUuid
					? currentDraftState.roles
					: {}),
				[userUuid]: role,
			},
			sourceWorkspaceUuid: workspaceUuid,
		}));
	};

	const memberColumns: Array<DataTableColumn<MemberRow>> = [
		{ field: "userName", headerName: t("workspaces.memberName") },
		{ field: "userEmail", headerName: t("workspaces.memberEmail") },
		{
			cellRenderer: (row) => (
				<Select
					label={t("workspaces.memberRole")}
					name={`member-role-${row.userUuid}`}
					selectId={`member-role-${row.userUuid}`}
					value={draftRoles[row.userUuid] ?? row.role}
					onInput={(event): void => {
						updateDraftRole(
							row.userUuid,
							(event.target as HTMLSelectElement).value
						);
					}}
				>
					<option value={WORKSPACE_MEMBER_ROLE}>
						{t("workspaces.roleMember")}
					</option>
					<option value={WORKSPACE_ADMIN_ROLE}>
						{t("workspaces.roleAdmin")}
					</option>
				</Select>
			),
			field: "role",
			headerName: t("workspaces.memberRole"),
			sortable: false,
		},
	];

	const handleSearch = async (): Promise<void> => {
		const query = searchQuery.trim();
		setLocalError(null);
		setSuccessMessage(null);
		setHasSearched(true);

		if (query.length === 0) {
			setSearchResults([]);
			return;
		}

		try {
			const results = await searchCandidates(query);
			setSearchResults(results);
		} catch (requestError) {
			setSearchResults([]);
			setLocalError(requestError as Error);
		}
	};

	const handleAddMember = async (userUuid: string): Promise<void> => {
		setLocalError(null);
		try {
			await addMember({ role: candidateRole, userUuid });
			setSuccessMessage(t("workspaces.memberAddedSuccess"));
			setSearchResults((currentResults) =>
				currentResults.filter((user) => user.uuid !== userUuid)
			);
		} catch (requestError) {
			setLocalError(requestError as Error);
		}
	};

	const handleUpdateRole = async (row: MemberRow): Promise<void> => {
		const nextRole = draftRoles[row.userUuid] ?? row.role;
		setLocalError(null);
		try {
			await updateMemberRole(row.userUuid, { role: nextRole });
			setSuccessMessage(t("workspaces.memberUpdatedSuccess"));
		} catch (requestError) {
			setLocalError(requestError as Error);
		}
	};

	const handleRemoveMember = async (): Promise<void> => {
		if (!removeTarget) {
			return;
		}

		setLocalError(null);
		try {
			await removeMember(removeTarget.userUuid);
			setSuccessMessage(t("workspaces.memberRemovedSuccess"));
			setRemoveTarget(null);
		} catch (requestError) {
			setLocalError(requestError as Error);
		}
	};

	return (
		<>
			<Heading tag="h1">
				{workspace
					? t("workspaces.membersPageTitle", { name: workspace.name })
					: t("workspaces.manageMembers")}
			</Heading>
			<Text>{t("workspaces.membersSummary")}</Text>

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
					noticeTitle={t(errorNotice.titleKey)}
					noticeTitleTag="h2"
				>
					<Text>{errorNotice.bodyText ?? t(errorNotice.bodyKey)}</Text>
				</Notice>
			) : null}

			{!error ? (
				<div className="grid gap-300">
					<div className="grid gap-200 rounded-sm border border-solid border-[#d9d9d9] p-300">
						<Heading tag="h2">{t("workspaces.searchUsers")}</Heading>
						<Text>{t("workspaces.membersSearchSummary")}</Text>
						<Input
							inputId="workspace-member-search"
							label={t("workspaces.searchUsers")}
							name="workspace-member-search"
							type="search"
							value={searchQuery}
							onInput={(event): void => {
								setSearchQuery((event.target as HTMLInputElement).value);
							}}
						/>
						<Select
							label={t("workspaces.selectRole")}
							name="workspace-member-role"
							selectId="workspace-member-role"
							value={candidateRole}
							onInput={(event): void => {
								setCandidateRole((event.target as HTMLSelectElement).value);
							}}
						>
							<option value={WORKSPACE_MEMBER_ROLE}>
								{t("workspaces.roleMember")}
							</option>
							<option value={WORKSPACE_ADMIN_ROLE}>
								{t("workspaces.roleAdmin")}
							</option>
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
								<Heading tag="h3">{t("workspaces.searchResults")}</Heading>
								{searchResults.length === 0 ? (
									<Text>{t("workspaces.noSearchResults")}</Text>
								) : (
									searchResults.map((user) => (
										<div
											key={user.uuid}
											className="flex flex-wrap items-center justify-between gap-200 rounded-sm border border-solid border-[#d9d9d9] p-200"
										>
											<div className="grid gap-100">
												<Text>{user.name}</Text>
												<Text>{user.email}</Text>
											</div>
											<Button
												type="button"
												onGcdsClick={() => {
													void handleAddMember(user.uuid);
												}}
											>
												{isAdding ? t("workspaces.addingMemberAction") : t("workspaces.addMemberAction")}
											</Button>
										</div>
									))
								)}
							</div>
						) : null}
					</div>

					<Heading tag="h2">{t("workspaces.currentMembers")}</Heading>
					{members.length === 0 && !isLoading ? (
						<Notice
							noticeRole="warning"
							noticeTitle={t("workspaces.noMembersTitle")}
							noticeTitleTag="h3"
						>
							<Text>{t("workspaces.noMembersBody")}</Text>
						</Notice>
					) : null}
					{members.length > 0 ? (
						<DataTable
							columns={memberColumns}
							getRowId={(row): string => row.uuid}
							itemLabel="workspace members"
							pagination={false}
							rows={memberRows}
							title={t("workspaces.currentMembers")}
							action={[
								{
									buttonLabel: t("workspaces.saveRoleAction"),
									buttonRole: "secondary",
									isVisible: (row): boolean =>
										(draftRoles[row.userUuid] ?? row.role) !== row.role,
									onAction: (row): void => {
										void handleUpdateRole(row);
									},
									screenReaderLabel: (row): string => row.userName,
								},
								{
									buttonLabel: t("workspaces.removeMemberAction"),
									buttonRole: "danger",
									onAction: (row): void => {
										setRemoveTarget(row);
									},
									screenReaderLabel: (row): string => row.userName,
								},
							]}
						/>
					) : null}
				</div>
			) : null}

			<ConfirmDialog
				cancelLabel={t("workspaces.cancelAction")}
				isOpen={removeTarget !== null}
				isPending={isRemoving || isUpdatingRole}
				title={t("workspaces.removeMemberConfirmTitle")}
				confirmLabel={
					isRemoving
						? t("workspaces.removingMemberAction")
						: t("workspaces.removeMemberAction")
				}
				description={t("workspaces.removeMemberConfirmBody", {
					name: removeTarget?.userName ?? "",
				})}
				onClose={() => {
					setRemoveTarget(null);
				}}
				onConfirm={() => {
					void handleRemoveMember();
				}}
			/>
		</>
	);
};