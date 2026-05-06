import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import type { FunctionComponent } from "@/common/types";
import { getRequestErrorMessage } from "@/fetch";
import {
	Button,
	ConfirmDialog,
	DataTable,
	Input,
	Modal,
	Text,
} from "@/components/ui";
import type { DataTableColumn } from "@/components/ui/DataTable";
import { useToast } from "@/components/ui/Toast";
import {
	addWorkspaceMember,
	getWorkspaceMembers,
	removeWorkspaceMember,
	searchUsers,
	type UserRead,
	type WorkspaceMemberRead,
} from "@/fetch/workspaces";

type ManageMembersModalProps = {
	isOpen: boolean;
	onClose: () => void;
	workspaceUuid: string;
};

type MemberRow = {
	uuid: string;
	userUuid?: string;
	userEmail?: string;
	userName?: string;
	role: string;
};

export const ManageMembersModal = (
	props: ManageMembersModalProps
): FunctionComponent => {
	const { workspaceUuid, isOpen, onClose } = props;
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const toast = useToast();

	const [searchQuery, setSearchQuery] = useState("");
	const [isSearching, setIsSearching] = useState(false);
	const [searchResults, setSearchResults] = useState<Array<UserRead>>([]);
	const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
	const [userPendingRemove, setUserPendingRemove] =
		useState<WorkspaceMemberRead | null>(null);

	const {
		data: members,
		isLoading: membersLoading,
		refetch: refetchMembers,
	} = useQuery<Array<WorkspaceMemberRead>>({
		queryKey: ["workspace-members", workspaceUuid],
		queryFn: () => getWorkspaceMembers(workspaceUuid),
		enabled: isOpen && !!workspaceUuid,
	});

	const memberRows: Array<MemberRow> = (members ?? []).map((member) => ({
		uuid: String(member.uuid),
		userUuid: member.userUuid ?? undefined,
		userEmail: member.userEmail,
		userName: member.userName ?? undefined,
		role: member.role,
	}));

	const memberColumns: Array<DataTableColumn<MemberRow>> = [
		{
			field: "userEmail",
			headerName: t("workspaces.memberEmail"),
			pinned: "left",
		},
		{ field: "role", headerName: t("workspaces.memberRole") },
	];

	const handleSearch = async (): Promise<void> => {
		if (!searchQuery.trim()) return;

		setIsSearching(true);
		try {
			const results = await searchUsers(searchQuery.trim(), workspaceUuid);
			setSearchResults(results);
		} catch (error) {
			console.error(error);
			toast.error(getRequestErrorMessage(error, t("errors.unknown")));
		} finally {
			setIsSearching(false);
		}
	};

	const handleAddMember = async (
		userUuid: string,
		role: string = "workspace_member"
	): Promise<void> => {
		try {
			await addWorkspaceMember(workspaceUuid, {
				userUuid: userUuid,
				role,
			});
			toast.success(t("workspaces.memberAddedSuccess"));
			setSearchQuery("");
			setSearchResults([]);
			void refetchMembers();
		} catch (error) {
			console.error(error);
			toast.error(getRequestErrorMessage(error, t("errors.unknown")));
		}
	};

	const handleRemoveMember = async (userUuid: string): Promise<void> => {
		try {
			await removeWorkspaceMember(workspaceUuid, userUuid);
			toast.success(t("workspaces.memberRemovedSuccess"));
			void refetchMembers();
		} catch (error) {
			console.error(error);
			toast.error(getRequestErrorMessage(error, t("errors.unknown")));
		}
	};

	const handleRemoveAction = (row: MemberRow): void => {
		setUserPendingRemove({
			...(row as unknown as WorkspaceMemberRead),
			userEmail: row.userEmail,
			userName: row.userName,
			userUuid: row.userUuid,
		} as WorkspaceMemberRead);
		setConfirmRemoveOpen(true);
	};

	const handleSearchKeyDown = (
		event: React.KeyboardEvent<HTMLInputElement>
	): void => {
		if (event.key === "Enter") {
			void handleSearch();
		}
	};

	const handleSearchInput = (
		event: React.FormEvent<HTMLInputElement>
	): void => {
		setSearchQuery(event.currentTarget.value);
	};

	return (
		<Modal
			isOpen={isOpen}
			size="wide"
			title={t("workspaces.manageMembers")}
			onClose={onClose}
		>
			<div className="flex flex-col gap-6">
				<div className="flex items-end gap-4">
					<div className="flex-1">
						<Input
							inputId="user-search"
							label={t("workspaces.searchUsers")}
							name="user-search"
							value={searchQuery}
							onInput={handleSearchInput}
							onKeyDown={handleSearchKeyDown}
						/>
					</div>
					<div className="w-40">
						<Button
							disabled={isSearching || !searchQuery.trim()}
							type="button"
							onGcdsClick={() => {
								void handleSearch();
							}}
						>
							{isSearching ? t("common.searching") : t("common.search")}
						</Button>
					</div>
				</div>

				{searchResults.length > 0 ? (
					<div className="rounded border p-4">
						<Text marginBottom="200">{t("workspaces.searchResults")}</Text>
						<div className="flex flex-col gap-2">
							{searchResults.map((user) => {
								const isAlreadyMember =
									members?.some((member) => member.userUuid === user.uuid) ??
									false;

								return (
									<div
										key={user.uuid}
										className="flex items-center justify-between rounded bg-gray-50 p-2"
									>
										<div>
											<Text>{user.name}</Text>
											<Text size="small" textRole="secondary">
												{user.email}
											</Text>
										</div>
										<div className="flex items-center gap-2">
											<select
												aria-label={t("workspaces.selectRole")}
												className="gov-select"
												defaultValue="workspace_member"
											>
												<option value="workspace_member">
													{t("workspaces.roleMember")}
												</option>
												<option value="workspace_admin">
													{t("workspaces.roleAdmin")}
												</option>
											</select>
											<Button
												buttonRole="secondary"
												disabled={isAlreadyMember}
												type="button"
												onGcdsClick={(event: Event) => {
													const parent =
														(event.currentTarget as HTMLElement | null)
															?.parentElement ?? null;
													let role = "workspace_member";
													if (parent) {
														const select =
															parent.querySelector<HTMLSelectElement>("select");
														if (select) role = select.value;
													}
													void handleAddMember(user.uuid, role);
												}}
											>
												{isAlreadyMember
													? t("workspaces.alreadyMember")
													: t("common.add")}
											</Button>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				) : null}

				<div>
					<Text marginBottom="200">{t("workspaces.currentMembers")}</Text>
					{membersLoading ? (
						<Text>{t("workspaces.loadingMembers")}</Text>
					) : members && members.length > 0 ? null : (
						<Text>{t("workspaces.noMembers")}</Text>
					)}

					{memberRows.length > 0 ? (
						<DataTable<MemberRow>
							columns={memberColumns}
							getRowId={(row) => row.uuid}
							itemLabel="members"
							pagination={false}
							rows={memberRows}
							title={t("workspaces.currentMembers")}
							action={[
								{
									buttonId: (row) => `remove-member-${row.uuid}`,
									buttonLabel: t("common.remove"),
									onAction: (row): void => {
										handleRemoveAction(row as unknown as MemberRow);
									},
									screenReaderLabel: (row) =>
										String(row.userEmail ?? row.userName ?? row.uuid),
									variant: "button",
								},
							]}
						/>
					) : null}
				</div>

				<ConfirmDialog
					cancelLabel={t("common.cancel")}
					confirmLabel={t("common.remove")}
					isOpen={confirmRemoveOpen}
					title={t("workspaces.removeMemberConfirmTitle")}
					description={t("workspaces.removeMemberConfirmBody", {
						name: userPendingRemove?.userName ?? "",
					})}
					onClose={() => {
						setConfirmRemoveOpen(false);
						setUserPendingRemove(null);
					}}
					onConfirm={() => {
						if (userPendingRemove) {
							const targetUserUuid =
								userPendingRemove.userUuid ?? userPendingRemove.uuid;
							void handleRemoveMember(targetUserUuid);
						}
						setConfirmRemoveOpen(false);
						setUserPendingRemove(null);
					}}
				/>

				<div className="flex justify-end">
					<Button buttonRole="secondary" type="button" onGcdsClick={onClose}>
						{t("common.close")}
					</Button>
				</div>
			</div>
		</Modal>
	);
};
