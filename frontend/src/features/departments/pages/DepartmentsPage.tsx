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
import type { DepartmentCreate, DepartmentRead } from "@/fetch/departments";
import { useAdminListState, useDepartmentManagement } from "@/hooks";
import { releaseActiveElementFocus } from "@/lib/release-active-element-focus";

type DepartmentFormState = {
	abbreviation: string;
	abbreviationFr: string;
	gcOrgId: string;
	leadDepartmentName: string;
	leadDepartmentNameFr: string;
	name: string;
	nameFr: string;
};

const createEmptyDepartmentForm = (): DepartmentFormState => ({
	abbreviation: "",
	abbreviationFr: "",
	gcOrgId: "",
	leadDepartmentName: "",
	leadDepartmentNameFr: "",
	name: "",
	nameFr: "",
});

const toOptionalString = (value: string): string | null => {
	const normalizedValue = value.trim();

	return normalizedValue.length > 0 ? normalizedValue : null;
};

const toOptionalInteger = (value: string): number | null => {
	const normalizedValue = value.trim();

	if (normalizedValue.length === 0) {
		return null;
	}

	const parsedValue = Number.parseInt(normalizedValue, 10);

	return Number.isNaN(parsedValue) ? null : parsedValue;
};

const toDepartmentFormState = (
	department: DepartmentRead
): DepartmentFormState => ({
	abbreviation: department.abbreviation ?? "",
	abbreviationFr: department.abbreviationFr ?? "",
	gcOrgId: department.gcOrgId === null ? "" : String(department.gcOrgId),
	leadDepartmentName: department.leadDepartmentName ?? "",
	leadDepartmentNameFr: department.leadDepartmentNameFr ?? "",
	name: department.name,
	nameFr: department.nameFr ?? "",
});

// Read form event values inline via strongly-typed event.target in handlers.
const toDepartmentPayload = (form: DepartmentFormState): DepartmentCreate => ({
	abbreviation: toOptionalString(form.abbreviation),
	abbreviationFr: toOptionalString(form.abbreviationFr),
	gcOrgId: toOptionalInteger(form.gcOrgId),
	leadDepartmentName: toOptionalString(form.leadDepartmentName),
	leadDepartmentNameFr: toOptionalString(form.leadDepartmentNameFr),
	name: form.name.trim(),
	nameFr: toOptionalString(form.nameFr),
});

type DepartmentTableRow = {
	abbreviation: string;
	createdAt: string;
	name: string;
	uuid: string;
};

