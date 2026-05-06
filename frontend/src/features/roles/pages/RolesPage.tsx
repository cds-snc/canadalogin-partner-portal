import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Breadcrumbs, CenteredPageLayout } from "@/components/layout";
import {
	Button,
	ConfirmDialog,
	DataTable,
	Heading,
	Input,
	Modal,
	Notice,
	Pagination,
	Text,
} from "@/components/ui";
import type { DataTableColumn } from "@/components/ui/DataTable";
import { getRequestErrorNotice } from "@/fetch";
import { useAdminListState, useRoleManagement } from "@/hooks";
import { releaseActiveElementFocus } from "@/lib/release-active-element-focus";

type RoleFormState = {
	description: string;
	name: string;
};

const emptyRoleForm: RoleFormState = {
	description: "",
	name: "",
};

type RoleTableRow = {
	description: string;
	name: string;
	uuid: string;
};

export const RolesPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const { page, searchDraft, setPage, setSearchDraft } =
		useAdminListState("roles");
	const itemsPerPage = 10;
	const {
		createRole,
		deleteRole,
		error,
		isCreating,
		isDeleting,
		isLoading,
		isUpdating,
		response,
		roles,
		updateRole,
	} = useRoleManagement(page, itemsPerPage);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [form, setForm] = useState<RoleFormState>(emptyRoleForm);
	const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
	const [selectedRoleUuid, setSelectedRoleUuid] = useState<string | null>(null);
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "roles.errorBody",
		titleKey: "roles.errorTitle",
	});

	const selectedRole =
		roles.find((role) => role.uuid === selectedRoleUuid) ?? null;
	const roleRows: Array<RoleTableRow> = roles.map((role) => ({
		description: role.description ?? t("roles.noDescription"),
		name: role.name,
		uuid: role.uuid,
	}));
	const roleColumns: Array<DataTableColumn<RoleTableRow>> = [
		{ field: "name", headerName: t("roles.nameLabel"), pinned: "left" },
		{ field: "description", headerName: t("roles.descriptionLabel") },
	];
	const totalPages = response
		? Math.max(1, Math.ceil(response.total_count / response.items_per_page))
		: 1;

	useEffect(() => {
		if (modalMode !== "edit" && !deleteDialogOpen) {
			return;
		}

		if (
			!selectedRoleUuid ||
			roles.some((role) => role.uuid === selectedRoleUuid)
		) {
			return;
		}

		void Promise.resolve().then(() => {
			setSelectedRoleUuid(null);
			setDeleteDialogOpen(false);
			setModalMode(null);
			setForm(emptyRoleForm);
		});
	}, [deleteDialogOpen, modalMode, roles, selectedRoleUuid]);

	const closeModal = (): void => {
		setModalMode(null);
		setForm(emptyRoleForm);
	};

	const openCreateModal = (): void => {
		releaseActiveElementFocus();
		setSelectedRoleUuid(null);
		setForm(emptyRoleForm);
		setModalMode("create");
	};

	const openEditModal = (roleUuid: string): void => {
		const role = roles.find((item) => item.uuid === roleUuid);

		if (!role) {
			return;
		}

		releaseActiveElementFocus();
		setSelectedRoleUuid(role.uuid);
		setForm({
			description: role.description ?? "",
			name: role.name,
		});
		setModalMode("edit");
	};

	const handleCreateRole = async (): Promise<void> => {
		await createRole(form);
		setPage(1);
		closeModal();
	};

	const handleUpdateRole = async (): Promise<void> => {
		if (!selectedRole) {
			return;
		}

		await updateRole(selectedRole.uuid, form);
		setPage(1);
		closeModal();
	};

	const handleDeleteRole = async (): Promise<void> => {
		if (!selectedRole) {
			return;
		}

		await deleteRole(selectedRole.uuid);
		setPage(1);
		setDeleteDialogOpen(false);
		setSelectedRoleUuid(null);
		closeModal();
	};

	const isModalOpen = modalMode !== null;
	const isSubmitting = modalMode === "create" ? isCreating : isUpdating;

	return (
		<CenteredPageLayout className="max-w-5xl">
			<Breadcrumbs
				items={[
					{ href: "/", label: t("nav.home") },
					{ href: "/roles", label: t("roles.title") },
				]}
			/>
			<Heading tag="h1">{t("roles.title")}</Heading>
			<Text>{t("roles.summary")}</Text>

			{isLoading ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("roles.loadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("roles.loadingBody")}</Text>
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

			{!isLoading && !error && roles.length === 0 ? (
				<Notice
					noticeRole="warning"
					noticeTitle={t("roles.emptyTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("roles.emptyBody")}</Text>
				</Notice>
			) : null}

			{roles.length > 0 ? (
				<div className="grid gap-300">
					<DataTable
						columns={roleColumns}
						exportFileName="roles.csv"
						getRowId={(row) => row.uuid}
						itemLabel="roles"
						pageNumber={response?.page ?? page}
						pagination={false}
						rows={roleRows}
						searchLabel="Search roles"
						searchPlaceholder="Filter by role name or description"
						searchQuery={searchDraft}
						title={t("roles.title")}
						action={{
							buttonId: (row) => `manage-role-${row.uuid}`,
							buttonLabel: t("roles.manageAction"),
							onAction: (row) => {
								openEditModal(row.uuid);
							},
							screenReaderLabel: (row) => row.name,
						}}
						primaryAction={{
							buttonId: "open-create-role-modal",
							buttonLabel: t("roles.createAction"),
							onAction: openCreateModal,
						}}
						onSearchChange={setSearchDraft}
					/>
					<Pagination
						currentPage={page}
						label="Roles pagination"
						totalPages={totalPages}
						onPageChange={setPage}
					/>
				</div>
			) : null}

			<Modal
				isOpen={isModalOpen}
				footer={
					<>
						<Button
							buttonRole="secondary"
							type="button"
							onGcdsClick={closeModal}
						>
							{t("roles.cancelAction")}
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
								{t("roles.deleteAction")}
							</Button>
						) : null}
						<Button
							disabled={isSubmitting}
							type="button"
							onGcdsClick={() => {
								if (modalMode === "create") {
									void handleCreateRole();
									return;
								}

								void handleUpdateRole();
							}}
						>
							{modalMode === "create"
								? isCreating
									? t("roles.creatingAction")
									: t("roles.createAction")
								: isUpdating
									? t("roles.savingAction")
									: t("roles.saveAction")}
						</Button>
					</>
				}
				title={
					modalMode === "create" ? t("roles.createTitle") : t("roles.editTitle")
				}
				onClose={closeModal}
			>
				<Input
					label={t("roles.nameLabel")}
					name={modalMode === "create" ? "role-name" : "edit-role-name"}
					value={form.name}
					inputId={
						modalMode === "create" ? "create-role-name" : "edit-role-name"
					}
					onInput={(event: React.FormEvent<HTMLInputElement>): void => {
						setForm((current) => ({
							...current,
							name: (event.target as HTMLInputElement).value,
						}));
					}}
				/>
				<Input
					label={t("roles.descriptionLabel")}
					value={form.description}
					inputId={
						modalMode === "create"
							? "create-role-description"
							: "edit-role-description"
					}
					name={
						modalMode === "create"
							? "role-description"
							: "edit-role-description"
					}
					onInput={(event: React.FormEvent<HTMLInputElement>): void => {
						setForm((current) => ({
							...current,
							description: (event.target as HTMLInputElement).value,
						}));
					}}
				/>
			</Modal>

			<ConfirmDialog
				cancelLabel={t("roles.cancelAction")}
				isOpen={deleteDialogOpen}
				isPending={isDeleting}
				title={t("roles.deleteConfirmTitle")}
				confirmLabel={
					isDeleting
						? t("roles.deletingAction")
						: t("roles.confirmDeleteAction")
				}
				description={t("roles.deleteConfirmBody", {
					name: selectedRole?.name ?? "",
				})}
				onClose={() => {
					setDeleteDialogOpen(false);
				}}
				onConfirm={() => {
					void handleDeleteRole();
				}}
			/>
		</CenteredPageLayout>
	);
};
