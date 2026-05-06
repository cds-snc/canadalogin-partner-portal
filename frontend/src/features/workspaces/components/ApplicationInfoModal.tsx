import { useEffect, useState, type FormEvent, type ReactElement } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import type { CheckboxInputEvent } from "@/components/ui/Checkboxes";
import {
	Button,
	Checkboxes,
	Fieldset,
	Input,
	Modal,
	Select,
	Stepper,
	Textarea,
} from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { getRequestErrorMessage } from "@/fetch";
import {
	AUTHENTICATION_PROTOCOL_OPTIONS,
	CONSOLIDATOR_OPTIONS,
	CURRENT_MFA_OPTIONS,
	CURRENT_SIGN_IN_OPTIONS,
	IDENTITY_PROOFING_OPTIONS,
	translateApplicationInfoEnumValue,
	translateApplicationInfoEnumValues,
	type AuthenticationProtocolValue,
	type ConsolidatorUsedValue,
	type CurrentMfaOptionValue,
	type CurrentSignInOptionValue,
	type IdentityProofingMethodValue,
	normalizeApplicationInfoEnumValue,
	normalizeApplicationInfoEnumValues,
	PERSONAL_INFORMATION_OPTIONS,
	type PersonalInformationValue,
	type UserTypeValue,
	USER_TYPE_OPTIONS,
} from "@/features/workspaces/application-info-options";
import {
	createWorkspaceApplicationInfo,
	type ApplicationInfoCreate,
	type ApplicationInfoRead,
	updateWorkspaceApplicationInfo,
	workspaceApplicationInfoQueryKey,
} from "@/fetch/application-info";

type ApplicationInfoModalProps = {
	applicationInfo?: ApplicationInfoRead | null;
	isOpen: boolean;
	mode?: "create" | "edit";
	onClose: () => void;
	onSaved: () => Promise<void> | void;
	organizationLabel?: string;
	workspaceUuid: string;
};

type ApplicationInfoFormState = {
	aboutApplication: string;
	applicationDescription: string;
	applicationName: string;
	applicationUrl: string;
	authorityToCollectPersonalInformation: string;
	authenticationProtocol: AuthenticationProtocolValue;
	consolidatorUsed: ConsolidatorUsedValue;
	credentialAssuranceLevel: string;
	currentMfaOptions: CurrentMfaOptionValue;
	currentSignInOptions: Array<CurrentSignInOptionValue>;
	currentSignInOptionsOther: string;
	hasAccessManagementLayer: boolean;
	hasAccountRecovery: boolean;
	hasPrivacyNotice: boolean;
	identityAssuranceLevel: string;
	identityProofingMethod: IdentityProofingMethodValue | "";
	identityProofingMethodOther: string;
	isCbas: boolean;
	migrationRationale: string;
	monthlyActiveUsers: string;
	peakUsagePeriods: string;
	personalInformationCollected: Array<PersonalInformationValue>;
	personalInformationOther: string;
	plannedOidcImplementationDate: string;
	portalName: string;
	programLineOfBusiness: string;
	requestsProfileDataPushes: boolean;
	rollbackStrategy: string;
	scheduleBlackoutPeriods: string;
	techStack: string;
	technology: string;
	transitionMitigations: string;
	transitionRisks: string;
	userTypeOther: string;
	userTypes: Array<UserTypeValue>;
	usesCanadaloginMigration: boolean;
};

type CheckboxOption = {
	labelKey: string;
	value: string;
};

const totalSteps = 6;

type ReviewItem = {
	label: string;
	value: string | null | undefined;
};

type ReviewSection = {
	items: Array<ReviewItem>;
	title: string;
};

const normalizeStringValue = (value: string | null | undefined): string =>
	value ?? "";

const emptyForm = (): ApplicationInfoFormState => ({
	aboutApplication: "",
	applicationDescription: "",
	applicationName: "",
	applicationUrl: "",
	authorityToCollectPersonalInformation: "",
	authenticationProtocol: "OIDC",
	consolidatorUsed: "NONE",
	credentialAssuranceLevel: "",
	currentMfaOptions: "NONE",
	currentSignInOptions: [],
	currentSignInOptionsOther: "",
	hasAccessManagementLayer: false,
	hasAccountRecovery: false,
	hasPrivacyNotice: false,
	identityAssuranceLevel: "",
	identityProofingMethod: "",
	identityProofingMethodOther: "",
	isCbas: false,
	migrationRationale: "",
	monthlyActiveUsers: "",
	peakUsagePeriods: "",
	personalInformationCollected: [],
	personalInformationOther: "",
	plannedOidcImplementationDate: "",
	portalName: "",
	programLineOfBusiness: "",
	requestsProfileDataPushes: false,
	rollbackStrategy: "",
	scheduleBlackoutPeriods: "",
	techStack: "",
	technology: "",
	transitionMitigations: "",
	transitionRisks: "",
	userTypeOther: "",
	userTypes: [],
	usesCanadaloginMigration: false,
});

