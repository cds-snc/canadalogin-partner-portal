import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { ErrorSummary, Heading, Notice, Text } from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import { WorkspaceRPApplicationForm } from "../components/WorkspaceRPApplicationForm";
import { useWorkspaceApplicationInformation } from "../hooks/use-workspace-application-information";
import { useWorkspaceRPRegistrationActions } from "../hooks/use-workspace-rp-registration";
import {
	createEmptyWorkspaceRPApplicationForm,
	getWorkspaceRPApplicationStepFieldErrorKeys,
	validateWorkspaceRPApplicationStep,
	type WorkspaceRPApplicationFormState,
	type WorkspaceRPApplicationValidationMessageKey,
} from "../workspace-rp-application-form";

export const ApplicationRPConfigurationCreatePage = (): FunctionComponent => {
	const { i18n, t } = useTranslation() as unknown as {
		i18n: { resolvedLanguage?: string };
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const navigate = useNavigate();
	const { applicationInformationUuid, workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/new",
	});
	const {
		applicationInformation,
		error: applicationError,
		isLoading,
	} = useWorkspaceApplicationInformation(
		workspaceUuid,
		applicationInformationUuid
	);
	const { createApplicationDraft, isCreating } =
		useWorkspaceRPRegistrationActions();
	const [registrationCreationKey] = useState(() => crypto.randomUUID());
	const [requestError, setRequestError] = useState<Error | null>(null);
	const [validationMessageKeys, setValidationMessageKeys] = useState<
		Array<WorkspaceRPApplicationValidationMessageKey>
	>([]);
	const [form, setForm] = useState<WorkspaceRPApplicationFormState>(
		createEmptyWorkspaceRPApplicationForm
	);
	const applicationName = applicationInformation
		? i18n.resolvedLanguage?.startsWith("fr")
			? applicationInformation.serviceNameFr
			: applicationInformation.serviceNameEn
		: "";
	const effectiveForm: WorkspaceRPApplicationFormState = applicationInformation
		? {
				...form,
				applicationInformationUuid,
				serviceNameEn: applicationInformation.serviceNameEn,
				serviceNameFr: applicationInformation.serviceNameFr,
			}
		: form;
	const errorNotice = getRequestErrorNotice(requestError ?? applicationError, {
		bodyKey: "workspaces.rpConfigurationCreateErrorBody",
		titleKey: "workspaces.rpConfigurationCreateErrorTitle",
	});
	const fieldErrorKeys = getWorkspaceRPApplicationStepFieldErrorKeys(
		effectiveForm,
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
		form.configurationName.length > 0 ||
		form.partnerEnvironment.length > 0 ||
		form.canadaLoginEnvironment.length > 0;
	const configurationListPath = `/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(applicationInformationUuid)}/rp-configurations`;

	const updateFormField = (
		field: keyof WorkspaceRPApplicationFormState,
		value: string | Array<string>
	): void => {
		setValidationMessageKeys([]);
		setForm((currentForm) => ({ ...currentForm, [field]: value }));
	};

	const handleCreate = async (exitAfterCreate = false): Promise<void> => {
		setRequestError(null);
		const validationErrors = validateWorkspaceRPApplicationStep(
			effectiveForm,
			"basics"
		);
		if (validationErrors.length > 0) {
			setValidationMessageKeys(validationErrors);
			return;
		}

		try {
			const draft = await createApplicationDraft(
				workspaceUuid,
				applicationInformationUuid,
				{
					canadaLoginEnvironment: effectiveForm.canadaLoginEnvironment as
						"test" | "staging" | "production",
					configurationName: effectiveForm.configurationName,
					partnerEnvironment: effectiveForm.partnerEnvironment,
				},
				registrationCreationKey
			);
			const configurationPath = `${configurationListPath}/${encodeURIComponent(draft.rpApplicationUuid)}`;
			await navigate({
				href: exitAfterCreate
					? configurationPath
					: `${configurationPath}/registration/endpoints`,
				replace: true,
			});
		} catch (error) {
			setRequestError(error as Error);
		}
	};

	const handleCancel = (): void => {
		if (
			isDirty &&
			!window.confirm(t("workspaces.registration.discardChangesWarning"))
		) {
			return;
		}
		void navigate({ href: configurationListPath });
	};

	return (
		<div className="grid gap-400">
			<div>
				<Heading tag="h1">
					{t("workspaces.rpConfigurationCreatePageTitle")}
				</Heading>
				<Text>{t("workspaces.rpConfigurationCreateSummary")}</Text>
				<Text>
					{t("workspaces.registration.stepCount", { current: 1, total: 6 })}
				</Text>
			</div>

			{validationMessageKeys.length > 0 ? <ErrorSummary listen /> : null}

			{isLoading ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("workspaces.appInfoLoadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.appInfoLoadingBody")}</Text>
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

			{applicationInformation && !applicationError ? (
				<WorkspaceRPApplicationForm
					applicationContextName={applicationName}
					applicationInformationOptions={[]}
					cancelHref={configurationListPath}
					fieldErrors={fieldErrors}
					form={effectiveForm}
					isSubmitting={isCreating}
					saveAndExitLabel={t("workspaces.registration.saveAndExitAction")}
					step="basics"
					submitLabel={
						isCreating
							? t("workspaces.applicationsSavingAction")
							: t("workspaces.registration.continueAction")
					}
					onCancel={handleCancel}
					onChange={updateFormField}
					onSaveAndExit={() => {
						void handleCreate(true);
					}}
					onSubmit={() => {
						void handleCreate(false);
					}}
				/>
			) : null}
		</div>
	);
};
