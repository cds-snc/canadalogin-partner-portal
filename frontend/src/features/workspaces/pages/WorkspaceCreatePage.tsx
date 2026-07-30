import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Heading, Notice, Text } from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import { useSession } from "@/hooks";
import { WorkspaceForm } from "../components/WorkspaceForm";
import { useWorkspaceManagement } from "../hooks/use-workspace-management";
import {
	createEmptyWorkspaceForm,
	toWorkspaceCreatePayload,
	type WorkspaceFormState,
} from "../workspace-form";

export const WorkspaceCreatePage = (): FunctionComponent => {
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const navigate = useNavigate();
	const { currentUser } = useSession();
	const { createWorkspace, isCreating } = useWorkspaceManagement();
	const [error, setError] = useState<Error | null>(null);
	const [form, setForm] = useState<WorkspaceFormState>(createEmptyWorkspaceForm);
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "workspaces.errorBody",
		titleKey: "workspaces.errorTitle",
	});

	const updateFormField = (
		field: keyof WorkspaceFormState,
		value: string
	): void => {
		setForm((currentForm) => ({ ...currentForm, [field]: value }));
	};

	const handleCreateWorkspace = async (): Promise<void> => {
		if (!currentUser?.departmentUuid) {
			return;
		}

		setError(null);

		try {
			const workspace = await createWorkspace(
				toWorkspaceCreatePayload(form, currentUser.departmentUuid)
			);

			await navigate({
				params: { workspaceUuid: workspace.uuid },
				replace: true,
				search: { created: "1" },
				to: "/workspaces/$workspaceUuid",
			});
		} catch (requestError) {
			setError(requestError as Error);
		}
	};

	return (
		<>
			<Heading tag="h1">{t("workspaces.createPageTitle")}</Heading>
			<Text>{t("workspaces.createSummary")}</Text>

			{!currentUser?.departmentUuid ? (
				<Notice
					noticeRole="warning"
					noticeTitle={t("workspaces.emptyDepartmentTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.emptyDepartmentBody")}</Text>
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

			{currentUser?.departmentUuid ? (
				<WorkspaceForm
					cancelHref="/workspaces"
					departmentAbbreviation={currentUser.departmentAbbreviation}
					form={form}
					isSubmitting={isCreating}
					submitLabel={
						isCreating
							? t("workspaces.creatingAction")
							: t("workspaces.createAction")
					}
					onChange={updateFormField}
					onSubmit={() => {
						void handleCreateWorkspace();
					}}
				/>
			) : null}
		</>
	);
};