const getApplicationInfoForm = (
	applicationInfo: ApplicationInfoRead | null | undefined
): ApplicationInfoFormState => {
	if (!applicationInfo) {
		return emptyForm();
	}

	return {
		aboutApplication: normalizeStringValue(applicationInfo.aboutApplication),
		applicationDescription: normalizeStringValue(
			applicationInfo.applicationDescription
		),
		applicationName: normalizeStringValue(applicationInfo.applicationName),
		applicationUrl: normalizeStringValue(applicationInfo.applicationUrl),
		authorityToCollectPersonalInformation: normalizeStringValue(
			applicationInfo.authorityToCollectPersonalInformation
		),
		authenticationProtocol: normalizeApplicationInfoEnumValue(
			applicationInfo.authenticationProtocol
		) as AuthenticationProtocolValue,
		consolidatorUsed: (
			normalizeApplicationInfoEnumValue(applicationInfo.consolidatorUsed) ||
			"NONE") as ConsolidatorUsedValue,
		credentialAssuranceLevel: normalizeStringValue(
			applicationInfo.credentialAssuranceLevel
		),
		currentMfaOptions: (
			normalizeApplicationInfoEnumValue(applicationInfo.currentMfaOptions) ||
			"NONE") as CurrentMfaOptionValue,
		currentSignInOptions: normalizeApplicationInfoEnumValues(
			applicationInfo.currentSignInOptions
		) as Array<CurrentSignInOptionValue>,
		currentSignInOptionsOther:
			applicationInfo.currentSignInOptionsOther ?? "",
		hasAccessManagementLayer: applicationInfo.hasAccessManagementLayer,
		hasAccountRecovery: applicationInfo.hasAccountRecovery,
		hasPrivacyNotice: applicationInfo.hasPrivacyNotice,
		identityAssuranceLevel: normalizeStringValue(
			applicationInfo.identityAssuranceLevel
		),
		identityProofingMethod: normalizeApplicationInfoEnumValue(
			applicationInfo.identityProofingMethod
		) as IdentityProofingMethodValue | "",
		identityProofingMethodOther:
			applicationInfo.identityProofingMethodOther ?? "",
		isCbas: applicationInfo.isCbas,
		migrationRationale: applicationInfo.migrationRationale ?? "",
		monthlyActiveUsers:
			applicationInfo.monthlyActiveUsers !== null &&
			applicationInfo.monthlyActiveUsers !== undefined
				? String(applicationInfo.monthlyActiveUsers)
				: "",
		peakUsagePeriods: applicationInfo.peakUsagePeriods ?? "",
		personalInformationCollected: normalizeApplicationInfoEnumValues(
			applicationInfo.personalInformationCollected
		) as Array<PersonalInformationValue>,
		personalInformationOther: applicationInfo.personalInformationOther ?? "",
		plannedOidcImplementationDate:
			applicationInfo.plannedOidcImplementationDate ?? "",
		portalName: applicationInfo.portalName ?? "",
		programLineOfBusiness: normalizeStringValue(
			applicationInfo.programLineOfBusiness
		),
		requestsProfileDataPushes: applicationInfo.requestsProfileDataPushes,
		rollbackStrategy: normalizeStringValue(applicationInfo.rollbackStrategy),
		scheduleBlackoutPeriods: applicationInfo.scheduleBlackoutPeriods ?? "",
		techStack: normalizeStringValue(applicationInfo.techStack),
		technology: normalizeStringValue(applicationInfo.technology),
		transitionMitigations: applicationInfo.transitionMitigations ?? "",
		transitionRisks: applicationInfo.transitionRisks ?? "",
		userTypeOther: applicationInfo.userTypeOther ?? "",
		userTypes: normalizeApplicationInfoEnumValues(
			applicationInfo.userTypes
		) as Array<UserTypeValue>,
		usesCanadaloginMigration: applicationInfo.usesCanadaloginMigration,
	};
};

