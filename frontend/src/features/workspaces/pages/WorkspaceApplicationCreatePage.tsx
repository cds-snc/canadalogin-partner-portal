import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { ErrorSummary, Heading, Notice, Text } from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import { WorkspaceRPApplicationForm } from "../components/WorkspaceRPApplicationForm";
import { useWorkspaceApplicationInformationList } from "../hooks/use-workspace-application-information";
import { useWorkspaceRPRegistrationActions } from "../hooks/use-workspace-rp-registration";
import { getWorkspaceRPRegistrationStepPath } from "../workspace-rp-registration-flow";
import {
	createEmptyWorkspaceRPApplicationForm,
	getWorkspaceRPApplicationStepFieldErrorKeys,
	validateWorkspaceRPApplicationStep,
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
	const { createDraft, isCreating } = useWorkspaceRPRegistrationActions();
	const [registrationCreationKey] = useState(() => crypto.randomUUID());
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
	const fieldErrorKeys = getWorkspaceRPApplicationStepFieldErrorKeys(
		form,
		"basics",
		validationMessageKeys
	);
	const fieldErrors: Partial<
		Record<keyof WorkspaceRPApplicationFormState, string>
	> = {};
	for (const [field, messageKey] of Object.entries(fieldErrorKeys)) {
		if (messageKey) {
			fieldErrors[field as keyof WorkspaceRPApplicationFormState] =
				t(messageKey);
		}
	}
	const isDirty =
		form.applicationInformationUuid.length > 0 ||
		form.canadaLoginEnvironment.length > 0 ||
		form.serviceNameEn.length > 0 ||
		form.serviceNameFr.length > 0;

	const updateFormField = (
		field: keyof WorkspaceRPApplicationFormState,
		value: string | Array<string>
	): void => {
		setValidationMessageKeys([]);
		setForm((currentForm) => ({ ...currentForm, [field]: value }));
	};

	const handleCreateApplication = async (
		exitAfterCreate = false
	): Promise<void> => {
		setError(null);
		const validationErrors = validateWorkspaceRPApplicationStep(form, "basics");
		if (validationErrors.length > 0) {
			setValidationMessageKeys(validationErrors);
			return;
		}

		try {
			const draft = await createDraft(
				workspaceUuid,
				{
					...(form.applicationInformationUuid
						? { applicationInformationUuid: form.applicationInformationUuid }
						: {}),
					canadaLoginEnvironment: form.canadaLoginEnvironment as
						"test" | "staging" | "production",
					serviceNameEn: form.serviceNameEn.trim(),
					serviceNameFr: form.serviceNameFr.trim(),
				},
				registrationCreationKey
			);
			await navigate({
				href: exitAfterCreate
					? `/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(draft.rpApplicationUuid)}`
					: getWorkspaceRPRegistrationStepPath(
							workspaceUuid,
							draft.rpApplicationUuid,
							"endpoints"
						),
				replace: true,
			});
		} catch (requestError) {
			setError(requestError as Error);
		}
	};

	const handleCancel = (): void => {
		if (
			isDirty &&
			!window.confirm(t("workspaces.registration.discardChangesWarning"))
		) {
			return;
		}
		void navigate({
			href: `/workspaces/${encodeURIComponent(workspaceUuid)}/applications`,
		});
	};

	return (
		<>
			<Heading tag="h1">{t("workspaces.applicationsCreatePageTitle")}</Heading>
			<Text>{t("workspaces.applicationsCreateSummary")}</Text>
			<Text>
				{t("workspaces.registration.stepCount", { current: 1, total: 6 })}
			</Text>

			{validationMessageKeys.length > 0 ? <ErrorSummary listen /> : null}

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
				cancelHref={`/workspaces/${encodeURIComponent(workspaceUuid)}/applications`}
				fieldErrors={fieldErrors}
				form={form}
				isSubmitting={isCreating}
				saveAndExitLabel={t("workspaces.registration.saveAndExitAction")}
				step="basics"
				applicationInformationOptions={applicationInformationRecords.map(
					(applicationInformation) => ({
						label: applicationInformation.serviceNameEn,
						value: applicationInformation.uuid,
					})
				)}
				submitLabel={
					isCreating
						? t("workspaces.applicationsSavingAction")
						: t("workspaces.registration.continueAction")
				}
				onCancel={handleCancel}
				onChange={updateFormField}
				onSaveAndExit={() => {
					void handleCreateApplication(true);
				}}
				onSubmit={() => {
					void handleCreateApplication(false);
				}}
			/>
		</>
	);
};
