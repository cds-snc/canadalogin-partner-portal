import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
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
import { getRequestErrorNotice, isForbiddenRequestError } from "@/fetch";
import { useAdminListState, useTierManagement } from "@/hooks";
import { releaseActiveElementFocus } from "@/lib/release-active-element-focus";

type TierFormState = {
	name: string;
};

const emptyTierForm: TierFormState = {
	name: "",
};

type TierTableRow = {
	createdAt: string;
	name: string;
	uuid: string;
};

export const TiersPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const { page, searchDraft, setPage, setSearchDraft } =
		useAdminListState("tiers");
	const itemsPerPage = 10;
	const {
		createTier,
		deleteTier,
		error,
		isCreating,
		isDeleting,
		isLoading,
		isUpdating,
		response,
		tiers,
		updateTier,
	} = useTierManagement(page, itemsPerPage);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [form, setForm] = useState<TierFormState>(emptyTierForm);
	const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
	const [selectedTierUuid, setSelectedTierUuid] = useState<string | null>(null);
	const errorNotice =
		error && isForbiddenRequestError(error)
			? {
					bodyText: error.detail,
					bodyKey: "tiers.forbiddenBody",
					noticeRole: "warning" as const,
					titleKey: "tiers.forbiddenTitle",
				}
			: getRequestErrorNotice(error, {
					bodyKey: "tiers.errorBody",
					titleKey: "tiers.errorTitle",
				});

	const selectedTier =
		tiers.find((tier) => tier.uuid === selectedTierUuid) ?? null;
	const tierRows: Array<TierTableRow> = tiers.map((tier) => ({
		createdAt: tier.created_at,
		name: tier.name,
		uuid: tier.uuid,
	}));
	const tierColumns: Array<DataTableColumn<TierTableRow>> = [
		{ field: "name", headerName: t("tiers.nameLabel"), pinned: "left" },
		{ field: "createdAt", headerName: t("tiers.createdAtLabel") },
	];
	const totalPages = response
		? Math.max(1, Math.ceil(response.total_count / response.items_per_page))
		: 1;

	useEffect(() => {
		if (modalMode !== "edit" && !deleteDialogOpen) {
			return;
		}

		if (
			!selectedTierUuid ||
			tiers.some((tier) => tier.uuid === selectedTierUuid)
		) {
			return;
		}

		// Avoid direct setState in effect body, use microtask
		void Promise.resolve().then(() => {
			setSelectedTierUuid(null);
			setDeleteDialogOpen(false);
			setModalMode(null);
			setForm(emptyTierForm);
		});
	}, [deleteDialogOpen, modalMode, selectedTierUuid, tiers]);

	const closeModal = (): void => {
		setModalMode(null);
		setForm(emptyTierForm);
	};

	const openCreateModal = (): void => {
		releaseActiveElementFocus();
		setSelectedTierUuid(null);
		setForm(emptyTierForm);
		setModalMode("create");
	};

	const openEditModal = (tierUuid: string): void => {
		const tier = tiers.find((item) => item.uuid === tierUuid);

		if (!tier) {
			return;
		}

		releaseActiveElementFocus();
		setSelectedTierUuid(tier.uuid);
		setForm({ name: tier.name });
		setModalMode("edit");
	};

	const handleCreateTier = async (): Promise<void> => {
		await createTier(form);
		setPage(1);
		closeModal();
	};

	const handleUpdateTier = async (): Promise<void> => {
		if (!selectedTier) {
			return;
		}

		await updateTier(selectedTier.uuid, form);
		setPage(1);
		closeModal();
	};

	const handleDeleteTier = async (): Promise<void> => {
		if (!selectedTier) {
			return;
		}

		await deleteTier(selectedTier.uuid);
		setPage(1);
		setDeleteDialogOpen(false);
		setSelectedTierUuid(null);
		closeModal();
	};

	// Removed unused isModalOpen
	const isSubmitting = modalMode === "create" ? isCreating : isUpdating;

	return (
		<>
			<Heading tag="h1">{t("tiers.title")}</Heading>
			<Text>{t("tiers.summary")}</Text>

			{isLoading ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("tiers.loadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("tiers.loadingBody")}</Text>
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

			{!isLoading && !error && tiers.length === 0 ? (
				<Notice
					noticeRole="warning"
					noticeTitle={t("tiers.emptyTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("tiers.emptyBody")}</Text>
				</Notice>
			) : null}

			{tiers.length > 0 ? (
				<div className="grid gap-300">
					<DataTable
						columns={tierColumns}
						exportFileName="tiers.csv"
						getRowId={(row) => row.uuid}
						itemLabel="tiers"
						pageNumber={response?.page ?? page}
						pagination={false}
						rows={tierRows}
						searchLabel="Search tiers"
						searchPlaceholder="Filter by tier name or creation date"
						searchQuery={searchDraft}
						title={t("tiers.title")}
						action={{
							buttonId: (row) => `manage-tier-${row.uuid}`,
							buttonLabel: t("tiers.manageAction"),
							screenReaderLabel: (row) => row.name,
							onAction: (row) => {
								openEditModal(row.uuid);
							},
						}}
						primaryAction={{
							buttonId: "open-create-tier-modal",
							buttonLabel: t("tiers.createAction"),
							onAction: openCreateModal,
						}}
						onSearchChange={setSearchDraft}
					/>
					<Pagination
						currentPage={page}
						label="Tiers pagination"
						totalPages={totalPages}
						onPageChange={setPage}
					/>
				</div>
			) : null}

			<Modal
				isOpen={modalMode !== null}
				footer={
					<>
						<Button
							buttonRole="secondary"
							type="button"
							onGcdsClick={closeModal}
						>
							{t("tiers.cancelAction")}
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
								{t("tiers.deleteAction")}
							</Button>
						) : null}
						<Button
							disabled={isSubmitting}
							type="button"
							onGcdsClick={() => {
								if (modalMode === "create") {
									void handleCreateTier();
									return;
								}
								void handleUpdateTier();
							}}
						>
							{modalMode === "create"
								? isCreating
									? t("tiers.creatingAction")
									: t("tiers.createAction")
								: isUpdating
									? t("tiers.savingAction")
									: t("tiers.saveAction")}
						</Button>
					</>
				}
				title={
					modalMode === "create" ? t("tiers.createTitle") : t("tiers.editTitle")
				}
				onClose={closeModal}
			>
				<Input
					label={t("tiers.nameLabel")}
					name={modalMode === "create" ? "tier-name" : "edit-tier-name"}
					value={form.name}
					inputId={
						modalMode === "create" ? "create-tier-name" : "edit-tier-name"
					}
					onInput={(event: React.FormEvent<HTMLInputElement>): void => {
						setForm({ name: (event.target as HTMLInputElement).value });
					}}
				/>
			</Modal>

			<ConfirmDialog
				cancelLabel={t("tiers.cancelAction")}
				isOpen={deleteDialogOpen}
				isPending={isDeleting}
				title={t("tiers.deleteConfirmTitle")}
				confirmLabel={
					isDeleting
						? t("tiers.deletingAction")
						: t("tiers.confirmDeleteAction")
				}
				description={t("tiers.deleteConfirmBody", {
					name: selectedTier?.name ?? "",
				})}
				onClose={() => {
					setDeleteDialogOpen(false);
				}}
				onConfirm={() => {
					void handleDeleteTier();
				}}
			/>
		</>
	);
};
