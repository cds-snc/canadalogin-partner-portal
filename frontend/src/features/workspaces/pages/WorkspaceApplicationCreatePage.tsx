import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Heading, Notice, Text } from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import { WorkspaceRPApplicationForm } from "../components/WorkspaceRPApplicationForm";
import { useWorkspaceApplicationInformationList } from "../hooks/use-workspace-application-information";
import { useWorkspaceRPApplicationManagement } from "../hooks/use-workspace-rp-application-management";
import {
	createEmptyWorkspaceRPApplicationForm,
	toRPApplicationCreatePayload,
	validateWorkspaceRPApplicationForm,
	type WorkspaceRPApplicationFormState,
	type WorkspaceRPApplicationValidationMessageKey,
} from "../workspace-rp-application-form";

export const WorkspaceApplicationCreatePage = (): FunctionComponent => {
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const navigate = useNavigate();
	const { workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/applications/new",
	});
	const { applicationInformationRecords } =
		useWorkspaceApplicationInformationList(workspaceUuid);
	const { createRPApplication, isCreating } =
		useWorkspaceRPApplicationManagement();
	const [error, setError] = useState<Error | null>(null);
	const [validationMessageKeys, setValidationMessageKeys] = useState<
		Array<WorkspaceRPApplicationValidationMessageKey>
	>([]);
	const [form, setForm] = useState<WorkspaceRPApplicationFormState>(
		createEmptyWorkspaceRPApplicationForm
	);
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "workspaces.applicationsErrorBody",
		titleKey: "workspaces.applicationsErrorTitle",
	});

	const updateFormField = (
		field: keyof WorkspaceRPApplicationFormState,
		value: string | Array<string>
	): void => {
		setValidationMessageKeys([]);
		setForm((currentForm) => ({ ...currentForm, [field]: value }));
	};

	const handleCreateApplication = async (): Promise<void> => {
		setError(null);
		const validationErrors = validateWorkspaceRPApplicationForm(form);
		if (validationErrors.length > 0) {
			setValidationMessageKeys(validationErrors);
			return;
		}

		try {
			const application = await createRPApplication(
				workspaceUuid,
				toRPApplicationCreatePayload(form)
			);

			await navigate({
				params: {
					rpApplicationUuid: application.uuid,
					workspaceUuid,
				},
				replace: true,
				search: { created: "1" },
				to: "/workspaces/$workspaceUuid/applications/$rpApplicationUuid",
			});
		} catch (requestError) {
			setError(requestError as Error);
		}
	};

	return (
		<>
			<Heading tag="h1">{t("workspaces.applicationsCreatePageTitle")}</Heading>
			<Text>{t("workspaces.applicationsCreateSummary")}</Text>

			{validationMessageKeys.length > 0 ? (
				<Notice
					noticeRole="danger"
					noticeTitle={t("workspaces.applicationsValidationErrorTitle")}
					noticeTitleTag="h2"
				>
					<ul className="list-disc pl-300">
						{validationMessageKeys.map((messageKey) => (
							<li key={messageKey}>{t(messageKey)}</li>
						))}
					</ul>
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

			<WorkspaceRPApplicationForm
				cancelHref={`/workspaces/${workspaceUuid}/applications`}
				form={form}
				isSubmitting={isCreating}
				applicationInformationOptions={applicationInformationRecords.map(
					(applicationInformation) => ({
						label: applicationInformation.serviceNameEn,
						value: applicationInformation.uuid,
					})
				)}
				submitLabel={
					isCreating
						? t("workspaces.applicationsSavingAction")
						: t("workspaces.applicationsCreateAction")
				}
				onChange={updateFormField}
				onSubmit={() => {
					void handleCreateApplication();
				}}
			/>
		</>
	);
};
