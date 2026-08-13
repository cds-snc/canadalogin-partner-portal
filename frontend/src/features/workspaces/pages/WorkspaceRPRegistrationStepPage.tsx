import { useCallback, useEffect, useState } from "react";
import { useBlocker, useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, ErrorSummary, Heading, Notice, Text } from "@/components/ui";
import { getRequestErrorNotice, isConflictRequestError } from "@/fetch";
import {
	getWorkspaceRPRegistrationValidationFieldNames,
	isWorkspaceRPRegistrationValidationError,
	type RegistrationDataStep,
	type WorkspaceRPApplicationRegistrationAnswers,
} from "@/fetch/rp-applications";
import { WorkspaceRPApplicationForm } from "../components/WorkspaceRPApplicationForm";
import { WorkspaceRPRegistrationNavigation } from "../components/WorkspaceRPRegistrationNavigation";
import {
	allowNextPendingNavigation,
	consumePendingNavigationAllowance,
	registerPendingNavigationGuard,
} from "@/features/navigation/pending-navigation-guard";
import { useWorkspaceApplicationInformationList } from "../hooks/use-workspace-application-information";
import {
	useWorkspaceRPRegistrationActions,
	useWorkspaceRPRegistrationDraft,
} from "../hooks/use-workspace-rp-registration";
import {
	createEmptyWorkspaceRPApplicationForm,
	getWorkspaceRPApplicationStepFieldErrorKeys,
	toWorkspaceRPApplicationDraftFormState,
	toWorkspaceRPApplicationRegistrationAnswers,
	validateWorkspaceRPApplicationStep,
	type WorkspaceRPApplicationFieldErrorKeys,
	type WorkspaceRPApplicationFormState,
} from "../workspace-rp-application-form";
import { WORKSPACE_RP_APPLICATION_FIELDS_BY_STEP } from "../workspace-rp-application-fields";
import {
	clearPendingRegistrationValidationStep,
	getPendingRegistrationValidation,
	getPendingRegistrationValidationSteps,
	setPendingRegistrationValidation,
} from "../registration-validation-recovery";
import {
	getNextWorkspaceRPRegistrationStep,
	getPreviousWorkspaceRPRegistrationStep,
	getRecoverableWorkspaceRPRegistrationStep,
	isRegistrationDataStep,
	isWorkspaceRPRegistrationStep,
	WORKSPACE_RP_REGISTRATION_STEPS,
	WORKSPACE_RP_REGISTRATION_STEP_LABEL_KEYS,
	type WorkspaceRPRegistrationStep,
} from "../workspace-rp-registration-flow";

type FormDraft = {
	sourceVersion: number;
	values: Partial<WorkspaceRPApplicationFormState>;
};

type FailedSave = {
	exitAfterSave: boolean;
	mode: "partial" | "completeStep";
};

type ClientFieldErrorState = {
	contextKey: string;
	errors: WorkspaceRPApplicationFieldErrorKeys;
};

const REVIEW_GROUPS: Array<{
	fields: Array<keyof WorkspaceRPApplicationRegistrationAnswers>;
	step: Exclude<WorkspaceRPRegistrationStep, "review">;
}> = [
	{
		fields: ["canadaLoginEnvironment", "serviceNameEn", "serviceNameFr"],
		step: "basics",
	},
	{
		fields: [
			"applicationEnvironmentUrlEn",
			"applicationEnvironmentUrlFr",
			"redirectUris",
			"postLogoutRedirectUris",
			"logoutMode",
			"logoutUri",
		],
		step: "endpoints",
	},
	{
		fields: [
			"clientType",
			"clientAuthMethod",
			"requestedScopes",
			"sectorIdentifier",
			"pkceSupported",
		],
		step: "client-and-access",
	},
	{
		fields: ["requestSigningSupported", "signatureValidationSupported"],
		step: "signing",
	},
	{
		fields: ["requestEncryptionSupported", "messageDecryptionSupported"],
		step: "encryption",
	},
];

