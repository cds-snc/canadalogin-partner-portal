import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, ConfirmDialog, Heading, Notice, Text } from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import { WorkspaceForm } from "../components/WorkspaceForm";
import { useWorkspace } from "../hooks/use-workspace";
import { useWorkspaceManagement } from "../hooks/use-workspace-management";
import {
	createEmptyWorkspaceForm,
	toWorkspaceFormState,
	toWorkspaceUpdatePayload,
	type WorkspaceFormState,
} from "../workspace-form";

type WorkspaceFormDraft = {
	sourceUuid: string;
	values: Partial<WorkspaceFormState>;
};

export const WorkspaceSettingsPage = (): FunctionComponent => {
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const navigate = useNavigate();
	const { workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/settings",
	});
	const { error: loadError, isLoading, workspace } = useWorkspace(workspaceUuid);
	const { deleteWorkspace, isDeleting, isUpdating, updateWorkspace } =
		useWorkspaceManagement();
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [formDraft, setFormDraft] = useState<WorkspaceFormDraft | null>(null);
	const [submitError, setSubmitError] = useState<Error | null>(null);
	const errorNotice = getRequestErrorNotice(submitError ?? loadError, {
		bodyKey: "workspaces.errorBody",
		titleKey: "workspaces.errorTitle",
	});
	const formSourceUuid = workspace?.uuid ?? workspaceUuid;
	const formOverrides =
		formDraft?.sourceUuid === formSourceUuid ? formDraft.values : {};
	const form: WorkspaceFormState = {
		...createEmptyWorkspaceForm(),
		...(workspace ? toWorkspaceFormState(workspace) : {}),
		...formOverrides,
	};

	const updateFormField = (
		field: keyof WorkspaceFormState,
		value: string
	): void => {
		setFormDraft((currentDraft) => ({
			sourceUuid: formSourceUuid,
			values: {
				...(currentDraft?.sourceUuid === formSourceUuid
					? currentDraft.values
					: {}),
				[field]: value,
			},
		}));
	};

	const handleUpdateWorkspace = async (): Promise<void> => {
		setSubmitError(null);

		try {
			const updatedWorkspace = await updateWorkspace(
				workspaceUuid,
				toWorkspaceUpdatePayload(form)
			);

			await navigate({
				params: { workspaceUuid: updatedWorkspace.uuid },
				replace: true,
				search: { updated: "1" },
				to: "/workspaces/$workspaceUuid",
			});
		} catch (requestError) {
			setSubmitError(requestError as Error);
		}
	};

	const handleDeleteWorkspace = async (): Promise<void> => {
		setSubmitError(null);

		try {
			await deleteWorkspace(workspaceUuid);

			await navigate({
				replace: true,
				search: { deleted: "1" },
				to: "/workspaces",
			});
		} catch (requestError) {
			setDeleteDialogOpen(false);
			setSubmitError(requestError as Error);
		}
	};

	return (
		<>
			<Heading tag="h1">
				{workspace
					? t("workspaces.settingsPageTitle", { name: workspace.name })
					: t("workspaces.workspaceLabel")}
			</Heading>
			<Text>{t("workspaces.settingsSummary")}</Text>

			{isLoading ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("workspaces.detailLoadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.detailLoadingBody")}</Text>
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

			{workspace ? (
				<>
					<WorkspaceForm
						cancelHref={`/workspaces/${workspaceUuid}`}
						form={form}
						isSubmitting={isUpdating}
						submitLabel={
							isUpdating
								? t("workspaces.savingAction")
								: t("workspaces.saveAction")
						}
						onChange={updateFormField}
						onSubmit={() => {
							void handleUpdateWorkspace();
						}}
					/>
					<div className="mt-300">
						<Button
							buttonRole="danger"
							type="button"
							onGcdsClick={() => {
								setDeleteDialogOpen(true);
							}}
						>
							{t("workspaces.deleteAction")}
						</Button>
					</div>
					<ConfirmDialog
						cancelLabel={t("workspaces.cancelAction")}
						isOpen={deleteDialogOpen}
						isPending={isDeleting}
						title={t("workspaces.deleteConfirmTitle")}
						confirmLabel={
							isDeleting
								? t("workspaces.deletingAction")
								: t("workspaces.deleteAction")
						}
						description={t("workspaces.deleteConfirmBody", {
							name: workspace.name,
						})}
						onClose={() => {
							setDeleteDialogOpen(false);
						}}
						onConfirm={() => {
							void handleDeleteWorkspace();
						}}
					/>
				</>
			) : null}
		</>
	);
};