export const DepartmentsPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const { page, searchDraft, setPage, setSearchDraft } =
		useAdminListState("departments");
	const itemsPerPage = 10;
	const {
		createDepartment,
		deleteDepartment,
		departments,
		error,
		isCreating,
		isDeleting,
		isLoading,
		isUpdating,
		response,
		updateDepartment,
	} = useDepartmentManagement(page, itemsPerPage);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [form, setForm] = useState<DepartmentFormState>(
		createEmptyDepartmentForm
	);
	const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
	const [selectedDepartmentUuid, setSelectedDepartmentUuid] = useState<
		string | null
	>(null);
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "departments.errorBody",
		titleKey: "departments.errorTitle",
	});

	const selectedDepartment =
		departments.find(
			(department) => department.uuid === selectedDepartmentUuid
		) ?? null;
	const departmentRows: Array<DepartmentTableRow> = departments.map(
		(department) => ({
			abbreviation: department.abbreviation ?? "",
			createdAt: department.createdAt,
			name: department.name,
			uuid: department.uuid,
		})
	);
	const departmentColumns: Array<DataTableColumn<DepartmentTableRow>> = [
		{
			field: "abbreviation",
			headerName: t("departments.abbreviationLabel"),
			pinned: "left",
		},
		{ field: "name", headerName: t("departments.nameLabel") },
	];
	const totalPages = response
		? Math.max(
				1,
				Math.ceil(response["total_count"] / response["items_per_page"])
			)
		: 1;

	useEffect(() => {
		if (modalMode !== "edit" && !deleteDialogOpen) {
			return;
		}

		if (
			!selectedDepartmentUuid ||
			departments.some(
				(department) => department.uuid === selectedDepartmentUuid
			)
		) {
			return;
		}

		void Promise.resolve().then(() => {
			setSelectedDepartmentUuid(null);
			setDeleteDialogOpen(false);
			setModalMode(null);
			setForm(createEmptyDepartmentForm());
		});
	}, [deleteDialogOpen, departments, modalMode, selectedDepartmentUuid]);

	const closeModal = (): void => {
		setModalMode(null);
		setForm(createEmptyDepartmentForm());
	};

	const openCreateModal = (): void => {
		releaseActiveElementFocus();
		setSelectedDepartmentUuid(null);
		setForm(createEmptyDepartmentForm());
		setModalMode("create");
	};

	const openEditModal = (departmentUuid: string): void => {
		const department = departments.find((item) => item.uuid === departmentUuid);

		if (!department) {
			return;
		}

		releaseActiveElementFocus();
		setSelectedDepartmentUuid(department.uuid);
		setForm(toDepartmentFormState(department));
		setModalMode("edit");
	};

	const handleCreateDepartment = async (): Promise<void> => {
		await createDepartment(toDepartmentPayload(form));
		setPage(1);
		closeModal();
	};

	const handleUpdateDepartment = async (): Promise<void> => {
		if (!selectedDepartment) {
			return;
		}

		await updateDepartment(selectedDepartment.uuid, toDepartmentPayload(form));
		setPage(1);
		closeModal();
	};

	const updateFormField = (
		field: keyof DepartmentFormState,
		value: string
	): void => {
		setForm((currentForm) => ({ ...currentForm, [field]: value }));
	};

	const handleDeleteDepartment = async (): Promise<void> => {
		if (!selectedDepartment) {
			return;
		}

		await deleteDepartment(selectedDepartment.uuid);
		setPage(1);
		setDeleteDialogOpen(false);
		setSelectedDepartmentUuid(null);
		closeModal();
	};

	const isModalOpen = modalMode !== null;
	const isSubmitting = modalMode === "create" ? isCreating : isUpdating;

	return (
		<CenteredPageLayout className="max-w-5xl">
			<Breadcrumbs
				items={[
					{ href: "/", label: t("nav.home") },
					{ href: "/departments", label: t("departments.title") },
				]}
			/>
			<Heading tag="h1">{t("departments.title")}</Heading>
			<Text>{t("departments.summary")}</Text>

			{isLoading ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("departments.loadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("departments.loadingBody")}</Text>
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

			{!isLoading && !error && departments.length === 0 ? (
				<Notice
					noticeRole="warning"
					noticeTitle={t("departments.emptyTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("departments.emptyBody")}</Text>
				</Notice>
			) : null}

			{departments.length > 0 ? (
				<div className="grid gap-300">
					<DataTable
						columns={departmentColumns}
						exportFileName="departments.csv"
						getRowId={(row) => row.uuid}
						itemLabel="departments"
						pageNumber={response?.page ?? page}
						pagination={false}
						rows={departmentRows}
						searchLabel="Search departments"
						searchPlaceholder="Filter by abbreviation or department name"
						searchQuery={searchDraft}
						title={t("departments.title")}
						action={{
							buttonId: (row) => `manage-department-${row.uuid}`,
							buttonLabel: t("departments.manageAction"),
							onAction: (row) => {
								openEditModal(row.uuid);
							},
							screenReaderLabel: (row) => row.name,
						}}
						primaryAction={{
							buttonId: "open-create-department-modal",
							buttonLabel: t("departments.createAction"),
							onAction: openCreateModal,
						}}
						onSearchChange={setSearchDraft}
					/>
					<Pagination
						currentPage={page}
						label="Departments pagination"
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
							{t("departments.cancelAction")}
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
								{t("departments.deleteAction")}
							</Button>
						) : null}
						<Button
							disabled={isSubmitting}
							type="button"
							onGcdsClick={() => {
								if (modalMode === "create") {
									void handleCreateDepartment();
									return;
								}

								void handleUpdateDepartment();
							}}
						>
							{modalMode === "create"
								? isCreating
									? t("departments.creatingAction")
									: t("departments.createAction")
								: isUpdating
									? t("departments.savingAction")
									: t("departments.saveAction")}
						</Button>
					</>
				}
				title={
					modalMode === "create"
						? t("departments.createTitle")
						: t("departments.editTitle")
				}
				onClose={closeModal}
			>
				<div className="grid gap-300 md:grid-cols-2">
					<Input
						label={t("departments.nameLabel")}
						value={form.name}
						inputId={
							modalMode === "create"
								? "create-department-name"
								: "edit-department-name"
						}
						name={
							modalMode === "create"
								? "department-name"
								: "edit-department-name"
						}
						onInput={(event: React.FormEvent<HTMLInputElement>): void => {
							updateFormField("name", (event.target as HTMLInputElement).value);
						}}
					/>
					<Input
						label={t("departments.nameFrLabel")}
						value={form.nameFr}
						inputId={
							modalMode === "create"
								? "create-department-name-fr"
								: "edit-department-name-fr"
						}
						name={
							modalMode === "create"
								? "department-name-fr"
								: "edit-department-name-fr"
						}
						onInput={(event: React.FormEvent<HTMLInputElement>): void => {
							updateFormField(
								"nameFr",
								(event.target as HTMLInputElement).value
							);
						}}
					/>
					<Input
						label={t("departments.abbreviationLabel")}
						value={form.abbreviation}
						inputId={
							modalMode === "create"
								? "create-department-abbreviation"
								: "edit-department-abbreviation"
						}
						name={
							modalMode === "create"
								? "department-abbreviation"
								: "edit-department-abbreviation"
						}
						onInput={(event: React.FormEvent<HTMLInputElement>): void => {
							updateFormField(
								"abbreviation",
								(event.target as HTMLInputElement).value
							);
						}}
					/>
					<Input
						label={t("departments.abbreviationFrLabel")}
						value={form.abbreviationFr}
						inputId={
							modalMode === "create"
								? "create-department-abbreviation-fr"
								: "edit-department-abbreviation-fr"
						}
						name={
							modalMode === "create"
								? "department-abbreviation-fr"
								: "edit-department-abbreviation-fr"
						}
						onInput={(event: React.FormEvent<HTMLInputElement>): void => {
							updateFormField(
								"abbreviationFr",
								(event.target as HTMLInputElement).value
							);
						}}
					/>
					<Input
						label={t("departments.gcOrgIdLabel")}
						type="number"
						value={form.gcOrgId}
						inputId={
							modalMode === "create"
								? "create-department-gc-org-id"
								: "edit-department-gc-org-id"
						}
						name={
							modalMode === "create"
								? "department-gc-org-id"
								: "edit-department-gc-org-id"
						}
						onInput={(event: React.FormEvent<HTMLInputElement>): void => {
							updateFormField(
								"gcOrgId",
								(event.target as HTMLInputElement).value
							);
						}}
					/>
					<Input
						label={t("departments.leadDepartmentNameLabel")}
						value={form.leadDepartmentName}
						inputId={
							modalMode === "create"
								? "create-department-lead-name"
								: "edit-department-lead-name"
						}
						name={
							modalMode === "create"
								? "department-lead-name"
								: "edit-department-lead-name"
						}
						onInput={(event: React.FormEvent<HTMLInputElement>): void => {
							updateFormField(
								"leadDepartmentName",
								(event.target as HTMLInputElement).value
							);
						}}
					/>
					<Input
						label={t("departments.leadDepartmentNameFrLabel")}
						value={form.leadDepartmentNameFr}
						inputId={
							modalMode === "create"
								? "create-department-lead-name-fr"
								: "edit-department-lead-name-fr"
						}
						name={
							modalMode === "create"
								? "department-lead-name-fr"
								: "edit-department-lead-name-fr"
						}
						onInput={(event: React.FormEvent<HTMLInputElement>): void => {
							updateFormField(
								"leadDepartmentNameFr",
								(event.target as HTMLInputElement).value
							);
						}}
					/>
				</div>
			</Modal>

			<ConfirmDialog
				cancelLabel={t("departments.cancelAction")}
				isOpen={deleteDialogOpen}
				isPending={isDeleting}
				title={t("departments.deleteConfirmTitle")}
				confirmLabel={
					isDeleting
						? t("departments.deletingAction")
						: t("departments.confirmDeleteAction")
				}
				description={t("departments.deleteConfirmBody", {
					name: selectedDepartment?.name ?? "",
				})}
				onClose={() => {
					setDeleteDialogOpen(false);
				}}
				onConfirm={() => {
					void handleDeleteDepartment();
				}}
			/>
		</CenteredPageLayout>
	);
};
