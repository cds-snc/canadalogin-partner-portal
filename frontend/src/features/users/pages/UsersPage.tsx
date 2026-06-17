import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { CenteredPageLayout } from "@/components/layout";
import type { DataTableColumn } from "@/components/ui/DataTable";
import {
	Button,
	ConfirmDialog,
	DataTable,
	Heading,
	Input,
	Modal,
	Notice,
	Pagination,
	Select,
	Text,
} from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import {
	useAdminListState,
	useDepartments,
	useRoles,
	useUserDepartment,
	useUserManagement,
	useUserRole,
} from "@/hooks";
import { releaseActiveElementFocus } from "@/lib/release-active-element-focus";
import { useToast } from "@/components/ui/Toast";

type CreateUserFormState = {
	email: string;
	name: string;
};

type EditUserFormState = {
	email: string;
	name: string;
};

const emptyCreateForm: CreateUserFormState = {
	email: "",
	name: "",
};

const emptyEditForm: EditUserFormState = {
	email: "",
	name: "",
};

const departmentPickerItemsPerPage = 200;

type UserTableRow = {
	departmentName: string;
	email: string;
	provider: string;
	uuid: string;
};

export const UsersPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const { success } = useToast();
	const { page, searchDraft, setPage, setSearchDraft } =
		useAdminListState("users");
	const itemsPerPage = 10;
	const {
		createUser,
		deleteUser,
		error,
		isCreating,
		isDeleting,
		isLoading,
		isUpdating,
		response,
		updateUser,
		users,
	} = useUserManagement(page, itemsPerPage);
	const {
		departments,
		error: departmentsError,
		isLoading: isDepartmentsLoading,
	} = useDepartments(1, departmentPickerItemsPerPage);
	const { error: rolesError, isLoading: isRolesLoading, roles } = useRoles();
	const [createForm, setCreateForm] =
		useState<CreateUserFormState>(emptyCreateForm);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [departmentFilter, setDepartmentFilter] = useState("");
	const [editForm, setEditForm] = useState<EditUserFormState>(emptyEditForm);
	const [selectedDepartmentAbbreviation, setSelectedDepartmentAbbreviation] =
		useState<string>("");
	const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
	const [selectedRoleUuid, setSelectedRoleUuid] = useState<string>("");
	const [selectedUserUuid, setSelectedUserUuid] = useState<string | null>(null);
	const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
	const [roleToRemove, setRoleToRemove] = useState<{
		uuid: string;
		name: string;
	} | null>(null);
	const {
		department,
		error: userDepartmentError,
		isLoading: isUserDepartmentLoading,
		isUpdating: isUpdatingDepartment,
		updateUserDepartment,
	} = useUserDepartment(modalMode === "edit" ? selectedUserUuid : null);
	const {
		addRole,
		error: userRoleError,
		isAdding,
		isLoading: isUserRoleLoading,
		isRemoving,
		removeRole,
	} = useUserRole(modalMode === "edit" ? selectedUserUuid : null);
	const selectedUser =
		users.find((user) => user.uuid === selectedUserUuid) ?? null;
	// Resolve department display consistently from the full departments list to avoid showing incorrect fields.
	const currentDepartmentName = ((): string => {
		if (selectedUser) {
			const selectedUserDepartment = selectedUser as {
				departmentAbbreviation?: string | null;
				departmentUuid?: string | null;
			};

			if (selectedUserDepartment.departmentAbbreviation) {
				const foundDepartment = departments.find(
					(entry) =>
						entry.abbreviation === selectedUserDepartment.departmentAbbreviation
				);
				if (foundDepartment) {
					return `${foundDepartment.abbreviation} - ${foundDepartment.name}`;
				}
			}

			if (selectedUserDepartment.departmentUuid) {
				const foundDepartment = departments.find(
					(entry) =>
						String(entry.uuid) === String(selectedUserDepartment.departmentUuid)
				);
				if (foundDepartment) {
					return `${foundDepartment.abbreviation} - ${foundDepartment.name}`;
				}
			}
		}

		if (department?.abbreviation && department.name) {
			return `${department.abbreviation} - ${department.name}`;
		}

		return (
			department?.name ?? department?.abbreviation ?? t("users.noDepartment")
		);
	})();
	const combinedError =
		error ??
		departmentsError ??
		rolesError ??
		userDepartmentError ??
		userRoleError;
	const errorNotice = getRequestErrorNotice(combinedError, {
		bodyKey: "users.errorBody",
		titleKey: "users.errorTitle",
	});
	const isBusy = isLoading || isDepartmentsLoading || isRolesLoading;
	const normalizedDepartmentFilter = departmentFilter.trim().toLowerCase();
	const assignableDepartments = departments.filter(
		(entry) => entry.abbreviation
	);
	const filteredDepartments = assignableDepartments.filter((entry) => {
		if (normalizedDepartmentFilter.length === 0) {
			return true;
		}

		const searchableFields = [
			entry.abbreviation,
			entry.abbreviationFr,
			entry.name,
			entry.nameFr,
		].filter((value): value is string => value !== null);

		return searchableFields.some((value) =>
			value.toLowerCase().includes(normalizedDepartmentFilter)
		);
	});

	// Type for user object as received from API (camelCase)
	type UserApi = {
		email: string;
		name: string;
		uuid: string;
		departmentAbbreviation?: string | null;
		departmentUuid?: string | null;
		roleUuids?: Array<string> | null;
		authProvider?: string | null;
		[key: string]: unknown;
	};

	const userRows: Array<UserTableRow> = users.map((user) => {
		const u = user as unknown as UserApi;
		let departmentName = t("users.noDepartment");
		if (u.departmentAbbreviation) {
			departmentName =
				departments.find(
					(entry) => entry.abbreviation === u.departmentAbbreviation
				)?.name || t("users.noDepartment");
		} else if (u.departmentUuid) {
			departmentName =
				departments.find((entry) => entry.uuid === u.departmentUuid)?.name ||
				t("users.noDepartment");
		}
		const email = String(u.email ?? "");
		const provider = String(u.authProvider ?? t("users.noProvider"));
		const uuid = String(u.uuid ?? "");
		return {
			departmentName,
			email,
			provider,
			uuid,
		};
	});
	const userColumns: Array<DataTableColumn<UserTableRow>> = [
		{ field: "email", headerName: t("users.emailLabel"), pinned: "left" },
		{ field: "departmentName", headerName: t("users.departmentLabel") },
		{ field: "provider", headerName: t("users.providerLabel") },
	];
	const totalPages = response
		? Math.max(
				1,
				Math.ceil(response["total_count"] / response["items_per_page"])
			)
		: 1;

	// Get role UUIDs from selected user
	const selectedUserRoleUuids =
		(selectedUser as unknown as UserApi | null)?.roleUuids ?? [];
	const selectedUserRoles = selectedUserRoleUuids
		.map((roleUuid) => roles.find((role) => role.uuid === roleUuid))
		.filter((role): role is NonNullable<typeof role> => role !== undefined);

	// Get available roles (not already assigned to user)
	const availableRoles = roles.filter(
		(role) => !selectedUserRoleUuids.includes(role.uuid)
	);

	// Avoid direct setState in effect body, use microtask
	useEffect(() => {
		void Promise.resolve().then(() => {
			const sel = selectedUser as unknown as {
				departmentAbbreviation?: string | null;
			} | null;
			setSelectedDepartmentAbbreviation(
				sel ? String(sel.departmentAbbreviation ?? "") : ""
			);
		});
	}, [selectedUser]);

	useEffect(() => {
		void Promise.resolve().then(() => {
			setSelectedRoleUuid("");
		});
	}, [selectedUser]);

	useEffect(() => {
		if (modalMode !== "edit" && !deleteDialogOpen) {
			return;
		}

		if (
			!selectedUserUuid ||
			users.some((user) => user.uuid === selectedUserUuid)
		) {
			return;
		}

		void Promise.resolve().then(() => {
			setDeleteDialogOpen(false);
			setDepartmentFilter("");
			setEditForm(emptyEditForm);
			setModalMode(null);
			setSelectedDepartmentAbbreviation("");
			setSelectedRoleUuid("");
			setSelectedUserUuid(null);
		});
	}, [deleteDialogOpen, modalMode, selectedUserUuid, users]);

	const closeModal = (): void => {
		setModalMode(null);
		setCreateForm(emptyCreateForm);
		setDepartmentFilter("");
		setDeleteDialogOpen(false);
		setEditForm(emptyEditForm);
		setSelectedDepartmentAbbreviation("");
		setSelectedRoleUuid("");
		setSelectedUserUuid(null);
	};

	const openCreateModal = (): void => {
		releaseActiveElementFocus();
		setCreateForm(emptyCreateForm);
		setSelectedUserUuid(null);
		setSelectedDepartmentAbbreviation("");
		setDepartmentFilter("");
		setSelectedRoleUuid("");
		setModalMode("create");
	};

	const openEditModal = (userUuid: string): void => {
		const user = users.find((entry) => entry.uuid === userUuid);

		if (!user) {
			return;
		}

		releaseActiveElementFocus();
		setEditForm({
			email: user.email,
			name: user.name,
		});
		setDepartmentFilter("");
		setSelectedUserUuid(user.uuid);
		setModalMode("edit");
	};

	const handleCreateUser = async (): Promise<void> => {
		await createUser(createForm);
		setPage(1);
		closeModal();
	};

	const handleUpdateUser = async (): Promise<void> => {
		if (!selectedUser) {
			return;
		}

		await updateUser(selectedUser.uuid, editForm);
		setPage(1);
		closeModal();
	};

	const handleDeleteUser = async (): Promise<void> => {
		if (!selectedUser) {
			return;
		}

		await deleteUser(selectedUser.uuid);
		setPage(1);
		closeModal();
	};

	const handleSaveDepartment = async (): Promise<void> => {
		if (!selectedUser) {
			return;
		}

		await updateUserDepartment(selectedUser.uuid, {
			departmentAbbreviation:
				selectedDepartmentAbbreviation.length > 0
					? selectedDepartmentAbbreviation
					: null,
		});
		success(t("users.departmentSavedSuccess"));
		setPage(1);
		closeModal();
	};

	const handleAddRole = async (): Promise<void> => {
		if (!selectedUser || !selectedRoleUuid) {
			return;
		}

		await addRole(selectedUser.uuid, selectedRoleUuid);
		success(t("users.roleAddedSuccess"));
		setSelectedRoleUuid("");
		setPage(1);
		setIsRolesModalOpen(false);
	};

	const handleRemoveRole = async (): Promise<void> => {
		if (!selectedUser || !roleToRemove) {
			return;
		}

		await removeRole(selectedUser.uuid, roleToRemove.uuid);
		success(t("users.roleRemovedSuccess"));
		setPage(1);
		setRoleToRemove(null);
		setIsRolesModalOpen(false);
	};

	const isModalOpen = modalMode !== null;
	const modalTitle =
		modalMode === "create" ? t("users.createTitle") : t("users.editTitle");
	const saveActionLabel =
		modalMode === "create"
			? isCreating
				? t("users.creatingAction")
				: t("users.createAction")
			: isUpdating
				? t("users.savingAction")
				: t("users.saveAction");

	return (
		<CenteredPageLayout className="max-w-5xl">
			<Heading tag="h1">{t("users.title")}</Heading>
			<Text>{t("users.summary")}</Text>

			{isBusy ? (
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

			{!isBusy && !combinedError && users.length === 0 ? (
				<Notice
					noticeRole="warning"
					noticeTitle={t("users.emptyTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("users.emptyBody")}</Text>
				</Notice>
			) : null}

			{users.length > 0 ? (
				<div className="grid gap-300">
					<DataTable
						columns={userColumns}
						exportFileName="users.csv"
						getRowId={(row) => row.uuid}
						itemLabel="users"
						pageNumber={response?.page ?? page}
						pagination={false}
						rows={userRows}
						searchLabel="Search users"
						searchPlaceholder="Filter by name, email, provider, or role"
						searchQuery={searchDraft}
						title={t("users.title")}
						action={[
							{
								buttonId: (row) => `manage-user-${row.uuid}`,
								buttonLabel: t("users.manageAction"),
								screenReaderLabel: (row) => row.email,
								onAction: (row): void => {
									openEditModal(row.uuid);
								},
							},
							{
								buttonId: (row) => `manage-roles-${row.uuid}`,
								buttonLabel: t("users.manageRolesAction"),
								screenReaderLabel: (row) => `Manage roles for ${row.email}`,
								onAction: (row): void => {
									setSelectedUserUuid(row.uuid);
									setIsRolesModalOpen(true);
								},
							},
						]}
						primaryAction={{
							buttonId: "open-create-user-modal",
							buttonLabel: t("users.createAction"),
							onAction: openCreateModal,
						}}
						onSearchChange={setSearchDraft}
					/>
					<Pagination
						currentPage={page}
						label="Users pagination"
						totalPages={totalPages}
						onPageChange={setPage}
					/>
				</div>
			) : null}

			<Modal
				isOpen={isModalOpen}
				size="full-width"
				title={modalTitle}
				footer={
					<>
						<Button
							buttonRole="secondary"
							type="button"
							onGcdsClick={closeModal}
						>
							{t("users.cancelAction")}
						</Button>
						{modalMode === "edit" ? (
							<Button
								buttonRole="danger"
								type="button"
								onGcdsClick={() => {
									releaseActiveElementFocus();
									setDeleteDialogOpen(true);
								}}
							>
								{t("users.deleteAction")}
							</Button>
						) : null}
						<Button
							disabled={modalMode === "create" ? isCreating : isUpdating}
							type="button"
							onGcdsClick={() => {
								if (modalMode === "create") {
									void handleCreateUser();
									return;
								}
								void handleUpdateUser();
							}}
						>
							{saveActionLabel}
						</Button>
					</>
				}
				onClose={closeModal}
			>
				{modalMode === "create" ? (
					<div className="grid gap-200 md:grid-cols-2">
						<Input
							inputId="create-user-name"
							label={t("users.nameLabel")}
							name="name"
							value={createForm.name}
							onInput={(event: React.FormEvent<HTMLInputElement>): void => {
								setCreateForm((current) => ({
									...current,
									name: (event.target as HTMLInputElement).value,
								}));
							}}
						/>
						<Input
							inputId="create-user-email"
							label={t("users.emailLabel")}
							name="email"
							type="email"
							value={createForm.email}
							onInput={(event: React.FormEvent<HTMLInputElement>): void => {
								setCreateForm((current) => ({
									...current,
									email: (event.target as HTMLInputElement).value,
								}));
							}}
						/>
					</div>
				) : (
					<div className="grid gap-300">
						<div className="grid gap-200 md:grid-cols-2">
							<Input
								inputId="edit-user-name"
								label={t("users.nameLabel")}
								name="edit-name"
								value={editForm.name}
								onInput={(event: React.FormEvent<HTMLInputElement>): void => {
									setEditForm((current) => ({
										...current,
										name: (event.target as HTMLInputElement).value,
									}));
								}}
							/>
							<Input
								inputId="edit-user-email"
								label={t("users.emailLabel")}
								name="edit-email"
								type="email"
								value={editForm.email}
								onInput={(event: React.FormEvent<HTMLInputElement>): void => {
									setEditForm((current) => ({
										...current,
										email: (event.target as HTMLInputElement).value,
									}));
								}}
							/>
						</div>
						<div className="grid gap-200">
							<Heading tag="h2">{t("users.manageDepartmentTitle")}</Heading>

							{isUserDepartmentLoading ? (
								<Text>{t("users.loadingDepartmentBody")}</Text>
							) : null}
							<Text>
								{t("users.department", { value: currentDepartmentName })}
							</Text>
							<Input
								inputId="user-department-filter"
								label={t("users.departmentFilterLabel")}
								name="department-filter"
								value={departmentFilter}
								onInput={(event: React.FormEvent<HTMLInputElement>): void => {
									setDepartmentFilter((event.target as HTMLInputElement).value);
								}}
							/>
							<Select
								label={t("users.departmentLabel")}
								name="department"
								selectId="user-department-select"
								value={selectedDepartmentAbbreviation}
								onInput={(event: React.FormEvent<HTMLSelectElement>): void => {
									setSelectedDepartmentAbbreviation(
										(event.target as HTMLSelectElement).value
									);
								}}
							>
								<option value="">{t("users.noDepartment")}</option>
								{filteredDepartments.map((entry) => (
									<option
										key={String(entry.uuid)}
										value={String(entry.abbreviation ?? "")}
									>{`${entry.abbreviation ?? ""} - ${entry.name}`}</option>
								))}
							</Select>
							<Button
								buttonId="save-user-department-action"
								disabled={isUpdatingDepartment || isUserDepartmentLoading}
								type="button"
								onGcdsClick={() => {
									void handleSaveDepartment();
								}}
							>
								{isUpdatingDepartment
									? t("users.savingDepartmentAction")
									: t("users.departmentSaveAction")}
							</Button>
						</div>
					</div>
				)}
			</Modal>

			<ConfirmDialog
				cancelLabel={t("users.cancelAction")}
				isOpen={deleteDialogOpen}
				isPending={isDeleting}
				title={t("users.deleteConfirmTitle")}
				confirmLabel={
					isDeleting
						? t("users.deletingAction")
						: t("users.confirmDeleteAction")
				}
				description={t("users.deleteConfirmBody", {
					email: selectedUser?.email ?? "",
				})}
				onClose={() => {
					setDeleteDialogOpen(false);
				}}
				onConfirm={() => {
					void handleDeleteUser();
				}}
			/>

			{/* Roles Modal */}
			<Modal
				isOpen={isRolesModalOpen}
				size="wide"
				footer={
					<>
						<Button
							buttonRole="secondary"
							type="button"
							onGcdsClick={() => {
								setIsRolesModalOpen(false);
							}}
						>
							{t("users.cancelAction")}
						</Button>
					</>
				}
				title={
					selectedUser
						? t("users.manageRolesTitle", { email: selectedUser.email })
						: t("users.manageRolesAction")
				}
				onClose={() => {
					setIsRolesModalOpen(false);
				}}
			>
				<div className="grid gap-300">
					{isUserRoleLoading ? <Text>{t("users.loadingRoleBody")}</Text> : null}

					{/* Current roles list */}
					<div className="border-b border-[var(--gcds-border-default)] pb-250">
						<Heading marginBottom="150" tag="h3">
							{t("users.currentRoles")}
						</Heading>
						{selectedUserRoles.length > 0 ? (
							<div className="grid gap-150">
								{selectedUserRoles.map((role) => (
									<div
										key={role.uuid}
										className="flex items-center justify-between gap-200 py-100 px-150 bg-[var(--gcds-color-neutral-100)] rounded"
									>
										<Text marginBottom="0" textRole="primary">
											{role.name}
										</Text>
										<Button
											buttonId={`remove-role-${role.uuid}`}
											buttonRole="danger"
											disabled={isRemoving}
											size="small"
											type="button"
											onGcdsClick={() => {
												setRoleToRemove({ uuid: role.uuid, name: role.name });
											}}
										>
											{t("users.removeRole")}
										</Button>
									</div>
								))}
							</div>
						) : (
							<Text marginBottom="0" textRole="secondary">
								{t("users.noRole")}
							</Text>
						)}
					</div>

					{/* Add new role */}
					{availableRoles.length > 0 ? (
						<div>
							<Heading marginBottom="150" tag="h3">
								{t("users.addRole")}
							</Heading>
							<div className="flex items-end gap-150">
								<div className="flex-1">
									<Select
										label={t("users.roleLabel")}
										name="role"
										selectId="user-role-select"
										value={selectedRoleUuid}
										onInput={(
											event: React.FormEvent<HTMLSelectElement>
										): void => {
											setSelectedRoleUuid(
												(event.target as HTMLSelectElement).value
											);
										}}
									>
										<option value="">{t("users.selectRole")}</option>
										{availableRoles.map((entry) => (
											<option
												key={String(entry.uuid)}
												value={String(entry.uuid)}
											>
												{entry.name}
											</option>
										))}
									</Select>
								</div>
								<Button
									buttonId="add-user-role-action"
									disabled={!selectedRoleUuid || isAdding}
									type="button"
									onGcdsClick={() => {
										void handleAddRole();
									}}
								>
									{isAdding
										? t("users.addingRoleAction")
										: t("users.addRoleAction")}
								</Button>
							</div>
						</div>
					) : null}
				</div>
			</Modal>

			{/* Remove Role Confirmation Dialog */}
			<ConfirmDialog
				cancelLabel={t("users.cancelAction")}
				isOpen={roleToRemove !== null}
				isPending={isRemoving}
				title={t("users.removeRoleConfirmTitle")}
				confirmLabel={
					isRemoving ? t("users.removingRoleAction") : t("users.removeRole")
				}
				description={
					roleToRemove
						? t("users.removeRoleConfirmBody", { roleName: roleToRemove.name })
						: ""
				}
				onClose={() => {
					setRoleToRemove(null);
				}}
				onConfirm={() => {
					void handleRemoveRole();
				}}
			/>
		</CenteredPageLayout>
	);
};