const REVIEW_FIELD_LABEL_KEYS: Partial<
	Record<keyof WorkspaceRPApplicationRegistrationAnswers, string>
> = {
	applicationEnvironmentUrlEn: "workspaces.applicationsUrlEnLabel",
	applicationEnvironmentUrlFr: "workspaces.applicationsUrlFrLabel",
	canadaLoginEnvironment: "workspaces.applicationsEnvironmentLabel",
	clientAuthMethod: "workspaces.applicationsClientAuthMethodLabel",
	clientType: "workspaces.applicationsClientTypeLabel",
	logoutMode: "workspaces.applicationsLogoutModeLabel",
	logoutUri: "workspaces.applicationsLogoutUriLabel",
	messageDecryptionSupported:
		"workspaces.applicationsMessageDecryptionSupportedLabel",
	pkceSupported: "workspaces.applicationsPkceSupportedLabel",
	postLogoutRedirectUris: "workspaces.applicationsPostLogoutRedirectUrisLabel",
	redirectUris: "workspaces.applicationsRedirectUrisLabel",
	requestedScopes: "workspaces.applicationsRequestedScopesLabel",
	requestEncryptionSupported:
		"workspaces.applicationsRequestEncryptionSupportedLabel",
	requestSigningSupported:
		"workspaces.applicationsRequestSigningSupportedLabel",
	sectorIdentifier: "workspaces.applicationsSectorIdentifierLabel",
	serviceNameEn: "workspaces.applicationsServiceNameEnLabel",
	serviceNameFr: "workspaces.applicationsServiceNameFrLabel",
	signatureValidationSupported:
		"workspaces.applicationsSignatureValidationSupportedLabel",
};

const displayReviewValue = (
	value: unknown,
	yes: string,
	no: string,
	notProvided: string
): string => {
	if (value === true) return yes;
	if (value === false) return no;
	if (Array.isArray(value))
		return value.length > 0 ? value.join(", ") : notProvided;
	return typeof value === "string" && value.trim() ? value : notProvided;
};

