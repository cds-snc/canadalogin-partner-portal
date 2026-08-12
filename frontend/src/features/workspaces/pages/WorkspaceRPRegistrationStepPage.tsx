import { useEffect, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, ErrorSummary, Heading, Notice, Text } from "@/components/ui";
import {
	getRequestErrorNotice,
	isBadRequestError,
	isConflictRequestError,
} from "@/fetch";
import {
	getWorkspaceRPRegistrationValidationFieldNames,
	isWorkspaceRPRegistrationValidationError,
	type WorkspaceRPApplicationRegistrationAnswers,
} from "@/fetch/rp-applications";
import { WorkspaceRPApplicationForm } from "../components/WorkspaceRPApplicationForm";
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
	validateWorkspaceRPApplicationForm,
	validateWorkspaceRPApplicationStep,
	type WorkspaceRPApplicationFormState,
	type WorkspaceRPApplicationValidationMessageKey,
} from "../workspace-rp-application-form";
import {
	getNextWorkspaceRPRegistrationStep,
	getPreviousWorkspaceRPRegistrationStep,
	getRecoverableWorkspaceRPRegistrationStep,
	getWorkspaceRPRegistrationStepPath,
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

const ENDPOINT_CONTROL_IDS: Partial<
	Record<keyof WorkspaceRPApplicationFormState, string>
> = {
	applicationEnvironmentUrlEn: "workspace-rp-application-url-en",
	applicationEnvironmentUrlFr: "workspace-rp-application-url-fr",
	logoutMode: "logoutMode",
	logoutUri: "workspace-rp-application-logout-uri",
	postLogoutRedirectUris: "workspace-rp-application-post-logout-redirect-uris",
	redirectUris: "workspace-rp-application-redirect-uris",
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
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const navigate = useNavigate();
	const {
		rpApplicationUuid,
		step: routeStep,
		workspaceUuid,
	} = useParams({
		from: "/workspaces/$workspaceUuid/applications/$rpApplicationUuid/registration/$step",
	});
	const step = isWorkspaceRPRegistrationStep(routeStep) ? routeStep : "basics";
	const {
		draft,
		error: loadError,
		isLoading,
		refetch,
	} = useWorkspaceRPRegistrationDraft(workspaceUuid, rpApplicationUuid);
	const { applicationInformationRecords } =
		useWorkspaceApplicationInformationList(workspaceUuid);
	const { isSaving, isSubmitting, saveDraft, submit } =
		useWorkspaceRPRegistrationActions();
	const [failedSave, setFailedSave] = useState<FailedSave | null>(null);
	const [formDraft, setFormDraft] = useState<FormDraft | null>(null);
	const [requestError, setRequestError] = useState<Error | null>(null);
	const [validationMessageKeys, setValidationMessageKeys] = useState<
		Array<WorkspaceRPApplicationValidationMessageKey>
	>([]);
	const sourceVersion = draft?.registrationDraftVersion ?? -1;
	const form: WorkspaceRPApplicationFormState = {
		...createEmptyWorkspaceRPApplicationForm(),
		...(draft ? toWorkspaceRPApplicationDraftFormState(draft) : {}),
		...(formDraft?.sourceVersion === sourceVersion ? formDraft.values : {}),
	};
	const isDirty = Boolean(
		formDraft?.sourceVersion === sourceVersion &&
		Object.keys(formDraft.values).length > 0
	);
	const currentIndex = WORKSPACE_RP_REGISTRATION_STEPS.indexOf(step) + 1;
	const previousStep = getPreviousWorkspaceRPRegistrationStep(step);
	const isRequestValidationError =
		isWorkspaceRPRegistrationValidationError(requestError) ||
		isBadRequestError(requestError);
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
	const saveNoticeBase = getRequestErrorNotice(
		isRequestValidationError ? null : requestError,
		{
			bodyKey: "workspaces.registration.saveErrorBody",
			titleKey: "workspaces.registration.saveErrorTitle",
		}
	);
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
	const fieldErrorKeys = isRegistrationDataStep(step)
		? getWorkspaceRPApplicationStepFieldErrorKeys(
				form,
				step,
				validationMessageKeys
			)
		: {};
	const fieldErrors: Partial<
		Record<keyof WorkspaceRPApplicationFormState, string>
	> = {};
	for (const [field, messageKey] of Object.entries(fieldErrorKeys)) {
		if (messageKey) {
			fieldErrors[field as keyof WorkspaceRPApplicationFormState] =
				t(messageKey);
		}
	}
	if (isWorkspaceRPRegistrationValidationError(requestError)) {
		for (const fieldName of getWorkspaceRPRegistrationValidationFieldNames(
			requestError
		)) {
			if (fieldName in ENDPOINT_CONTROL_IDS) {
				fieldErrors[fieldName as keyof WorkspaceRPApplicationFormState] = t(
					"workspaces.registration.validationFieldMessage"
				);
			}
		}
	}
	const endpointErrorLinks: Record<string, string> = {};
	if (step === "endpoints") {
		for (const [field, message] of Object.entries(fieldErrors)) {
			const controlId =
				ENDPOINT_CONTROL_IDS[field as keyof WorkspaceRPApplicationFormState];
			if (controlId && message) endpointErrorLinks[`#${controlId}`] = message;
		}
		if (
			isRequestValidationError &&
			Object.keys(endpointErrorLinks).length === 0
		) {
			endpointErrorLinks["#workspace-rp-application-url-en"] = t(
				"workspaces.registration.validationGeneralMessage"
			);
		}
	}
	const showValidationSummary =
		validationMessageKeys.length > 0 || isRequestValidationError;

	useEffect(() => {
		const warnBeforeUnload = (event: BeforeUnloadEvent): void => {
			if (isDirty) event.preventDefault();
		};
		window.addEventListener("beforeunload", warnBeforeUnload);
		return (): void => {
			window.removeEventListener("beforeunload", warnBeforeUnload);
		};
	}, [isDirty]);

	useEffect(() => {
		if (!draft) return;
		const recoverable = getRecoverableWorkspaceRPRegistrationStep(
			step,
			draft.registrationLastCompletedStep ?? null
		);
		if (recoverable !== step) {
			void navigate({
				href: getWorkspaceRPRegistrationStepPath(
					workspaceUuid,
					rpApplicationUuid,
					recoverable
				),
				replace: true,
			});
		}
	}, [draft, navigate, rpApplicationUuid, step, workspaceUuid]);

	const updateFormField = (
		field: keyof WorkspaceRPApplicationFormState,
		value: string | Array<string>
	): void => {
		setFailedSave(null);
		setRequestError(null);
		setValidationMessageKeys([]);
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
		if (mode === "completeStep") {
			const errors = validateWorkspaceRPApplicationStep(form, step);
			if (errors.length > 0) {
				setValidationMessageKeys(errors);
				return;
			}
		}
		try {
			const saved = await saveDraft(workspaceUuid, rpApplicationUuid, {
				expectedDraftVersion: draft.registrationDraftVersion,
				registrationAnswers: toWorkspaceRPApplicationRegistrationAnswers(
					form,
					step
				),
				saveMode: mode,
				stepId: step,
			});
			setFormDraft(null);
			const destination = exitAfterSave
				? `/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(rpApplicationUuid)}`
				: getWorkspaceRPRegistrationStepPath(
						workspaceUuid,
						rpApplicationUuid,
						getNextWorkspaceRPRegistrationStep(step)
					);
			await navigate({ href: destination });
			void saved;
		} catch (error) {
			setFailedSave({ exitAfterSave, mode });
			setRequestError(error as Error);
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
		const validationErrors = validateWorkspaceRPApplicationForm(form);
		if (validationErrors.length > 0) {
			setValidationMessageKeys(validationErrors);
			return;
		}
		try {
			await submit(
				workspaceUuid,
				rpApplicationUuid,
				draft.registrationDraftVersion
			);
			await navigate({
				href: getWorkspaceRPRegistrationStepPath(
					workspaceUuid,
					rpApplicationUuid,
					"confirmation"
				),
				replace: true,
			});
		} catch (error) {
			setRequestError(error as Error);
		}
	};

	const navigateAway = (href: string, discardUnsaved: boolean): void => {
		if (
			discardUnsaved &&
			isDirty &&
			!window.confirm(t("workspaces.registration.discardChangesWarning"))
		) {
			return;
		}
		if (discardUnsaved) setFormDraft(null);
		void navigate({ href });
	};

	return (
		<>
			<Heading tag="h1">
				{t("workspaces.registration.pageTitle", {
					step: t(WORKSPACE_RP_REGISTRATION_STEP_LABEL_KEYS[step]),
				})}
			</Heading>
			<Text>
				{t("workspaces.registration.stepCount", {
					current: currentIndex,
					total: WORKSPACE_RP_REGISTRATION_STEPS.length,
				})}
			</Text>

			{showValidationSummary ? (
				step === "endpoints" ? (
					<ErrorSummary
						focusOnRender
						errorLinks={endpointErrorLinks}
						heading={t("workspaces.registration.validationSummaryHeading")}
						listen={false}
					/>
				) : (
					<ErrorSummary listen />
				)
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
					cancelHref={`/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(rpApplicationUuid)}`}
					fieldErrors={fieldErrors}
					form={form}
					isSubmitting={isSaving}
					saveAndExitLabel={t("workspaces.registration.saveAndExitAction")}
					step={step}
					applicationInformationOptions={applicationInformationRecords.map(
						(record) => ({ label: record.serviceNameEn, value: record.uuid })
					)}
					backHref={
						previousStep
							? getWorkspaceRPRegistrationStepPath(
									workspaceUuid,
									rpApplicationUuid,
									previousStep
								)
							: undefined
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
									navigateAway(
										getWorkspaceRPRegistrationStepPath(
											workspaceUuid,
											rpApplicationUuid,
											previousStep
										),
										false
									);
								}
							: undefined
					}
					onCancel={(): void => {
						navigateAway(
							`/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(rpApplicationUuid)}`,
							true
						);
					}}
				/>
			) : null}

			{draft && step === "review" ? (
				<div className="grid gap-400">
					<Text>{t("workspaces.registration.reviewSummary")}</Text>
					{REVIEW_GROUPS.map((group) => (
						<section key={group.step} className="grid gap-200">
							<div className="flex flex-wrap items-center justify-between gap-200">
								<Heading tag="h2">
									{t(WORKSPACE_RP_REGISTRATION_STEP_LABEL_KEYS[group.step])}
								</Heading>
								<Button
									buttonRole="secondary"
									type="link"
									href={getWorkspaceRPRegistrationStepPath(
										workspaceUuid,
										rpApplicationUuid,
										group.step
									)}
								>
									{t("workspaces.registration.changeAction", {
										section: t(
											WORKSPACE_RP_REGISTRATION_STEP_LABEL_KEYS[group.step]
										),
									})}
								</Button>
							</div>
							<dl className="grid gap-200">
								{group.fields.map((field) => (
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
							type="link"
							href={getWorkspaceRPRegistrationStepPath(
								workspaceUuid,
								rpApplicationUuid,
								"encryption"
							)}
						>
							{t("workspaces.registration.backAction")}
						</Button>
					</div>
				</div>
			) : null}
		</>
	);
};
