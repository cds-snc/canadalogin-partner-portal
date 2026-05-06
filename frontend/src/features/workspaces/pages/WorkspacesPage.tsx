import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import type { FunctionComponent } from "@/common/types";
import { Breadcrumbs, CenteredPageLayout } from "@/components/layout";
import "./workspaces.css";
import {
	Button,
	ConfirmDialog,
	DataTable,
	Heading,
	Input,
	Modal,
	Notice,
	Text,
} from "@/components/ui";
import type { DataTableColumn } from "@/components/ui/DataTable";
import { getRequestErrorMessage, getRequestErrorNotice } from "@/fetch";
import {
	createWorkspace,
	deleteWorkspace,
	getWorkspaces,
	updateWorkspace,
	type WorkspaceCreate,
	type WorkspaceRead,
	type WorkspaceUpdate,
} from "@/fetch/workspaces";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/Toast";
import { releaseActiveElementFocus } from "@/lib/release-active-element-focus";
import { ManageMembersModal } from "../components/ManageMembersModal";

type WorkspaceFormState = {
	description: string;
	name: string;
	slug: string;
};

const emptyForm = (): WorkspaceFormState => ({
	description: "",
	name: "",
	slug: "",
});

export const WorkspacesPage = (): FunctionComponent => {
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const navigate = useNavigate();
	const toast = useToast();
	const queryClient = useQueryClient();

	const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
	const [form, setForm] = useState<WorkspaceFormState>(emptyForm());
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [selectedWorkspaceUuid, setSelectedWorkspaceUuid] = useState<
		string | null
	>(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

	const {
		data: workspaces,
		error,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["workspaces"],
		queryFn: getWorkspaces,
	});
	const errorNotice = getRequestErrorNotice(error as Error | null | undefined, {
		bodyKey: "workspaces.errorLoading",
		titleKey: "workspaces.errorLoading",
	});

	const selectedWorkspace =
		workspaces?.find((workspace) => workspace.uuid === selectedWorkspaceUuid) ??
		null;

	const closeModal = (): void => {
		setModalMode(null);
		setForm(emptyForm());
		setSelectedWorkspaceUuid(null);
	};

	const handleCreateSubmit = async (e: React.FormEvent): Promise<void> => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const payload: WorkspaceCreate = {
				name: form.name.trim(),
				description: form.description.trim() || undefined,
				slug: form.slug.trim() || undefined,
			};

			const created = await createWorkspace(payload);
			closeModal();
			toast.success(t("workspaces.createdSuccess"));
			void queryClient.invalidateQueries({ queryKey: ["workspaces"] });
			void navigate({
				to: "/workspaces/$workspaceUuid",
				params: { workspaceUuid: created.uuid },
			});
		} catch (err) {
			console.error(err);
			toast.error(getRequestErrorMessage(err, t("errors.unknown")));
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleEditSubmit = async (e: React.FormEvent): Promise<void> => {
		e.preventDefault();
		if (!selectedWorkspaceUuid) return;
		setIsSubmitting(true);

		try {
			const payload: WorkspaceUpdate = {
				name: form.name.trim(),
				description: form.description.trim() || undefined,
				slug: form.slug.trim() || undefined,
			};

			await updateWorkspace(selectedWorkspaceUuid, payload);
			closeModal();
			toast.success(t("workspaces.updatedSuccess"));
			void queryClient.invalidateQueries({ queryKey: ["workspaces"] });
		} catch (err) {
			console.error(err);
			toast.error(getRequestErrorMessage(err, t("errors.unknown")));
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteWorkspace = async (): Promise<void> => {
		if (!selectedWorkspaceUuid) return;
		setIsDeleting(true);

		try {
			await deleteWorkspace(selectedWorkspaceUuid);
			closeModal();
			setDeleteDialogOpen(false);
			setSelectedWorkspaceUuid(null);
			toast.success(t("workspaces.deletedSuccess"));
			void queryClient.invalidateQueries({ queryKey: ["workspaces"] });
		} catch (err) {
			console.error(err);
			toast.error(getRequestErrorMessage(err, t("errors.unknown")));
		} finally {
			setIsDeleting(false);
		}
	};

	const handleView = (workspace: WorkspaceRead): void => {
		void navigate({
			to: "/workspaces/$workspaceUuid",
			params: { workspaceUuid: workspace.uuid },
		});
	};

	const handleEdit = (workspace: WorkspaceRead): void => {
		setForm({
			name: workspace.name,
			slug: workspace.slug,
			description: workspace.description ?? "",
		});
		setSelectedWorkspaceUuid(workspace.uuid);
		setModalMode("edit");
	};

	const handleOpenCreateModal = (): void => {
		setForm(emptyForm());
		setModalMode("create");
	};

	const handleManageMembers = (workspace: WorkspaceRead): void => {
		setSelectedWorkspaceUuid(workspace.uuid);
		setIsMembersModalOpen(true);
	};

	const handleNameInput = (event: React.FormEvent<HTMLInputElement>): void => {
		setForm((current) => ({
			...current,
			name: (event.target as HTMLInputElement).value,
		}));
	};

	const handleSlugInput = (event: React.FormEvent<HTMLInputElement>): void => {
		setForm((current) => ({
			...current,
			slug: (event.target as HTMLInputElement).value,
		}));
	};

	const handleDescriptionInput = (
		event: React.FormEvent<HTMLInputElement>
	): void => {
		setForm((current) => ({
			...current,
			description: (event.target as HTMLInputElement).value,
		}));
	};

	const isModalOpen = modalMode !== null;
	const modalTitle =
		modalMode === "create"
			? t("workspaces.createModalTitle")
			: t("workspaces.editModalTitle");

	// prepare table rows/columns like UsersPage style
	type WorkspaceRow = {
		uuid: string;
		name: string;
		slug: string;
	};

	const workspaceRows: Array<WorkspaceRow> = workspaces
		? workspaces.map((w) => ({ uuid: w.uuid, name: w.name, slug: w.slug }))
		: [];

	const workspaceColumns: Array<DataTableColumn<WorkspaceRow>> = [
		{ field: "name", headerName: t("workspaces.nameLabel"), pinned: "left" },
		{ field: "slug", headerName: t("workspaces.slugLabel") },
	];

	return (
		<CenteredPageLayout className="max-w-5xl">
			<Breadcrumbs
				items={[
					{ href: "/", label: t("nav.home") },
					{ href: "/workspaces", label: t("workspaces.title") },
				]}
			/>
			<div className="flex flex-col gap-6">
				<div className="flex items-center justify-between">
					<Heading tag="h1">{t("workspaces.title")}</Heading>
					<Button type="button" onGcdsClick={handleOpenCreateModal}>
						{t("workspaces.create")}
					</Button>
				</div>

				{isLoading ? <Text>{t("workspaces.loading")}</Text> : null}

				{isError ? (
					<Notice
						noticeRole={errorNotice?.noticeRole ?? "danger"}
						noticeTitleTag="h2"
						noticeTitle={t(
							(errorNotice?.titleKey ?? "workspaces.errorLoading") as never
						)}
					>
						<Text>
							{errorNotice?.bodyText ??
								t((errorNotice?.bodyKey ?? "workspaces.errorLoading") as never)}
						</Text>
					</Notice>
				) : null}

				{!isLoading && !isError && workspaces && workspaces.length === 0 ? (
					<Notice
						noticeRole="info"
						noticeTitle={t("workspaces.noWorkspaces")}
						noticeTitleTag="h2"
					>
						<div></div>
					</Notice>
				) : null}

				{!isLoading && !isError && workspaceRows.length > 0 ? (
					<DataTable
						actionColumnWidth={{ max: 520, min: 360 }}
						columns={workspaceColumns}
						getRowId={(r) => r.uuid}
						itemLabel="workspaces"
						pagination={false}
						rows={workspaceRows}
						title={t("workspaces.title")}
						action={[
							{
								buttonId: (row) => `view-workspace-${row.uuid}`,
								buttonLabel: t("workspaces.view"),
								onAction: (row): void => {
									const ws = workspaces?.find((w) => w.uuid === row.uuid);
									if (ws) handleView(ws);
								},
							},
							{
								buttonId: (row) => `edit-workspace-${row.uuid}`,
								buttonLabel: t("workspaces.edit"),
								onAction: (row): void => {
									const ws = workspaces?.find((w) => w.uuid === row.uuid);
									if (ws) handleEdit(ws);
								},
							},
							{
								buttonId: (row) => `manage-members-${row.uuid}`,
								buttonLabel: t("workspaces.roles"),
								onAction: (row): void => {
									const ws = workspaces?.find((w) => w.uuid === row.uuid);
									if (ws) handleManageMembers(ws);
								},
							},
						]}
					/>
				) : null}

				<Modal isOpen={isModalOpen} title={modalTitle} onClose={closeModal}>
					<form
						className="flex flex-col gap-4"
						onSubmit={
							modalMode === "create" ? handleCreateSubmit : handleEditSubmit
						}
					>
						<Input
							required
							inputId="workspace-name"
							label={t("workspaces.nameLabel")}
							name="name"
							value={form.name}
							onInput={handleNameInput}
						/>

						<Input
							hint={t("workspaces.slugHint")}
							inputId="workspace-slug"
							label={t("workspaces.slugLabel")}
							name="slug"
							value={form.slug}
							onInput={handleSlugInput}
						/>

						<Input
							inputId="workspace-description"
							label={t("workspaces.descriptionLabel")}
							name="description"
							value={form.description}
							onInput={handleDescriptionInput}
						/>

						<div className="flex gap-4 justify-end">
							<Button
								buttonRole="secondary"
								type="button"
								onGcdsClick={closeModal}
							>
								{t("common.cancel")}
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
									{t("workspaces.deleteAction")}
								</Button>
							) : null}
							<Button
								disabled={isSubmitting || !form.name.trim()}
								type="submit"
							>
								{isSubmitting ? t("common.saving") : t("common.save")}
							</Button>
						</div>
					</form>
				</Modal>

				<ConfirmDialog
					cancelLabel={t("common.cancel")}
					isOpen={deleteDialogOpen}
					isPending={isDeleting}
					title={t("workspaces.deleteConfirmTitle")}
					confirmLabel={
						isDeleting
							? t("workspaces.deletingAction")
							: t("workspaces.deleteAction")
					}
					description={t("workspaces.deleteConfirmBody", {
						name: selectedWorkspace?.name ?? "",
					})}
					onClose={() => {
						setDeleteDialogOpen(false);
					}}
					onConfirm={() => {
						void handleDeleteWorkspace();
					}}
				/>

				{selectedWorkspaceUuid && (
					<ManageMembersModal
						isOpen={isMembersModalOpen}
						workspaceUuid={selectedWorkspaceUuid}
						onClose={() => {
							setIsMembersModalOpen(false);
							setSelectedWorkspaceUuid(null);
						}}
					/>
				)}
			</div>
		</CenteredPageLayout>
	);
};