export const WorkspaceRPRegistrationStepPage = (): FunctionComponent => {
	const { i18n, t } = useTranslation() as unknown as {
		i18n?: { resolvedLanguage?: string };
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const navigate = useNavigate();
	const params = useParams({ strict: false });
	const applicationInformationUuid = params["applicationInformationUuid"] ?? "";
	const rpApplicationUuid =
		params["rpConfigurationUuid"] || params["rpApplicationUuid"] || "";
	const routeStep = params["step"] ?? "basics";
	const workspaceUuid = params["workspaceUuid"] ?? "";
	const step = isWorkspaceRPRegistrationStep(routeStep) ? routeStep : "basics";
	const registrationStepPath = useCallback(
		(targetStep: WorkspaceRPRegistrationStep | "confirmation"): string =>
			`/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(applicationInformationUuid)}/rp-configurations/${encodeURIComponent(rpApplicationUuid)}/registration/${targetStep}`,
		[applicationInformationUuid, rpApplicationUuid, workspaceUuid]
	);
	const configurationPath = `/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(applicationInformationUuid)}/rp-configurations/${encodeURIComponent(rpApplicationUuid)}`;
	const draftKey = `${workspaceUuid}:${rpApplicationUuid}`;
	const {
		draft,
		error: loadError,
		isLoading,
		refetch,
	} = useWorkspaceRPRegistrationDraft(
		workspaceUuid,
		rpApplicationUuid,
		applicationInformationUuid
	);
	const { applicationInformationRecords } =
		useWorkspaceApplicationInformationList(workspaceUuid);
	const parentApplication = applicationInformationRecords.find(
		(record) => record.uuid === applicationInformationUuid
	);
	const parentApplicationName = parentApplication
		? i18n?.resolvedLanguage?.startsWith("fr")
			? parentApplication.serviceNameFr
			: parentApplication.serviceNameEn
		: "";
	const { isSaving, isSubmitting, saveDraft, submit } =
		useWorkspaceRPRegistrationActions();
	const [failedSave, setFailedSave] = useState<FailedSave | null>(null);
	const [formDraft, setFormDraft] = useState<FormDraft | null>(null);
	const [requestError, setRequestError] = useState<Error | null>(null);
	const validationContextKey = `${draftKey}:${step}`;
	const pendingFieldErrorKeys = isRegistrationDataStep(step)
		? getPendingRegistrationValidation(draftKey, step)
		: {};
	const [clientFieldErrorState, setClientFieldErrorState] =
		useState<ClientFieldErrorState>({
			contextKey: validationContextKey,
			errors: pendingFieldErrorKeys,
		});
	const clientFieldErrorKeys =
		clientFieldErrorState.contextKey === validationContextKey
			? clientFieldErrorState.errors
			: pendingFieldErrorKeys;
	const replaceClientFieldErrorKeys = (
		errors: WorkspaceRPApplicationFieldErrorKeys
	): void => {
		setClientFieldErrorState({ contextKey: validationContextKey, errors });
	};
	const updateClientFieldErrorKeys = (
		update: (
			current: WorkspaceRPApplicationFieldErrorKeys
		) => WorkspaceRPApplicationFieldErrorKeys
	): void => {
		setClientFieldErrorState((current) => ({
			contextKey: validationContextKey,
			errors: update(
				current.contextKey === validationContextKey
					? current.errors
					: pendingFieldErrorKeys
			),
		}));
	};
	const [serverFieldErrors, setServerFieldErrors] = useState<
		Partial<Record<keyof WorkspaceRPApplicationFormState, true>>
	>({});
	const sourceVersion = draft?.registrationDraftVersion ?? -1;
	const form: WorkspaceRPApplicationFormState = {
		...createEmptyWorkspaceRPApplicationForm(),
		...(draft ? toWorkspaceRPApplicationDraftFormState(draft) : {}),
		...(formDraft?.sourceVersion === sourceVersion ? formDraft.values : {}),
	};
	const scopedForm: WorkspaceRPApplicationFormState = parentApplication
		? {
				...form,
				applicationInformationUuid,
				serviceNameEn: parentApplication.serviceNameEn,
				serviceNameFr: parentApplication.serviceNameFr,
			}
		: form;
	const isRenderedField = (
		field: keyof WorkspaceRPApplicationFormState
	): boolean =>
		!parentApplication ||
		(field !== "applicationInformationUuid" &&
			field !== "serviceNameEn" &&
			field !== "serviceNameFr");
	const isDirty = Boolean(
		formDraft?.sourceVersion === sourceVersion &&
		Object.keys(formDraft.values).length > 0
	);
	const previousStep = getPreviousWorkspaceRPRegistrationStep(step);
	const loadNoticeBase = getRequestErrorNotice(loadError, {
		bodyKey: "workspaces.registration.loadErrorBody",
		titleKey: "workspaces.registration.loadErrorTitle",
	});
	const loadNotice = loadNoticeBase
		? {
				...loadNoticeBase,
				bodyKey: "workspaces.registration.loadErrorBody",
				bodyText: undefined,
				titleKey: "workspaces.registration.loadErrorTitle",
			}
		: null;
	const saveNoticeBase = getRequestErrorNotice(requestError, {
		bodyKey: "workspaces.registration.saveErrorBody",
		titleKey: "workspaces.registration.saveErrorTitle",
	});
	const saveNotice = saveNoticeBase
		? {
				...saveNoticeBase,
				bodyKey: isConflictRequestError(requestError)
					? "workspaces.registration.conflictErrorBody"
					: "workspaces.registration.saveErrorBody",
				bodyText: undefined,
				titleKey: isConflictRequestError(requestError)
					? "workspaces.registration.conflictErrorTitle"
					: "workspaces.registration.saveErrorTitle",
			}
		: null;
	const errorNotice = saveNotice ?? loadNotice;
	const fieldErrors: Partial<
		Record<keyof WorkspaceRPApplicationFormState, string>
	> = {};
	const errorLinks: Record<string, string> = {};
	if (isRegistrationDataStep(step)) {
		for (const definition of WORKSPACE_RP_APPLICATION_FIELDS_BY_STEP[step]) {
			if (!isRenderedField(definition.field)) continue;
			const messageKey = clientFieldErrorKeys[definition.field];
			const message = messageKey
				? messageKey === "workspaces.registration.validationFieldMessage"
					? t(messageKey, { field: t(definition.labelKey) })
					: messageKey === "workspaces.applicationsValidationRequiredAnswers"
						? t("workspaces.registration.requiredFieldMessage", {
								field: t(definition.labelKey),
							})
						: t("workspaces.registration.fieldValidationMessage", {
								field: t(definition.labelKey),
								message: t(messageKey),
							})
				: serverFieldErrors[definition.field]
					? t("workspaces.registration.validationFieldMessage", {
							field: t(definition.labelKey),
						})
					: null;
			if (!message) continue;
			fieldErrors[definition.field] = message;
			errorLinks[`#${definition.controlId}`] = message;
		}
	}
	const showValidationSummary = Object.keys(errorLinks).length > 0;
	const pendingValidationSteps =
		getPendingRegistrationValidationSteps(draftKey);
	const pendingValidationStepKey = pendingValidationSteps.join(":");

	useBlocker({
		disabled: !isDirty,
		enableBeforeUnload: () => isDirty,
		shouldBlockFn: () => {
			if (consumePendingNavigationAllowance()) return false;
			return !window.confirm(
				t("workspaces.registration.discardChangesWarning")
			);
		},
	});

	useEffect(() => {
		if (!isDirty) return;
		return registerPendingNavigationGuard(() =>
			window.confirm(t("workspaces.registration.discardChangesWarning"))
		);
	}, [isDirty, t]);

	useEffect(() => {
		if (!draft) return;
		const currentPendingSteps = getPendingRegistrationValidationSteps(draftKey);
		let recoverable = getRecoverableWorkspaceRPRegistrationStep(
			step,
			draft.registrationLastCompletedStep ?? null
		);
		const earliestPendingStep = WORKSPACE_RP_REGISTRATION_STEPS.find(
			(candidate): candidate is (typeof currentPendingSteps)[number] =>
				candidate !== "review" && currentPendingSteps.includes(candidate)
		);
		if (
			earliestPendingStep &&
			WORKSPACE_RP_REGISTRATION_STEPS.indexOf(recoverable) >
				WORKSPACE_RP_REGISTRATION_STEPS.indexOf(earliestPendingStep)
		) {
			recoverable = earliestPendingStep;
		}
		if (recoverable !== step) {
			void navigate({
				href: registrationStepPath(recoverable),
				replace: true,
			});
		}
	}, [
		draft,
		draftKey,
		navigate,
		pendingValidationStepKey,
		registrationStepPath,
		step,
	]);

	const updateFormField = (
		field: keyof WorkspaceRPApplicationFormState,
		value: string | Array<string>
	): void => {
		setFailedSave(null);
		const nextForm = { ...scopedForm, [field]: value };
		updateClientFieldErrorKeys((current) => {
			if (!isRegistrationDataStep(step)) return current;
			const remainingErrors = getWorkspaceRPApplicationStepFieldErrorKeys(
				nextForm,
				step,
				validateWorkspaceRPApplicationStep(nextForm, step)
			);
			const next: WorkspaceRPApplicationFieldErrorKeys = {};
			for (const currentField of Object.keys(current)) {
				const typedField =
					currentField as keyof WorkspaceRPApplicationFormState;
				const currentMessageKey = remainingErrors[typedField];
				if (currentMessageKey) next[typedField] = currentMessageKey;
			}
			return next;
		});
		setServerFieldErrors((current) => {
			if (!current[field]) return current;
			const next = { ...current };
			delete next[field];
			return next;
		});
		setFormDraft((current) => ({
			sourceVersion,
			values: {
				...(current?.sourceVersion === sourceVersion ? current.values : {}),
				[field]: value,
			},
		}));
	};

	const persistStep = async (
		mode: "partial" | "completeStep",
		exitAfterSave: boolean
	): Promise<void> => {
		if (!draft || !isRegistrationDataStep(step)) return;
		setFailedSave(null);
		setRequestError(null);
		replaceClientFieldErrorKeys({});
		setServerFieldErrors({});
		if (mode === "completeStep") {
			const errors = validateWorkspaceRPApplicationStep(scopedForm, step);
			if (errors.length > 0) {
				replaceClientFieldErrorKeys(
					getWorkspaceRPApplicationStepFieldErrorKeys(scopedForm, step, errors)
				);
				return;
			}
		}
		try {
			const payload = {
				...(step === "basics"
					? {
							configurationName: scopedForm.configurationName,
							partnerEnvironment: scopedForm.partnerEnvironment,
						}
					: {}),
				expectedDraftVersion: draft.registrationDraftVersion,
				registrationAnswers: toWorkspaceRPApplicationRegistrationAnswers(
					scopedForm,
					step
				),
				saveMode: mode,
				stepId: step,
			} as const;
			const saved = await saveDraft(
				workspaceUuid,
				rpApplicationUuid,
				payload,
				applicationInformationUuid
			);
			clearPendingRegistrationValidationStep(draftKey, step);
			setFormDraft(null);
			const destination = exitAfterSave
				? configurationPath
				: registrationStepPath(getNextWorkspaceRPRegistrationStep(step));
			const clearNavigationAllowance = allowNextPendingNavigation();
			try {
				await navigate({ href: destination });
			} finally {
				clearNavigationAllowance();
			}
			void saved;
		} catch (error) {
			setFailedSave({ exitAfterSave, mode });
			const requestFailure = error as Error;
			if (isWorkspaceRPRegistrationValidationError(requestFailure)) {
				const stepFields = new Set(
					WORKSPACE_RP_APPLICATION_FIELDS_BY_STEP[step]
						.filter((definition) => isRenderedField(definition.field))
						.map((definition) => definition.field)
				);
				const mappedErrors: Partial<
					Record<keyof WorkspaceRPApplicationFormState, true>
				> = {};
				for (const fieldName of getWorkspaceRPRegistrationValidationFieldNames(
					requestFailure
				)) {
					const field = fieldName as keyof WorkspaceRPApplicationFormState;
					if (stepFields.has(field)) mappedErrors[field] = true;
				}
				if (Object.keys(mappedErrors).length > 0) {
					setServerFieldErrors(mappedErrors);
					return;
				}
			}
			setRequestError(requestFailure);
		}
	};

	const reloadConflict = async (): Promise<void> => {
		const unsavedValues =
			formDraft?.sourceVersion === sourceVersion ? formDraft.values : null;
		const refreshedDraft = await refetch();
		if (!refreshedDraft) return;
		if (unsavedValues && Object.keys(unsavedValues).length > 0) {
			setFormDraft({
				sourceVersion: refreshedDraft.registrationDraftVersion,
				values: unsavedValues,
			});
		}
		setRequestError(null);
	};

	const handleSubmit = async (): Promise<void> => {
		if (!draft) return;
		setRequestError(null);
		const pendingValidation: Partial<
			Record<RegistrationDataStep, WorkspaceRPApplicationFieldErrorKeys>
		> = {};
		for (const dataStep of WORKSPACE_RP_REGISTRATION_STEPS.filter(
			(candidate): candidate is RegistrationDataStep => candidate !== "review"
		)) {
			const errors = validateWorkspaceRPApplicationStep(scopedForm, dataStep);
			const fieldErrorKeys = getWorkspaceRPApplicationStepFieldErrorKeys(
				scopedForm,
				dataStep,
				errors
			);
			if (Object.keys(fieldErrorKeys).length > 0) {
				pendingValidation[dataStep] = fieldErrorKeys;
			}
		}
		const earliestInvalidStep = WORKSPACE_RP_REGISTRATION_STEPS.find(
			(candidate): candidate is RegistrationDataStep =>
				candidate !== "review" && pendingValidation[candidate] !== undefined
		);
		if (earliestInvalidStep) {
			setPendingRegistrationValidation(draftKey, pendingValidation);
			await navigate({
				href: registrationStepPath(earliestInvalidStep),
				replace: true,
			});
			return;
		}
		try {
			await submit(
				workspaceUuid,
				rpApplicationUuid,
				draft.registrationDraftVersion,
				applicationInformationUuid
			);
			await navigate({
				href: registrationStepPath("confirmation"),
				replace: true,
			});
		} catch (error) {
			const requestFailure = error as Error;
			if (isWorkspaceRPRegistrationValidationError(requestFailure)) {
				const serverValidation: Partial<
					Record<RegistrationDataStep, WorkspaceRPApplicationFieldErrorKeys>
				> = {};
				for (const fieldName of getWorkspaceRPRegistrationValidationFieldNames(
					requestFailure
				)) {
					for (const dataStep of WORKSPACE_RP_REGISTRATION_STEPS.filter(
						(candidate): candidate is RegistrationDataStep =>
							candidate !== "review"
					)) {
						if (
							WORKSPACE_RP_APPLICATION_FIELDS_BY_STEP[dataStep].some(
								(definition) =>
									definition.field === fieldName &&
									isRenderedField(definition.field)
							)
						) {
							serverValidation[dataStep] = {
								...(serverValidation[dataStep] ?? {}),
								[fieldName]: "workspaces.registration.validationFieldMessage",
							};
						}
					}
				}
				const firstServerInvalidStep = WORKSPACE_RP_REGISTRATION_STEPS.find(
					(candidate): candidate is RegistrationDataStep =>
						candidate !== "review" && serverValidation[candidate] !== undefined
				);
				if (firstServerInvalidStep) {
					setPendingRegistrationValidation(draftKey, serverValidation);
					await navigate({
						href: registrationStepPath(firstServerInvalidStep),
						replace: true,
					});
					return;
				}
			}
			setRequestError(requestFailure);
		}
	};

	const navigateAway = (href: string): void => {
		void navigate({ href });
	};

	return (
		<>
			<Heading tag="h1">
				{t("workspaces.registration.pageTitle", {
					step: t(WORKSPACE_RP_REGISTRATION_STEP_LABEL_KEYS[step]),
				})}
			</Heading>
			{draft ? (
				<WorkspaceRPRegistrationNavigation
					currentStep={step}
					lastCompletedStep={draft.registrationLastCompletedStep ?? null}
					pendingSteps={pendingValidationSteps}
					stepPath={registrationStepPath}
					onNavigate={(targetStep) => {
						navigateAway(registrationStepPath(targetStep));
					}}
				/>
			) : null}

			{isLoading ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("workspaces.registration.loadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.registration.loadingBody")}</Text>
				</Notice>
			) : null}

			{errorNotice ? (
				<Notice
					noticeRole={errorNotice.noticeRole}
					noticeTitle={t(errorNotice.titleKey)}
					noticeTitleTag="h2"
				>
					<Text>{errorNotice.bodyText ?? t(errorNotice.bodyKey)}</Text>
					<Button
						type="button"
						onGcdsClick={() => {
							if (isConflictRequestError(requestError)) {
								void reloadConflict();
							} else if (saveNotice && failedSave) {
								void persistStep(failedSave.mode, failedSave.exitAfterSave);
							} else {
								void refetch();
							}
						}}
					>
						{t(
							isConflictRequestError(requestError)
								? "workspaces.registration.reloadAction"
								: saveNotice
									? "workspaces.registration.retrySaveAction"
									: "workspaces.registration.retryLoadAction"
						)}
					</Button>
				</Notice>
			) : null}

			{draft && isRegistrationDataStep(step) ? (
				<WorkspaceRPApplicationForm
					applicationContextName={parentApplicationName || undefined}
					cancelHref={configurationPath}
					fieldErrors={fieldErrors}
					form={scopedForm}
					isSubmitting={isSaving}
					saveAndExitLabel={t("workspaces.registration.saveAndExitAction")}
					step={step}
					applicationInformationOptions={applicationInformationRecords.map(
						(record) => ({ label: record.serviceNameEn, value: record.uuid })
					)}
					backHref={
						previousStep ? registrationStepPath(previousStep) : undefined
					}
					errorSummary={
							showValidationSummary ? (
								<ErrorSummary
									focusOnRender
									errorLinks={errorLinks}
									heading={t("workspaces.registration.validationSummaryHeading")}
									listen={false}
								/>
						) : undefined
					}
					submitLabel={
						isSaving
							? t("workspaces.applicationsSavingAction")
							: t("workspaces.registration.continueAction")
					}
					onChange={updateFormField}
					onSaveAndExit={() => void persistStep("partial", true)}
					onSubmit={() => void persistStep("completeStep", false)}
					onBack={
						previousStep
							? (): void => {
									navigateAway(registrationStepPath(previousStep));
								}
							: undefined
					}
					onCancel={(): void => {
						navigateAway(configurationPath);
					}}
				/>
			) : null}

			{draft && step === "review" ? (
				<div className="grid gap-400">
					<Text>{t("workspaces.registration.reviewSummary")}</Text>
					{applicationInformationUuid ? (
						<dl className="grid gap-200">
							<div>
								<dt className="font-semibold">
									{t("workspaces.rpConfigurationsApplicationLabel")}
								</dt>
								<dd>{parentApplicationName}</dd>
							</div>
							<div>
								<dt className="font-semibold">
									{t("workspaces.applicationsConfigurationNameLabel")}
								</dt>
								<dd>{draft.configurationName}</dd>
							</div>
						</dl>
					) : null}
					{REVIEW_GROUPS.map((group) => (
						<section key={group.step} className="grid gap-200">
							<div className="flex flex-wrap items-center justify-between gap-200">
								<Heading tag="h2">
									{t(WORKSPACE_RP_REGISTRATION_STEP_LABEL_KEYS[group.step])}
								</Heading>
								<Button
									buttonRole="secondary"
									href={registrationStepPath(group.step)}
									type="link"
								>
									{t("workspaces.registration.changeAction", {
										section: t(
											WORKSPACE_RP_REGISTRATION_STEP_LABEL_KEYS[group.step]
										),
									})}
								</Button>
							</div>
							<dl className="grid gap-200">
								{group.fields
									.filter(
										(field) =>
											!applicationInformationUuid ||
											(field !== "serviceNameEn" && field !== "serviceNameFr")
									)
									.map((field) => (
										<div key={field}>
											<dt className="font-semibold">
												{t(REVIEW_FIELD_LABEL_KEYS[field] ?? field)}
											</dt>
											<dd>
												{displayReviewValue(
													draft.registrationAnswers[field],
													t("workspaces.optionYes"),
													t("workspaces.optionNo"),
													t("workspaces.registration.notProvided")
												)}
											</dd>
										</div>
									))}
							</dl>
						</section>
					))}
					<Notice
						noticeRole="info"
						noticeTitle={t("workspaces.registration.submitNoticeTitle")}
						noticeTitleTag="h2"
					>
						<Text>{t("workspaces.registration.submitNoticeBody")}</Text>
					</Notice>
					<div className="flex flex-wrap gap-200">
						<Button
							disabled={isSubmitting}
							type="button"
							onGcdsClick={() => void handleSubmit()}
						>
							{isSubmitting
								? t("workspaces.registration.submittingAction")
								: t("workspaces.registration.submitAction")}
						</Button>
						<Button
							buttonRole="secondary"
							href={registrationStepPath("encryption")}
							type="link"
						>
							{t("workspaces.registration.backAction")}
						</Button>
					</div>
				</div>
			) : null}
		</>
	);
};