const buildCheckboxOptions = (
	options: ReadonlyArray<CheckboxOption>,
	selectedValues: Array<string>,
	t: (key: string) => string,
	prefix: string
): Array<{ checked: boolean; id: string; label: string; value: string }> =>
	options.map((option) => ({
		checked: selectedValues.includes(option.value),
		id: `${prefix}-${option.value.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
		label: t(option.labelKey),
		value: option.value,
	}));

const hasContent = (value: string | null | undefined): boolean =>
	(value ?? "").trim().length > 0;

const normalizeOptional = (value: string): string | undefined => {
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
};

const getDisplayValue = (value: string | null | undefined): string => {
	if (!value || value.trim().length === 0) {
		return "-";
	}

	return value;
};

const getBooleanDisplayValue = (
	value: boolean,
	t: (key: string) => string
): string => t(value ? "workspaces.optionYes" : "workspaces.optionNo");

const buildPayload = (form: ApplicationInfoFormState): ApplicationInfoCreate => ({
	aboutApplication: form.aboutApplication.trim(),
	applicationDescription: form.applicationDescription.trim(),
	applicationName: form.applicationName.trim(),
	applicationUrl: form.applicationUrl.trim(),
	authorityToCollectPersonalInformation:
		form.authorityToCollectPersonalInformation.trim(),
	authenticationProtocol: form.authenticationProtocol,
	consolidatorUsed: form.consolidatorUsed,
	credentialAssuranceLevel: form.credentialAssuranceLevel.trim(),
	currentMfaOptions: form.currentMfaOptions,
	currentSignInOptions: form.currentSignInOptions,
	currentSignInOptionsOther: normalizeOptional(form.currentSignInOptionsOther),
	hasAccessManagementLayer: form.hasAccessManagementLayer,
	hasAccountRecovery: form.hasAccountRecovery,
	hasPrivacyNotice: form.hasPrivacyNotice,
	identityAssuranceLevel: form.identityAssuranceLevel.trim(),
	identityProofingMethod:
		form.identityProofingMethod as IdentityProofingMethodValue,
	identityProofingMethodOther: normalizeOptional(
		form.identityProofingMethodOther
	),
	isCbas: form.isCbas,
	migrationRationale: normalizeOptional(form.migrationRationale),
	monthlyActiveUsers: form.monthlyActiveUsers
		? Number(form.monthlyActiveUsers)
		: undefined,
	peakUsagePeriods: normalizeOptional(form.peakUsagePeriods),
	personalInformationCollected: form.personalInformationCollected,
	personalInformationOther: normalizeOptional(form.personalInformationOther),
	plannedOidcImplementationDate: normalizeOptional(
		form.plannedOidcImplementationDate
	),
	portalName: normalizeOptional(form.portalName),
	programLineOfBusiness: form.programLineOfBusiness.trim(),
	requestsProfileDataPushes: form.requestsProfileDataPushes,
	rollbackStrategy: form.rollbackStrategy.trim(),
	scheduleBlackoutPeriods: normalizeOptional(form.scheduleBlackoutPeriods),
	techStack: form.techStack.trim(),
	technology: form.technology.trim(),
	transitionMitigations: normalizeOptional(form.transitionMitigations),
	transitionRisks: normalizeOptional(form.transitionRisks),
	userTypeOther: normalizeOptional(form.userTypeOther),
	userTypes: form.userTypes,
	usesCanadaloginMigration: form.usesCanadaloginMigration,
});

const isStepValid = (
	currentStep: number,
	form: ApplicationInfoFormState
): boolean => {
	switch (currentStep) {
		case 1:
			return [
				form.applicationName,
				form.aboutApplication,
				form.programLineOfBusiness,
				form.applicationUrl,
				form.applicationDescription,
			].every((value) => hasContent(value));
		case 2:
			return [
				form.technology,
				form.authenticationProtocol,
				form.techStack,
				form.rollbackStrategy,
			].every((value) => hasContent(value));
		case 3:
			return [
				form.credentialAssuranceLevel,
				form.identityAssuranceLevel,
				form.identityProofingMethod,
				form.authorityToCollectPersonalInformation,
			].every((value) => hasContent(value)) &&
				(form.identityProofingMethod !== "OTHER" ||
					hasContent(form.identityProofingMethodOther));
		default:
			return true;
	}
};

export const ApplicationInfoModal = ({
	applicationInfo,
	isOpen,
	mode = "create",
	onClose,
	onSaved,
	organizationLabel,
	workspaceUuid,
}: ApplicationInfoModalProps): FunctionComponent => {
	const { t } = useTranslation() as unknown as {
		t: (key: string) => string;
	};
	const toast = useToast();
	const queryClient = useQueryClient();
	const [form, setForm] = useState<ApplicationInfoFormState>(emptyForm());
	const [currentStep, setCurrentStep] = useState(1);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (!isOpen) {
			setForm(emptyForm());
			setCurrentStep(1);
			return;
		}

		setForm(getApplicationInfoForm(mode === "edit" ? applicationInfo : null));
		setCurrentStep(1);
	}, [applicationInfo, isOpen, mode]);

	const isEditMode = mode === "edit" && !!applicationInfo;

	const handleBooleanInput =
		(field: keyof ApplicationInfoFormState) =>
		(event: FormEvent<HTMLSelectElement>): void => {
			setForm((current) => ({
				...current,
				[field]: (event.target as HTMLSelectElement).value === "true",
			}));
		};

	const handleTextInput =
		(field: keyof ApplicationInfoFormState) =>
		(
			event: FormEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
		): void => {
			setForm((current) => ({
				...current,
				[field]: (
					event.target as
						| HTMLInputElement
						| HTMLTextAreaElement
						| HTMLSelectElement
				).value,
			}));
		};

	const handleCheckboxInput =
		(
			field:
				| "currentSignInOptions"
				| "personalInformationCollected"
				| "userTypes"
		) =>
		(event: CheckboxInputEvent): void => {
			const nextValue = event.target.value;
			setForm((current) => ({
				...current,
				[field]: nextValue,
			}));
		};

	const stepTitleKeys = [
		"workspaces.appInfoStepAbout",
		"workspaces.appInfoStepTechnology",
		"workspaces.appInfoStepSecurity",
		"workspaces.appInfoStepUsage",
		"workspaces.appInfoStepTransition",
		"workspaces.appInfoStepReview",
	] as const;

	const canContinue = isStepValid(currentStep, form);

	const renderAboutStep = (): ReactElement => (
		<div className="flex flex-col gap-4">
			{organizationLabel ? (
				<Select
					label={t("workspaces.appInfoOrganizationLabel")}
					name="organization"
					selectId="app-info-organization"
					value={organizationLabel}
				>
					<option value={organizationLabel}>{organizationLabel}</option>
				</Select>
			) : null}
			<Input
				required
				inputId="app-info-name"
				label={t("workspaces.appInfoApplicationNameLabel")}
				name="application_name"
				value={form.applicationName}
				onInput={handleTextInput("applicationName")}
			/>
			<Textarea
				required
				label={t("workspaces.appInfoAboutLabel")}
				name="about_application"
				textareaId="app-info-about"
				value={form.aboutApplication}
				onInput={handleTextInput("aboutApplication")}
			/>
			<Input
				required
				inputId="app-info-program"
				label={t("workspaces.appInfoProgramLineOfBusinessLabel")}
				name="program_line_of_business"
				value={form.programLineOfBusiness}
				onInput={handleTextInput("programLineOfBusiness")}
			/>
			<Input
				required
				inputId="app-info-url"
				label={t("workspaces.appInfoApplicationUrlLabel")}
				name="application_url"
				value={form.applicationUrl}
				onInput={handleTextInput("applicationUrl")}
			/>
			<Textarea
				required
				label={t("workspaces.appInfoApplicationDescriptionLabel")}
				name="application_description"
				textareaId="app-info-description"
				value={form.applicationDescription}
				onInput={handleTextInput("applicationDescription")}
			/>
			<Input
				inputId="app-info-portal-name"
				label={t("workspaces.appInfoPortalNameLabel")}
				name="portal_name"
				value={form.portalName}
				onInput={handleTextInput("portalName")}
			/>
		</div>
	);

	const renderTechnologyStep = (): ReactElement => (
		<div className="flex flex-col gap-4">
			<Input
				required
				inputId="app-info-technology"
				label={t("workspaces.appInfoTechnologyLabel")}
				name="technology"
				value={form.technology}
				onInput={handleTextInput("technology")}
			/>
			<Select
				label={t("workspaces.appInfoAuthenticationProtocolLabel")}
				name="authentication_protocol"
				selectId="app-info-auth-protocol"
				value={form.authenticationProtocol}
				onInput={handleTextInput("authenticationProtocol")}
			>
				{AUTHENTICATION_PROTOCOL_OPTIONS.map((option) => (
					<option key={option.value} value={option.value}>
						{t(option.labelKey)}
					</option>
				))}
			</Select>
			<Input
				inputId="app-info-planned-oidc-date"
				label={t("workspaces.appInfoPlannedOidcDateLabel")}
				name="planned_oidc_implementation_date"
				type="text"
				value={form.plannedOidcImplementationDate}
				onInput={handleTextInput("plannedOidcImplementationDate")}
			/>
			<Textarea
				required
				label={t("workspaces.appInfoTechStackLabel")}
				name="tech_stack"
				textareaId="app-info-tech-stack"
				value={form.techStack}
				onInput={handleTextInput("techStack")}
			/>
			<Select
				label={t("workspaces.appInfoRequestsProfileDataPushesLabel")}
				name="requests_profile_data_pushes"
				selectId="app-info-profile-pushes"
				value={form.requestsProfileDataPushes ? "true" : "false"}
				onInput={handleBooleanInput("requestsProfileDataPushes")}
			>
				<option value="false">{t("workspaces.optionNo")}</option>
				<option value="true">{t("workspaces.optionYes")}</option>
			</Select>
			<Select
				label={t("workspaces.appInfoHasAccessManagementLayerLabel")}
				name="has_access_management_layer"
				selectId="app-info-access-layer"
				value={form.hasAccessManagementLayer ? "true" : "false"}
				onInput={handleBooleanInput("hasAccessManagementLayer")}
			>
				<option value="false">{t("workspaces.optionNo")}</option>
				<option value="true">{t("workspaces.optionYes")}</option>
			</Select>
			<Textarea
				required
				label={t("workspaces.appInfoRollbackStrategyLabel")}
				name="rollback_strategy"
				textareaId="app-info-rollback"
				value={form.rollbackStrategy}
				onInput={handleTextInput("rollbackStrategy")}
			/>
		</div>
	);

	const renderSecurityStep = (): ReactElement => (
		<div className="flex flex-col gap-4">
			<Input
				required
				inputId="app-info-cal"
				label={t("workspaces.appInfoCalLabel")}
				name="credential_assurance_level"
				value={form.credentialAssuranceLevel}
				onInput={handleTextInput("credentialAssuranceLevel")}
			/>
			<Input
				required
				inputId="app-info-ial"
				label={t("workspaces.appInfoIalLabel")}
				name="identity_assurance_level"
				value={form.identityAssuranceLevel}
				onInput={handleTextInput("identityAssuranceLevel")}
			/>
			<Select
				label={t("workspaces.appInfoIdentityProofingLabel")}
				name="identity_proofing_method"
				selectId="app-info-id-proofing"
				value={form.identityProofingMethod}
				onInput={handleTextInput("identityProofingMethod")}
			>
				<option value=""></option>
				{IDENTITY_PROOFING_OPTIONS.map((option) => (
					<option key={option.value} value={option.value}>
						{t(option.labelKey)}
					</option>
				))}
			</Select>
			{form.identityProofingMethod === "OTHER" ? (
				<Input
					required
					inputId="app-info-id-proofing-other"
					label={t("workspaces.appInfoOtherLabel")}
					name="identity_proofing_method_other"
					value={form.identityProofingMethodOther}
					onInput={handleTextInput("identityProofingMethodOther")}
				/>
			) : null}
			<Select
				label={t("workspaces.appInfoIsCbasLabel")}
				name="is_cbas"
				selectId="app-info-cbas"
				value={form.isCbas ? "true" : "false"}
				onInput={handleBooleanInput("isCbas")}
			>
				<option value="false">{t("workspaces.optionNo")}</option>
				<option value="true">{t("workspaces.optionYes")}</option>
			</Select>
			<Select
				label={t("workspaces.appInfoHasAccountRecoveryLabel")}
				name="has_account_recovery"
				selectId="app-info-account-recovery"
				value={form.hasAccountRecovery ? "true" : "false"}
				onInput={handleBooleanInput("hasAccountRecovery")}
			>
				<option value="false">{t("workspaces.optionNo")}</option>
				<option value="true">{t("workspaces.optionYes")}</option>
			</Select>
			<Textarea
				required
				label={t("workspaces.appInfoAuthorityLabel")}
				name="authority_to_collect_personal_information"
				textareaId="app-info-authority"
				value={form.authorityToCollectPersonalInformation}
				onInput={handleTextInput(
					"authorityToCollectPersonalInformation"
				)}
			/>
			<Select
				label={t("workspaces.appInfoHasPrivacyNoticeLabel")}
				name="has_privacy_notice"
				selectId="app-info-privacy-notice"
				value={form.hasPrivacyNotice ? "true" : "false"}
				onInput={handleBooleanInput("hasPrivacyNotice")}
			>
				<option value="false">{t("workspaces.optionNo")}</option>
				<option value="true">{t("workspaces.optionYes")}</option>
			</Select>
		</div>
	);

	const renderUsageStep = (): ReactElement => (
		<div className="flex flex-col gap-4">
			<Fieldset legend={t("workspaces.appInfoUserTypeLabel")} legendSize="h3">
				<Checkboxes
					legend={t("workspaces.appInfoUserTypeLabel")}
					name="user_types"
					value={form.userTypes}
					options={buildCheckboxOptions(
						USER_TYPE_OPTIONS,
						form.userTypes,
						t,
						"app-info-user-type"
					)}
					onInput={handleCheckboxInput("userTypes")}
				/>
			</Fieldset>
			<Input
				inputId="app-info-user-type-other"
				label={t("workspaces.appInfoUserTypeOtherLabel")}
				name="user_type_other"
				value={form.userTypeOther}
				onInput={handleTextInput("userTypeOther")}
			/>
			<Input
				inputId="app-info-monthly-active-users"
				label={t("workspaces.appInfoMonthlyActiveUsersLabel")}
				name="monthly_active_users"
				type="number"
				value={form.monthlyActiveUsers}
				onInput={handleTextInput("monthlyActiveUsers")}
			/>
			<Textarea
				label={t("workspaces.appInfoPeakUsagePeriodsLabel")}
				name="peak_usage_periods"
				textareaId="app-info-peak-usage-periods"
				value={form.peakUsagePeriods}
				onInput={handleTextInput("peakUsagePeriods")}
			/>
			<Fieldset
				legend={t("workspaces.appInfoPersonalInformationCollectedLabel")}
				legendSize="h3"
			>
				<Checkboxes
					legend={t("workspaces.appInfoPersonalInformationCollectedLabel")}
					name="personal_information_collected"
					value={form.personalInformationCollected}
					options={buildCheckboxOptions(
						PERSONAL_INFORMATION_OPTIONS,
						form.personalInformationCollected,
						t,
						"app-info-personal-information"
					)}
					onInput={handleCheckboxInput("personalInformationCollected")}
				/>
			</Fieldset>
			<Input
				inputId="app-info-personal-information-other"
				label={t("workspaces.appInfoPersonalInformationOtherLabel")}
				name="personal_information_other"
				value={form.personalInformationOther}
				onInput={handleTextInput("personalInformationOther")}
			/>
		</div>
	);

	const renderTransitionStep = (): ReactElement => (
		<div className="flex flex-col gap-4">
			<Fieldset
				legend={t("workspaces.appInfoCurrentSignInOptionsLabel")}
				legendSize="h3"
			>
				<Checkboxes
					legend={t("workspaces.appInfoCurrentSignInOptionsLabel")}
					name="current_sign_in_options"
					value={form.currentSignInOptions}
					options={buildCheckboxOptions(
						CURRENT_SIGN_IN_OPTIONS,
						form.currentSignInOptions,
						t,
						"app-info-sign-in"
					)}
					onInput={handleCheckboxInput("currentSignInOptions")}
				/>
			</Fieldset>
			<Input
				inputId="app-info-current-sign-in-options-other"
				label={t("workspaces.appInfoCurrentSignInOptionsOtherLabel")}
				name="current_sign_in_options_other"
				value={form.currentSignInOptionsOther}
				onInput={handleTextInput("currentSignInOptionsOther")}
			/>
			<Select
				label={t("workspaces.appInfoConsolidatorUsedLabel")}
				name="consolidator_used"
				selectId="app-info-consolidator-used"
				value={form.consolidatorUsed}
				onInput={handleTextInput("consolidatorUsed")}
			>
				{CONSOLIDATOR_OPTIONS.map((option) => (
					<option key={option.value} value={option.value}>
						{t(option.labelKey)}
					</option>
				))}
			</Select>
			<Select
				label={t("workspaces.appInfoCurrentMfaOptionsLabel")}
				name="current_mfa_options"
				selectId="app-info-current-mfa-options"
				value={form.currentMfaOptions}
				onInput={handleTextInput("currentMfaOptions")}
			>
				{CURRENT_MFA_OPTIONS.map((option) => (
					<option key={option.value} value={option.value}>
						{t(option.labelKey)}
					</option>
				))}
			</Select>
			<Select
				label={t("workspaces.appInfoUsesCanadaloginMigrationLabel")}
				name="uses_canadalogin_migration"
				selectId="app-info-uses-canadalogin-migration"
				value={form.usesCanadaloginMigration ? "true" : "false"}
				onInput={handleBooleanInput("usesCanadaloginMigration")}
			>
				<option value="false">{t("workspaces.optionNo")}</option>
				<option value="true">{t("workspaces.optionYes")}</option>
			</Select>
			<Textarea
				label={t("workspaces.appInfoTransitionRationaleLabel")}
				name="migration_rationale"
				textareaId="app-info-migration-rationale"
				value={form.migrationRationale}
				onInput={handleTextInput("migrationRationale")}
			/>
			<Textarea
				label={t("workspaces.appInfoScheduleBlackoutPeriodsLabel")}
				name="schedule_blackout_periods"
				textareaId="app-info-schedule-blackout-periods"
				value={form.scheduleBlackoutPeriods}
				onInput={handleTextInput("scheduleBlackoutPeriods")}
			/>
			<Textarea
				label={t("workspaces.appInfoTransitionRisksLabel")}
				name="transition_risks"
				textareaId="app-info-transition-risks"
				value={form.transitionRisks}
				onInput={handleTextInput("transitionRisks")}
			/>
			<Textarea
				label={t("workspaces.appInfoTransitionMitigationsLabel")}
				name="transition_mitigations"
				textareaId="app-info-transition-mitigations"
				value={form.transitionMitigations}
				onInput={handleTextInput("transitionMitigations")}
			/>
		</div>
	);

	const reviewSections: Array<ReviewSection> = [
		{
			title: t("workspaces.appInfoStepAbout"),
			items: [
				{ label: t("workspaces.appInfoOrganizationLabel"), value: organizationLabel },
				{ label: t("workspaces.appInfoApplicationNameLabel"), value: form.applicationName },
				{ label: t("workspaces.appInfoAboutLabel"), value: form.aboutApplication },
				{ label: t("workspaces.appInfoProgramLineOfBusinessLabel"), value: form.programLineOfBusiness },
				{ label: t("workspaces.appInfoApplicationUrlLabel"), value: form.applicationUrl },
				{ label: t("workspaces.appInfoApplicationDescriptionLabel"), value: form.applicationDescription },
				{ label: t("workspaces.appInfoPortalNameLabel"), value: form.portalName },
			],
		},
		{
			title: t("workspaces.appInfoStepTechnology"),
			items: [
				{ label: t("workspaces.appInfoTechnologyLabel"), value: form.technology },
				{ label: t("workspaces.appInfoAuthenticationProtocolLabel"), value: translateApplicationInfoEnumValue(form.authenticationProtocol, t) },
				{ label: t("workspaces.appInfoPlannedOidcDateLabel"), value: form.plannedOidcImplementationDate },
				{ label: t("workspaces.appInfoTechStackLabel"), value: form.techStack },
				{ label: t("workspaces.appInfoRequestsProfileDataPushesLabel"), value: getBooleanDisplayValue(form.requestsProfileDataPushes, t) },
				{ label: t("workspaces.appInfoHasAccessManagementLayerLabel"), value: getBooleanDisplayValue(form.hasAccessManagementLayer, t) },
				{ label: t("workspaces.appInfoRollbackStrategyLabel"), value: form.rollbackStrategy },
			],
		},
		{
			title: t("workspaces.appInfoStepSecurity"),
			items: [
				{ label: t("workspaces.appInfoCalLabel"), value: form.credentialAssuranceLevel },
				{ label: t("workspaces.appInfoIalLabel"), value: form.identityAssuranceLevel },
				{ label: t("workspaces.appInfoIdentityProofingLabel"), value: translateApplicationInfoEnumValue(form.identityProofingMethod, t) },
				{ label: t("workspaces.appInfoOtherLabel"), value: form.identityProofingMethodOther },
				{ label: t("workspaces.appInfoIsCbasLabel"), value: getBooleanDisplayValue(form.isCbas, t) },
				{ label: t("workspaces.appInfoHasAccountRecoveryLabel"), value: getBooleanDisplayValue(form.hasAccountRecovery, t) },
				{ label: t("workspaces.appInfoAuthorityLabel"), value: form.authorityToCollectPersonalInformation },
				{ label: t("workspaces.appInfoHasPrivacyNoticeLabel"), value: getBooleanDisplayValue(form.hasPrivacyNotice, t) },
			],
		},
		{
			title: t("workspaces.appInfoStepUsage"),
			items: [
				{ label: t("workspaces.appInfoUserTypeLabel"), value: translateApplicationInfoEnumValues(form.userTypes, t) },
				{ label: t("workspaces.appInfoUserTypeOtherLabel"), value: form.userTypeOther },
				{ label: t("workspaces.appInfoMonthlyActiveUsersLabel"), value: form.monthlyActiveUsers },
				{ label: t("workspaces.appInfoPeakUsagePeriodsLabel"), value: form.peakUsagePeriods },
				{ label: t("workspaces.appInfoPersonalInformationCollectedLabel"), value: translateApplicationInfoEnumValues(form.personalInformationCollected, t) },
				{ label: t("workspaces.appInfoPersonalInformationOtherLabel"), value: form.personalInformationOther },
			],
		},
		{
			title: t("workspaces.appInfoStepTransition"),
			items: [
				{ label: t("workspaces.appInfoCurrentSignInOptionsLabel"), value: translateApplicationInfoEnumValues(form.currentSignInOptions, t) },
				{ label: t("workspaces.appInfoCurrentSignInOptionsOtherLabel"), value: form.currentSignInOptionsOther },
				{ label: t("workspaces.appInfoConsolidatorUsedLabel"), value: translateApplicationInfoEnumValue(form.consolidatorUsed, t) },
				{ label: t("workspaces.appInfoCurrentMfaOptionsLabel"), value: translateApplicationInfoEnumValue(form.currentMfaOptions, t) },
				{ label: t("workspaces.appInfoUsesCanadaloginMigrationLabel"), value: getBooleanDisplayValue(form.usesCanadaloginMigration, t) },
				{ label: t("workspaces.appInfoTransitionRationaleLabel"), value: form.migrationRationale },
				{ label: t("workspaces.appInfoScheduleBlackoutPeriodsLabel"), value: form.scheduleBlackoutPeriods },
				{ label: t("workspaces.appInfoTransitionRisksLabel"), value: form.transitionRisks },
				{ label: t("workspaces.appInfoTransitionMitigationsLabel"), value: form.transitionMitigations },
			],
		},
	];

	const renderReviewStep = (): ReactElement => (
		<div className="flex flex-col gap-5">
			{reviewSections.map((section) => (
				<section key={section.title} className="flex flex-col gap-3">
					<h3 className="text-lg font-semibold">{section.title}</h3>
					<div className="grid gap-2 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)] md:items-start">
						{section.items.map((item) => (
							<div key={`${section.title}-${item.label}`} className="contents">
								<p>{item.label}</p>
								<p>{getDisplayValue(item.value)}</p>
							</div>
						))}
					</div>
				</section>
			))}
		</div>
	);

	const renderCurrentStep = (): ReactElement => {
		switch (currentStep) {
			case 1:
				return renderAboutStep();
			case 2:
				return renderTechnologyStep();
			case 3:
				return renderSecurityStep();
			case 4:
				return renderUsageStep();
			case 5:
				return renderTransitionStep();
			default:
				return renderReviewStep();
		}
	};

	const handleSubmit = async (
		event: FormEvent<HTMLFormElement>
	): Promise<void> => {
		event.preventDefault();
		setIsSubmitting(true);
		try {
			if (isEditMode && applicationInfo) {
				await updateWorkspaceApplicationInfo(
					workspaceUuid,
					applicationInfo.uuid,
					buildPayload(form)
				);
				toast.success(t("workspaces.appInfoUpdatedSuccess"));
			} else {
				await createWorkspaceApplicationInfo(workspaceUuid, buildPayload(form));
				toast.success(t("workspaces.appInfoCreatedSuccess"));
			}
			await queryClient.invalidateQueries({
				queryKey: workspaceApplicationInfoQueryKey(workspaceUuid),
			});
			await onSaved();
			setForm(emptyForm());
			onClose();
		} catch (error) {
			toast.error(getRequestErrorMessage(error, t("errors.unknown")));
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleNext = (): void => {
		if (!canContinue || currentStep >= totalSteps) {
			return;
		}

		setCurrentStep((step) => step + 1);
	};

	const handlePrevious = (): void => {
		if (currentStep <= 1) {
			return;
		}

		setCurrentStep((step) => step - 1);
	};

	if (!isOpen) {
		return null;
	}

	return (
		<Modal
			isOpen={isOpen}
			size="wide"
			title={t(
				isEditMode
					? "workspaces.appInfoEditModalTitle"
					: "workspaces.appInfoCreateModalTitle"
			)}
			onClose={onClose}
		>
			<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
				<Stepper
					currentStep={currentStep}
					tabIndex={0}
					tag="h2"
					totalSteps={totalSteps}
				>
					{t(stepTitleKeys[currentStep - 1] ?? stepTitleKeys[0])}
				</Stepper>
				{renderCurrentStep()}
				<div className="flex justify-end gap-3">
					<Button type="button" onGcdsClick={onClose}>
						{t("common.cancel")}
					</Button>
					{currentStep > 1 ? (
						<Button type="button" onGcdsClick={handlePrevious}>
							{t("common.previous")}
						</Button>
					) : null}
					{currentStep < totalSteps ? (
						<Button
							disabled={!canContinue}
							type="button"
							onGcdsClick={handleNext}
						>
							{t("common.next")}
						</Button>
					) : (
						<Button disabled={isSubmitting || !canContinue} type="submit">
							{isSubmitting ? t("common.saving") : t("common.save")}
						</Button>
					)}
				</div>
			</form>
		</Modal>
	);
};