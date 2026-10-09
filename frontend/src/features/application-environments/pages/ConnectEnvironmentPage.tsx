import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "@tanstack/react-router";
import { TrashIcon } from "@heroicons/react/24/outline";
import { GcdsHint, GcdsLabel } from "@gcds-core/components-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
	Controller,
	useController,
	useForm,
	useWatch,
	type Control,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import {
	Button,
	Checkboxes,
	ErrorSummary,
	Fieldset,
	Grid,
	Heading,
	Icon,
	Input,
	Link,
	Notice,
	Radios,
	Select,
	SrOnly,
	Stepper,
	Text,
} from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import { useApplicationEnvironments } from "../hooks/use-application-environments";
import { useApplicationEnvironmentManagement } from "../hooks/use-application-environment-management";
import {
	applicationEnvironmentSchema,
	DEFAULT_VALUES,
	ENCRYPTION_CONTENT_ALGORITHMS,
	ENCRYPTION_KEY_ALGORITHMS,
	SIGNING_ALGORITHMS,
	stripEnvironmentTypePrefix,
	toPayload,
	type ApplicationEnvironmentFormValues,
} from "./connect-environment-form";

const inputValue = (event: FormEvent<Element>): string =>
	(event.target as HTMLInputElement).value;

const boolValue = (event: FormEvent<Element>): boolean =>
	inputValue(event) === "true";

const AUTHORIZATION_CODE_FLOW_URL =
	"https://openid.net/specs/openid-connect-core-1_0.html#AuthorizationEndpoint";

const listOptions = <T extends string>(
	values: ReadonlyArray<T>,
	label: (value: T) => string
): Array<{ id: string; label: string; value: string }> =>
	values.map((value) => ({ id: value, label: label(value), value }));

type StepOneFieldName =
	| "tenantCode"
	| "copyExisting"
	| "sourceEnvironmentUuid"
	| "environmentName"
	| "applicationUrlEn"
	| "applicationUrlFr";

type StepTwoArrayFieldName = "redirectUris" | "postLogoutRedirectUris";

type StepThreeFieldName =
	| "clientType"
	| "pkceSupported"
	| "clientAuthMethod"
	| "jwksUri"
	| "sharesIdentifier"
	| "sectorIdentifierUrl";

type StepFourFieldName =
	| "verificationMessages"
	| "verificationSignatureAlgorithms"
	| "canSignMessages"
	| "signingMessages"
	| "signingSignatureAlgorithms"
	| "canEncryptRequests"
	| "encryptionKeyAlgorithms"
	| "encryptionContentAlgorithms"
	| "canDecryptMessages"
	| "decryptionMessages"
	| "decryptionKeyAlgorithms"
	| "decryptionContentAlgorithms";

const STEP_ONE_FIELD_CONFIG: Record<
	StepOneFieldName,
	{ errorKey: string; hostId: string }
> = {
	applicationUrlEn: {
		errorKey: "applicationEnvironments.connect.validationEnglishUrl",
		hostId: "application-url-en-control",
	},
	applicationUrlFr: {
		errorKey: "applicationEnvironments.connect.validationFrenchUrl",
		hostId: "application-url-fr-control",
	},
	copyExisting: {
		errorKey: "applicationEnvironments.connect.validationCopyChoice",
		hostId: "copy-existing-control",
	},
	environmentName: {
		errorKey: "applicationEnvironments.connect.validationEnvironmentName",
		hostId: "environment-name-control",
	},
	sourceEnvironmentUuid: {
		errorKey: "applicationEnvironments.connect.validationCopyConfiguration",
		hostId: "source-environment-control",
	},
	tenantCode: {
		errorKey: "applicationEnvironments.connect.validationEnvironmentType",
		hostId: "tenant-code-control",
	},
};

type EnvironmentNameFieldProps = {
	control: Control<ApplicationEnvironmentFormValues>;
	errorMessage?: string;
	tenantCode?: ApplicationEnvironmentFormValues["tenantCode"];
};

const EnvironmentNameField = ({
	control,
	errorMessage,
	tenantCode,
}: EnvironmentNameFieldProps): FunctionComponent => {
	const { t } = useTranslation();
	const { field } = useController({ control, name: "environmentName" });

	return (
		<Grid columns="1fr" tag="div">
			<GcdsLabel
				required
				className="environment-name-label"
				label={t("applicationEnvironmentConnect.stepOne.environmentName")}
				labelFor="environment-name-control"
			/>
			<GcdsHint hintId="environment-name">
				{t("applicationEnvironmentConnect.stepOne.environmentNameHint")}
			</GcdsHint>
			<Grid alignItems="end" columns="auto 1fr" tag="div">
				<Text marginBottom="100" size="body">
					{tenantCode === "staging" ? "STAGING-" : "TEST-"}
				</Text>
				<Input
					hideLabel
					required
					ariaDescribedBy="hint-environment-name"
					className="environment-name-input"
					errorMessage={errorMessage}
					id="environment-name-control"
					inputId="environment-name"
					label={t("applicationEnvironmentConnect.stepOne.environmentName")}
					name={field.name}
					value={field.value}
					onInput={(event) => {
						field.onChange(inputValue(event));
					}}
				/>
			</Grid>
		</Grid>
	);
};

const STEP_THREE_FIELD_CONFIG: Record<
	StepThreeFieldName,
	{ errorKey: string; hostId: string }
> = {
	clientAuthMethod: {
		errorKey:
			"applicationEnvironmentConnect.stepThree.validationClientAuthMethod",
		hostId: "client-auth-method-control",
	},
	clientType: {
		errorKey: "applicationEnvironmentConnect.stepThree.validationClientType",
		hostId: "client-type-control",
	},
	jwksUri: {
		errorKey: "applicationEnvironmentConnect.stepThree.validationJwksUri",
		hostId: "jwks-uri-control",
	},
	pkceSupported: {
		errorKey: "applicationEnvironmentConnect.stepThree.validationPkceSupported",
		hostId: "pkce-supported-control",
	},
	sectorIdentifierUrl: {
		errorKey:
			"applicationEnvironmentConnect.stepThree.validationSectorIdentifierUrl",
		hostId: "sector-identifier-url-control",
	},
	sharesIdentifier: {
		errorKey:
			"applicationEnvironmentConnect.stepThree.validationSharesIdentifier",
		hostId: "shares-identifier-control",
	},
};

const STEP_FOUR_FIELD_CONFIG: Record<
	StepFourFieldName,
	{ errorKey: string; hostId: string }
> = {
	canDecryptMessages: {
		errorKey:
			"applicationEnvironmentConnect.stepFour.validationCanDecryptMessages",
		hostId: "can-decrypt-messages-control",
	},
	canEncryptRequests: {
		errorKey:
			"applicationEnvironmentConnect.stepFour.validationCanEncryptRequests",
		hostId: "can-encrypt-requests-control",
	},
	canSignMessages: {
		errorKey:
			"applicationEnvironmentConnect.stepFour.validationCanSignMessages",
		hostId: "can-sign-messages-control",
	},
	decryptionContentAlgorithms: {
		errorKey:
			"applicationEnvironmentConnect.stepFour.validationDecryptionContentAlgorithms",
		hostId: "decryption-content-algorithms-control",
	},
	decryptionKeyAlgorithms: {
		errorKey:
			"applicationEnvironmentConnect.stepFour.validationDecryptionKeyAlgorithms",
		hostId: "decryption-key-algorithms-control",
	},
	decryptionMessages: {
		errorKey:
			"applicationEnvironmentConnect.stepFour.validationDecryptionMessages",
		hostId: "decryption-messages-control",
	},
	encryptionContentAlgorithms: {
		errorKey:
			"applicationEnvironmentConnect.stepFour.validationEncryptionContentAlgorithms",
		hostId: "encryption-content-algorithms-control",
	},
	encryptionKeyAlgorithms: {
		errorKey:
			"applicationEnvironmentConnect.stepFour.validationEncryptionKeyAlgorithms",
		hostId: "encryption-key-algorithms-control",
	},
	signingMessages: {
		errorKey:
			"applicationEnvironmentConnect.stepFour.validationSigningMessages",
		hostId: "signing-messages-control",
	},
	signingSignatureAlgorithms: {
		errorKey:
			"applicationEnvironmentConnect.stepFour.validationSigningAlgorithms",
		hostId: "signing-algorithms-control",
	},
	verificationMessages: {
		errorKey:
			"applicationEnvironmentConnect.stepFour.validationVerificationMessages",
		hostId: "verification-messages-control",
	},
	verificationSignatureAlgorithms: {
		errorKey:
			"applicationEnvironmentConnect.stepFour.validationVerificationAlgorithms",
		hostId: "verification-algorithms-control",
	},
};

export const ConnectEnvironmentPage = (): FunctionComponent => {
	const { i18n, t } = useTranslation();
	const { applicationUuid } = useParams({
		from: "/applications/$applicationUuid/environments",
	});
	const navigate = useNavigate({
		from: "/applications/$applicationUuid/environments",
	});
	const [step, setStep] = useState(0);
	const formRef = useRef<HTMLFormElement>(null);
	const previousStep = useRef(step);
	const { data: environments } = useApplicationEnvironments(
		applicationUuid,
		1,
		100
	);
	const { createEnvironment, error, isCreating } =
		useApplicationEnvironmentManagement(applicationUuid);
	const form = useForm<ApplicationEnvironmentFormValues>({
		defaultValues: DEFAULT_VALUES,
		mode: "onBlur",
		resolver: zodResolver(applicationEnvironmentSchema),
	});
	const {
		control,
		formState: { errors },
		handleSubmit,
		reset,
		clearErrors,
		setError,
		setValue,
		trigger,
	} = form;
	const values = useWatch({ control });
	const redirectUris = values.redirectUris ?? [];
	const postLogoutRedirectUris = values.postLogoutRedirectUris ?? [];
	const redirectUriRowCount = Math.max(1, redirectUris.length);
	const postLogoutRedirectUriRowCount = Math.max(
		1,
		postLogoutRedirectUris.length
	);
	const requestError = getRequestErrorNotice(error, {
		bodyKey: "applicationEnvironmentConnect.submitErrorBody",
		titleKey: "applicationEnvironmentConnect.submitErrorTitle",
	});
	const sourceEnvironments = (environments?.data ?? []).filter(
		(environment) => environment.tenantCode !== "production"
	);
	const sourceOptions = sourceEnvironments.map((environment) => ({
		id: environment.uuid,
		label: environment.partnerLabel,
		value: environment.uuid,
	}));
	const selectedSource = sourceEnvironments.find(
		(environment) => environment.uuid === values.sourceEnvironmentUuid
	);
	const sourceConfig = selectedSource?.config;
	const hasCopySource = sourceOptions.length > 0;
	const hasSelectedTenant = values.tenantCode !== "";
	const visibleStepOneFields: Array<StepOneFieldName> = ["tenantCode"];
	if (hasSelectedTenant && hasCopySource) {
		visibleStepOneFields.push("copyExisting");
	}
	if (hasSelectedTenant && values.copyExisting) {
		visibleStepOneFields.push("sourceEnvironmentUuid");
	}
	if (hasSelectedTenant) {
		visibleStepOneFields.push(
			"environmentName",
			"applicationUrlEn",
			"applicationUrlFr"
		);
	}
	const stepOneErrorFields = visibleStepOneFields.filter(
		(fieldName) => errors[fieldName]
	);
	const stepOneErrorLinks = Object.fromEntries(
		stepOneErrorFields.map((fieldName) => [
			`#${STEP_ONE_FIELD_CONFIG[fieldName].hostId}`,
			t(STEP_ONE_FIELD_CONFIG[fieldName].errorKey as never),
		])
	);
	const stepOneErrorMessage = (
		fieldName: StepOneFieldName
	): string | undefined =>
		errors[fieldName]
			? t(STEP_ONE_FIELD_CONFIG[fieldName].errorKey as never)
			: undefined;
	const hasStepOneErrors = stepOneErrorFields.length > 0;
	const stepTwoErrorMessage = (
		error: unknown,
		errorKey: string
	): string | undefined => (error ? t(errorKey as never) : undefined);
	const stepTwoArrayErrorMessage = (
		fieldName: StepTwoArrayFieldName,
		index: number
	): string | undefined => {
		const fieldError = errors[fieldName];
		const itemError = Array.isArray(fieldError)
			? fieldError[index]
			: index === 0
				? fieldError
				: undefined;
		return stepTwoErrorMessage(
			itemError,
			fieldName === "redirectUris"
				? "applicationEnvironmentConnect.stepTwo.validationRedirectUrl"
				: "applicationEnvironmentConnect.stepTwo.validationPostLogoutUrl"
		);
	};
	const stepTwoErrorLinks: Record<string, string> = {};
	redirectUris.forEach((_, index) => {
		const errorMessage = stepTwoArrayErrorMessage("redirectUris", index);
		if (errorMessage) {
			stepTwoErrorLinks[`#redirect-uri-control-${index}`] = errorMessage;
		}
	});
	postLogoutRedirectUris.forEach((_, index) => {
		const errorMessage = stepTwoArrayErrorMessage(
			"postLogoutRedirectUris",
			index
		);
		if (errorMessage) {
			stepTwoErrorLinks[`#post-logout-redirect-uri-control-${index}`] =
				errorMessage;
		}
	});
	const logoutMethodErrorMessage = stepTwoErrorMessage(
		errors.logoutMethod,
		"applicationEnvironmentConnect.stepTwo.validationLogoutMethod"
	);
	if (logoutMethodErrorMessage) {
		stepTwoErrorLinks["#logout-method-control"] = logoutMethodErrorMessage;
	}
	const signOutRequestUrlErrorMessage = stepTwoErrorMessage(
		errors.signOutRequestUrl,
		"applicationEnvironmentConnect.stepTwo.validationSignOutRequestUrl"
	);
	const singleSignOutErrorMessage = stepTwoErrorMessage(
		errors.singleSignOut,
		"applicationEnvironmentConnect.stepTwo.validationSingleSignOut"
	);
	if (singleSignOutErrorMessage) {
		stepTwoErrorLinks["#single-sign-out-control"] = singleSignOutErrorMessage;
	}
	if (signOutRequestUrlErrorMessage) {
		stepTwoErrorLinks["#sign-out-request-url-control"] =
			signOutRequestUrlErrorMessage;
	}
	const hasStepTwoErrors = Object.keys(stepTwoErrorLinks).length > 0;
	const stepThreeFieldNames = [
		"clientType",
		"pkceSupported",
		"clientAuthMethod",
		"jwksUri",
		"sharesIdentifier",
		"sectorIdentifierUrl",
	] as const satisfies ReadonlyArray<StepThreeFieldName>;
	const stepThreeErrorFields = stepThreeFieldNames.filter(
		(fieldName) => errors[fieldName]
	);
	const stepThreeErrorLinks = Object.fromEntries(
		stepThreeErrorFields.map((fieldName) => [
			`#${STEP_THREE_FIELD_CONFIG[fieldName].hostId}`,
			t(STEP_THREE_FIELD_CONFIG[fieldName].errorKey as never),
		])
	);
	const stepThreeErrorMessage = (
		fieldName: StepThreeFieldName
	): string | undefined =>
		errors[fieldName]
			? t(STEP_THREE_FIELD_CONFIG[fieldName].errorKey as never)
			: undefined;
	const hasStepThreeErrors = stepThreeErrorFields.length > 0;
	const stepFourFieldNames = [
		"verificationMessages",
		"verificationSignatureAlgorithms",
		"canSignMessages",
		"signingMessages",
		"signingSignatureAlgorithms",
		"canEncryptRequests",
		"encryptionKeyAlgorithms",
		"encryptionContentAlgorithms",
		"canDecryptMessages",
		"decryptionMessages",
		"decryptionKeyAlgorithms",
		"decryptionContentAlgorithms",
	] as const satisfies ReadonlyArray<StepFourFieldName>;
	const stepFourErrorFields = stepFourFieldNames.filter(
		(fieldName) => errors[fieldName]
	);
	const stepFourErrorLinks = Object.fromEntries(
		stepFourErrorFields.map((fieldName) => [
			`#${STEP_FOUR_FIELD_CONFIG[fieldName].hostId}`,
			t(STEP_FOUR_FIELD_CONFIG[fieldName].errorKey as never),
		])
	);
	const stepFourErrorMessage = (
		fieldName: StepFourFieldName
	): string | undefined =>
		errors[fieldName]
			? t(STEP_FOUR_FIELD_CONFIG[fieldName].errorKey as never)
			: undefined;
	const hasStepFourErrors = stepFourErrorFields.length > 0;
	const applicationName =
		i18n.resolvedLanguage === "fr" && environments?.application?.nameFr
			? environments.application.nameFr
			: (environments?.application?.nameEn ??
				t("applicationEnvironmentConnect.applicationNameFallback"));

	useEffect(() => {
		if (!hasCopySource && values.copyExisting) {
			setValue("copyExisting", false);
		}
		if (
			(!hasCopySource || !values.copyExisting) &&
			values.sourceEnvironmentUuid
		) {
			setValue("sourceEnvironmentUuid", "");
		}
	}, [
		hasCopySource,
		setValue,
		values.copyExisting,
		values.sourceEnvironmentUuid,
	]);

	useEffect(() => {
		if (
			!values.copyExisting ||
			!values.sourceEnvironmentUuid ||
			!sourceConfig
		) {
			return;
		}

		reset({
			...DEFAULT_VALUES,
			...sourceConfig,
			environmentName: sourceConfig.environmentName
				? stripEnvironmentTypePrefix(sourceConfig.environmentName)
				: DEFAULT_VALUES.environmentName,
			copyExisting: true,
			sourceEnvironmentUuid: values.sourceEnvironmentUuid,
			tenantCode: values.tenantCode,
		});
	}, [
		reset,
		sourceConfig,
		values.copyExisting,
		values.sourceEnvironmentUuid,
		values.tenantCode,
	]);

	useEffect(() => {
		if (previousStep.current === step) {
			return;
		}
		previousStep.current = step;
		const formElement = formRef.current;
		if (formElement && typeof formElement.scrollIntoView === "function") {
			formElement.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	}, [step]);

	const stepFields: Array<Array<keyof ApplicationEnvironmentFormValues>> = [
		[
			"tenantCode",
			"copyExisting",
			"sourceEnvironmentUuid",
			"environmentName",
			"applicationUrlEn",
			"applicationUrlFr",
		],
		[
			"redirectUris",
			"postLogoutRedirectUris",
			"singleSignOut",
			"logoutMethod",
			"signOutRequestUrl",
		],
		[
			"clientType",
			"pkceSupported",
			"clientAuthMethod",
			"jwksUri",
			"sharesIdentifier",
			"sectorIdentifierUrl",
		],
		[
			"verificationMessages",
			"verificationSignatureAlgorithms",
			"canSignMessages",
			"signingMessages",
			"signingSignatureAlgorithms",
			"canEncryptRequests",
			"encryptionKeyAlgorithms",
			"encryptionContentAlgorithms",
			"canDecryptMessages",
			"decryptionMessages",
			"decryptionKeyAlgorithms",
			"decryptionContentAlgorithms",
		],
	];

	const handleNext = async (): Promise<void> => {
		const fieldsToValidate =
			step === 0 ? visibleStepOneFields : stepFields[step];
		const isValid = await trigger(fieldsToValidate);
		if (
			step === 0 &&
			hasSelectedTenant &&
			hasCopySource &&
			values.copyExisting === null
		) {
			setError("copyExisting", {
				type: "manual",
				message: "applicationEnvironments.connect.validationCopyChoice",
			});
			return;
		}
		if (!isValid) {
			return;
		}
		setStep((currentStep) => currentStep + 1);
	};
	const handleBack = (): void => {
		setStep((currentStep) => currentStep - 1);
	};
	const handleCreate = async (
		formValues: ApplicationEnvironmentFormValues
	): Promise<void> => {
		try {
			const result = await createEnvironment(toPayload(formValues));
			if (result) {
				void navigate({
					to: "/applications/$applicationUuid/environments",
					params: { applicationUuid },
				});
			}
		} catch {
			form.setError("root.serverError", {
				message: "applicationEnvironmentConnect.submitErrorBody",
			});
		}
	};

	return (
		<Grid columns="1fr" container="xl" tag="div">
			<Grid alignItems="center" columns="auto auto 1fr" tag="div">
				<Text marginBottom="0">
					<strong>{applicationName}</strong>
				</Text>
				<Icon name="arrow-up-down" size="text" />
				<Link href="/applications">
					{t("applicationEnvironmentConnect.switchApplication")}
				</Link>
			</Grid>
			{step === 0 && hasStepOneErrors && (
				<ErrorSummary errorLinks={stepOneErrorLinks} listen={false} />
			)}
			{step === 1 && hasStepTwoErrors && (
				<ErrorSummary errorLinks={stepTwoErrorLinks} listen={false} />
			)}
			{step === 2 && hasStepThreeErrors && (
				<ErrorSummary errorLinks={stepThreeErrorLinks} listen={false} />
			)}
			{step === 3 && hasStepFourErrors && (
				<ErrorSummary errorLinks={stepFourErrorLinks} listen={false} />
			)}
			{requestError && (
				<Notice
					noticeRole="danger"
					noticeTitle={t(requestError.titleKey as never)}
					noticeTitleTag="h2"
				>
					<Text>{t(requestError.bodyKey as never)}</Text>
				</Notice>
			)}
			<form
				ref={formRef}
				noValidate
				onSubmit={handleSubmit(handleCreate)}
			>
				<Stepper currentStep={step + 1} tabIndex={0} tag="h2" totalSteps={4}>
					<SrOnly>{t("applicationEnvironmentConnect.title")}</SrOnly>
				</Stepper>
				{step === 0 && (
					<Grid columns="1fr" container="md" tag="div">
						<Heading tag="h1">
							{t("applicationEnvironmentConnect.title")}
						</Heading>
						<Text>
							{t("applicationEnvironmentConnect.stepOne.requirementsIntro")}
							<ul className="list-disc">
								<li>
									<Link external href={AUTHORIZATION_CODE_FLOW_URL}>
										{t(
											"applicationEnvironmentConnect.stepOne.authorizationCodeFlow"
										)}
									</Link>
								</li>
								<li>
									{t("applicationEnvironmentConnect.stepOne.pkceRequirement")}
								</li>
								<li>
									{t(
										"applicationEnvironmentConnect.stepOne.verificationRequirement"
									)}
								</li>
							</ul>
						</Text>
						<Text>
							{t(
								"applicationEnvironmentConnect.stepOne.requirementsLinkPrefix"
							)}{" "}
							<Link href="/support">
								{t("applicationEnvironmentConnect.stepOne.requirementsLink")}
							</Link>
							.
						</Text>
						<Controller
							control={control}
							name="tenantCode"
							render={({ field }) => (
								<Radios
									required
									errorMessage={stepOneErrorMessage("tenantCode")}
									id={STEP_ONE_FIELD_CONFIG.tenantCode.hostId}
									legend={t("applicationEnvironmentConnect.stepOne.tenant")}
									name={field.name}
									value={field.value}
									options={[
										{
											id: "tenant-test",
											label: t("applicationEnvironmentConnect.tenantTest"),
											hint: t(
												"applicationEnvironmentConnect.stepOne.tenantTestHint"
											),
											value: "test",
										},
										{
											id: "tenant-staging",
											label: t("applicationEnvironmentConnect.tenantStaging"),
											hint: t(
												"applicationEnvironmentConnect.stepOne.tenantStagingHint"
											),
											value: "staging",
										},
									]}
									onInput={(event) => {
										field.onChange(inputValue(event));
									}}
								/>
							)}
						/>
						<Heading marginBottom="0" marginTop="0" tag="h5">
							{t("applicationEnvironmentConnect.stepOne.productionTitle")}
						</Heading>
						<Text>
							{t("applicationEnvironmentConnect.stepOne.productionBodyPrefix")}{" "}
							<strong>
								{t(
									"applicationEnvironmentConnect.stepOne.productionRequestAction"
								)}
							</strong>
							{t("applicationEnvironmentConnect.stepOne.productionBodySuffix")}
						</Text>
						{hasSelectedTenant && hasCopySource && (
							<Controller
								control={control}
								name="copyExisting"
								render={({ field }) => (
									<Radios
										required
										errorMessage={stepOneErrorMessage("copyExisting")}
										id={STEP_ONE_FIELD_CONFIG.copyExisting.hostId}
										name={field.name}
										legend={t(
											"applicationEnvironmentConnect.stepOne.connectionType"
										)}
										options={[
											{
												id: "copy-existing",
												label: t("common.yes"),
												value: "true",
											},
											{
												id: "create-new",
												label: t("common.no"),
												value: "false",
											},
										]}
										value={
											field.value === null ? undefined : String(field.value)
										}
										onInput={(event) => {
											field.onChange(boolValue(event));
											clearErrors("copyExisting");
										}}
									/>
								)}
							/>
						)}
						{hasSelectedTenant && values.copyExisting && (
							<Controller
								control={control}
								name="sourceEnvironmentUuid"
								render={({ field }) => (
									<Select
										errorMessage={stepOneErrorMessage("sourceEnvironmentUuid")}
										id={STEP_ONE_FIELD_CONFIG.sourceEnvironmentUuid.hostId}
										name={field.name}
										selectId="source-environment"
										value={field.value}
										label={t(
											"applicationEnvironmentConnect.stepOne.sourceEnvironment"
										)}
										onInput={(event) => {
											field.onChange(inputValue(event));
										}}
									>
										<option value="">
											{t("applicationEnvironmentConnect.stepOne.chooseSource")}
										</option>
										{sourceOptions.map((option) => (
											<option key={option.id} value={option.value}>
												{option.label}
											</option>
										))}
									</Select>
								)}
							/>
						)}
						{hasSelectedTenant && (
							<>
								<EnvironmentNameField
									control={control}
									errorMessage={stepOneErrorMessage("environmentName")}
									tenantCode={values.tenantCode}
								/>
								<Controller
									control={control}
									name="applicationUrlEn"
									render={({ field }) => (
										<Input
											required
											errorMessage={stepOneErrorMessage("applicationUrlEn")}
											id={STEP_ONE_FIELD_CONFIG.applicationUrlEn.hostId}
											inputId="application-url-en"
											name={field.name}
											value={field.value}
											label={t(
												"applicationEnvironmentConnect.stepOne.applicationUrlEn"
											)}
											onInput={(event) => {
												field.onChange(inputValue(event));
											}}
										/>
									)}
								/>
								<Controller
									control={control}
									name="applicationUrlFr"
									render={({ field }) => (
										<Input
											required
											errorMessage={stepOneErrorMessage("applicationUrlFr")}
											id={STEP_ONE_FIELD_CONFIG.applicationUrlFr.hostId}
											inputId="application-url-fr"
											name={field.name}
											value={field.value}
											hint={t(
												"applicationEnvironmentConnect.stepOne.applicationUrlFrHint"
											)}
											label={t(
												"applicationEnvironmentConnect.stepOne.applicationUrlFr"
											)}
											onInput={(event) => {
												field.onChange(inputValue(event));
											}}
										/>
									)}
								/>
							</>
						)}
					</Grid>
				)}
				{/*
				>
					<Text>{t("applicationEnvironmentConnect.validationBody")}</Text>
				</Notice>
			)}
			{requestError && (
				<Notice
					noticeRole="danger"
					noticeTitle={t(requestError.titleKey as never)}
					noticeTitleTag="h2"
				>
					<Text>{t(requestError.bodyKey as never)}</Text>
				</Notice>
			)}
			<form onSubmit={handleSubmit(handleCreate)}>
				<Stepper currentStep={step + 1} tabIndex={0} tag="h2" totalSteps={4}>
					<SrOnly>{t("applicationEnvironmentConnect.title")}</SrOnly>
				</Stepper>
				{step === 0 && (
					<Grid columns="1fr" container="md" tag="div">
						<Grid columns="1fr" tag="div">
							<GcdsLabel
								label={t(
									"applicationEnvironmentConnect.stepOne.environmentName"
								)}
								labelFor="environment-name"
								required
							/>
							<GcdsHint hintId="environment-name">
								{t(
									"applicationEnvironmentConnect.stepOne.environmentNameHint"
								)}
							</GcdsHint>
							<Grid alignItems="center" columns="auto 1fr" tag="div">
								<Text marginBottom="0" size="body">
									{values.tenantCode === "staging" ? "STAGING-" : "TEST-"}
								</Text>
								<Controller
									control={control}
									name="environmentName"
									render={({ field }) => (
										<Input
											ariaDescribedBy="hint-environment-name"
											hideLabel
											required
											inputId="environment-name"
											name={field.name}
											value={field.value}
											label={t(
												"applicationEnvironmentConnect.stepOne.environmentName"
											)}
											onInput={(event) => {
												field.onChange(inputValue(event));
											}}
										/>
									)}
								/>
							</Grid>
						</Grid>
									name={field.name}
									value={field.value}
									options={[
										{
											id: "tenant-test",
											label: t("applicationEnvironmentConnect.tenantTest"),
											hint: t(
												"applicationEnvironmentConnect.stepOne.tenantTestHint"
											),
											value: "test",
										},
										{
											id: "tenant-staging",
											label: t("applicationEnvironmentConnect.tenantStaging"),
											hint: t(
												"applicationEnvironmentConnect.stepOne.tenantStagingHint"
											),
											value: "staging",
										},
									]}
									onInput={(event) => {
										field.onChange(inputValue(event));
									}}
								/>
							)}
						/>
						<Heading tag="h3">
							{t("applicationEnvironmentConnect.stepOne.productionTitle")}
						</Heading>
						<Text>
							{t("applicationEnvironmentConnect.stepOne.productionBodyPrefix")}{" "}
							<strong>
								{t(
									"applicationEnvironmentConnect.stepOne.productionRequestAction"
								)}
							</strong>
							{t("applicationEnvironmentConnect.stepOne.productionBodySuffix")}
						</Text>
						{hasSelectedTenant && hasCopySource && (
							<Controller
								control={control}
								name="copyExisting"
								render={({ field }) => (
									<Radios
										required
										name={field.name}
										value={String(field.value)}
										legend={t(
											"applicationEnvironmentConnect.stepOne.connectionType"
										)}
										options={[
											{
												id: "copy-existing",
												label: t("common.yes"),
												value: "true",
											},
											{
												id: "create-new",
												label: t("common.no"),
												value: "false",
											},
										]}
										onInput={(event) => {
											field.onChange(boolValue(event));
										}}
									/>
								)}
							/>
						)}
						{hasSelectedTenant && values.copyExisting && (
							<Controller
								control={control}
								name="sourceEnvironmentUuid"
								render={({ field }) => (
									<Select
										name={field.name}
										selectId="source-environment"
										value={field.value}
										label={t(
											"applicationEnvironmentConnect.stepOne.sourceEnvironment"
										)}
										onInput={(event) => {
											field.onChange(inputValue(event));
										}}
									>
										<option value="">
											{t("applicationEnvironmentConnect.stepOne.chooseSource")}
										</option>
										{sourceOptions.map((option) => (
											<option key={option.id} value={option.value}>
												{option.label}
											</option>
										))}
									</Select>
								)}
							/>
						)}
						{hasSelectedTenant && (
							<>
													<Grid columns="1fr" tag="div">
														<GcdsLabel
															label={t(
																"applicationEnvironmentConnect.stepOne.environmentName"
															)}
															labelFor="environment-name"
															required
														/>
														<GcdsHint hintId="environment-name">
															{t(
																"applicationEnvironmentConnect.stepOne.environmentNameHint"
															)}
														</GcdsHint>
														<Grid alignItems="center" columns="auto 1fr" tag="div">
															<Text marginBottom="0" size="body">
																{values.tenantCode === "staging" ? "STAGING-" : "TEST-"}
															</Text>
									<Controller
										control={control}
										name="environmentName"
										render={({ field }) => (
											<Input
													ariaDescribedBy="hint-environment-name"
													hideLabel
												required
												inputId="environment-name"
												name={field.name}
												value={field.value}
												label={t(
													"applicationEnvironmentConnect.stepOne.environmentName"
												)}
												onInput={(event) => {
													field.onChange(inputValue(event));
												}}
									</Grid>
											/>
										)}
									/>
								</Grid>
								<Controller
									control={control}
									name="applicationUrlEn"
									render={({ field }) => (
										<Input
											required
											inputId="application-url-en"
											name={field.name}
											value={field.value}
											label={t(
												"applicationEnvironmentConnect.stepOne.applicationUrlEn"
											)}
											onInput={(event) => {
												field.onChange(inputValue(event));
											}}
										/>
									)}
								/>
								<Controller
									control={control}
									name="applicationUrlFr"
									render={({ field }) => (
										<Input
											required
											inputId="application-url-fr"
											name={field.name}
											value={field.value}
											hint={t(
												"applicationEnvironmentConnect.stepOne.applicationUrlFrHint"
											)}
											label={t(
												"applicationEnvironmentConnect.stepOne.applicationUrlFr"
											)}
											onInput={(event) => {
												field.onChange(inputValue(event));
											}}
										/>
									)}
								/>
							</>
						)}
					</Grid>
				)}
				*/}
				{step === 1 && (
					<Grid columns="1fr" container="md" tag="div">
						<Heading tag="h1">
							{t("applicationEnvironmentConnect.stepTwo.title")}
						</Heading>
						<Text>
							{t("applicationEnvironmentConnect.stepTwo.intro")}{" "}
							<Link href="/support">
								{t("applicationEnvironmentConnect.stepTwo.requirementsLink")}
							</Link>
						</Text>
						<Fieldset
							hint={t("applicationEnvironmentConnect.stepTwo.redirectUrlsHint")}
							legendSize="h3"
							legend={t(
								"applicationEnvironmentConnect.stepTwo.redirectUrlsTitle"
							)}
						>
							{Array.from({ length: redirectUriRowCount }, (_, index) => (
								<Grid
									key={index}
									className="endpoint-url-row"
									columns="1fr"
									tag="div"
								>
									<Grid
										alignItems="start"
										className="endpoint-label-row"
										columns="auto auto 1fr"
										tag="div"
									>
										<GcdsLabel
											className="endpoint-label"
											labelFor={`redirect-uri-control-${index}`}
											required={index === 0}
											label={t(
												"applicationEnvironmentConnect.stepTwo.redirectUrl",
												{ count: index + 1 }
											)}
										/>
										{redirectUriRowCount > 1 && index > 0 && (
											<Link
												href={`#redirect-uri-${index}`}
												size="small"
												onGcdsClick={(event) => {
													event.preventDefault();
													setValue(
														"redirectUris",
														redirectUris.filter(
															(_, valueIndex) => valueIndex !== index
														)
													);
												}}
													>
													<span
														style={{
															alignItems: "center",
															display: "inline-flex",
															gap: "var(--gcds-spacing-100)",
														}}
													>
														<TrashIcon aria-hidden="true" height="1em" width="1em" />
														{t("common.remove")}
													</span>
											</Link>
										)}
									</Grid>
									<Controller
										control={control}
										name={`redirectUris.${index}` as const}
										render={({ field: inputField }) => (
											<Input
												hideLabel
												id={`redirect-uri-control-${index}`}
												inputId={`redirect-uri-${index}`}
												name={inputField.name}
												required={index === 0}
												value={inputField.value}
												errorMessage={stepTwoArrayErrorMessage(
													"redirectUris",
													index
												)}
												label={t(
													"applicationEnvironmentConnect.stepTwo.redirectUrl",
													{ count: index + 1 }
												)}
												onInput={(event) => {
													inputField.onChange(inputValue(event));
												}}
											/>
										)}
									/>
								</Grid>
							))}
							<Button
								buttonRole="secondary"
								size="small"
								type="button"
								onGcdsClick={() => {
									setValue("redirectUris", [...redirectUris, ""]);
								}}
							>
								<span aria-hidden="true">+</span>
											{" "}
								{t("applicationEnvironmentConnect.stepTwo.addRedirectUri")}
							</Button>
						</Fieldset>
						<Fieldset
							legendSize="h3"
							hint={t(
								"applicationEnvironmentConnect.stepTwo.postLogoutUrlsHint"
							)}
							legend={t(
								"applicationEnvironmentConnect.stepTwo.postLogoutUrlsTitle"
							)}
						>
							{Array.from(
								{ length: postLogoutRedirectUriRowCount },
								(_, index) => (
									<Grid
										key={index}
										className="endpoint-url-row post-logout-url-row"
										columns="1fr"
										tag="div"
									>
										<Grid
											alignItems="start"
											className="endpoint-label-row"
											columns="auto auto 1fr"
											tag="div"
										>
											<GcdsLabel
												className="endpoint-label"
												labelFor={`post-logout-redirect-uri-control-${index}`}
												required={index === 0}
												label={t(
													"applicationEnvironmentConnect.stepTwo.postLogoutUrl",
													{ count: index + 1 }
												)}
											/>
											{postLogoutRedirectUriRowCount > 1 && index > 0 && (
												<Link
													href={`#post-logout-redirect-uri-${index}`}
														size="small"
													onGcdsClick={(event) => {
														event.preventDefault();
														setValue(
															"postLogoutRedirectUris",
															postLogoutRedirectUris.filter(
																(_, valueIndex) => valueIndex !== index
															)
														);
													}}
														>
														<span
															style={{
																alignItems: "center",
																display: "inline-flex",
																gap: "var(--gcds-spacing-100)",
															}}
														>
															<TrashIcon aria-hidden="true" height="1em" width="1em" />
															{t("common.remove")}
														</span>
												</Link>
											)}
										</Grid>
										<Controller
											control={control}
											name={`postLogoutRedirectUris.${index}` as const}
											render={({ field: inputField }) => (
												<Input
														hideLabel
													id={`post-logout-redirect-uri-control-${index}`}
													inputId={`post-logout-redirect-uri-${index}`}
													name={inputField.name}
													required={index === 0}
													value={inputField.value}
													errorMessage={stepTwoArrayErrorMessage(
														"postLogoutRedirectUris",
														index
													)}
													label={t(
														"applicationEnvironmentConnect.stepTwo.postLogoutUrl",
														{ count: index + 1 }
													)}
													onInput={(event) => {
														inputField.onChange(inputValue(event));
													}}
												/>
											)}
										/>
									</Grid>
								)
							)}
							<Button
								buttonRole="secondary"
								size="small"
								type="button"
								onGcdsClick={() => {
									setValue("postLogoutRedirectUris", [
										...postLogoutRedirectUris,
										"",
									]);
								}}
							>
								<span aria-hidden="true">+</span>
											{" "}
								{t(
									"applicationEnvironmentConnect.stepTwo.addPostLogoutRedirectUri"
								)}
							</Button>
						</Fieldset>
						<Controller
							control={control}
							name="singleSignOut"
							render={({ field }) => (
								<Radios
									required
									errorMessage={singleSignOutErrorMessage}
									id="single-sign-out-control"
									name={field.name}
									value={field.value === null ? undefined : String(field.value)}
										legend={t(
										"applicationEnvironmentConnect.stepTwo.singleSignOut"
									)}
									options={[
										{ id: "sso-yes", label: t("common.yes"), value: "true" },
											{ id: "sso-no", label: t("common.no"), value: "false" },
									]}
									onInput={(event) => {
										const singleSignOut = boolValue(event);
										field.onChange(singleSignOut);
										clearErrors("singleSignOut");
										if (!singleSignOut) {
											clearErrors(["logoutMethod", "signOutRequestUrl"]);
										}
									}}
								/>
							)}
						/>
						{values.singleSignOut && (
							<>
								<Controller
									control={control}
									name="logoutMethod"
									render={({ field }) => (
										<Radios
											required
											errorMessage={logoutMethodErrorMessage}
											id="logout-method-control"
											name={field.name}
											value={field.value}
											legend={t(
												"applicationEnvironmentConnect.stepTwo.logoutMethod"
											)}
											options={[
												{
													id: "front-channel",
													label: t(
														"applicationEnvironmentConnect.frontChannel"
													),
													value: "front_channel",
												},
												{
													id: "back-channel",
													label: t("applicationEnvironmentConnect.backChannel"),
													value: "back_channel",
												},
											]}
											onInput={(event) => {
												field.onChange(inputValue(event));
											}}
										/>
									)}
								/>
								<Controller
									control={control}
									name="signOutRequestUrl"
									render={({ field }) => (
										<Input
											required
											errorMessage={signOutRequestUrlErrorMessage}
											id="sign-out-request-url-control"
											inputId="sign-out-request-url"
											name={field.name}
											value={field.value}
											label={t(
												"applicationEnvironmentConnect.stepTwo.signOutRequestUrl"
											)}
											onInput={(event) => {
												field.onChange(inputValue(event));
											}}
										/>
									)}
								/>
							</>
						)}
					</Grid>
				)}
				{step === 2 && (
					<Grid columns="1fr" container="md" tag="div">
						<Heading tag="h1">
							{t("applicationEnvironmentConnect.stepThree.title")}
						</Heading>
						<Text marginBottom="0">{t("applicationEnvironmentConnect.stepThree.intro")}</Text>
						<Text marginBottom="0">
							{t("applicationEnvironmentConnect.stepThree.learnMorePrefix")}{" "}
							<Link href="/support">
								{t(
									"applicationEnvironmentConnect.stepThree.authenticationLink"
								)}
							</Link>
							.
						</Text>
						<Grid columns="1fr" tag="div">
							<Controller
								control={control}
								name="clientType"
								render={({ field }) => (
									<Radios
										required
										errorMessage={stepThreeErrorMessage("clientType")}
										id={STEP_THREE_FIELD_CONFIG.clientType.hostId}
										name={field.name}
										value={field.value ?? undefined}
										legend={t(
											"applicationEnvironmentConnect.stepThree.clientType"
										)}
										options={[
											{
												id: "client-public",
												label: t("applicationEnvironmentConnect.publicClient"),
												hint: t(
													"applicationEnvironmentConnect.stepThree.publicClientHint"
												),
												value: "public",
											},
											{
												id: "client-confidential",
												label: t(
													"applicationEnvironmentConnect.confidentialClient"
												),
												hint: t(
													"applicationEnvironmentConnect.stepThree.confidentialClientHint"
												),
												value: "confidential",
											},
										]}
										onInput={(event) => {
											const selectedClientType = inputValue(event);
											field.onChange(selectedClientType);
											if (selectedClientType === "public") {
												setValue("pkceSupported", true, {
													shouldValidate: true,
												});
											}
											clearErrors([
												"clientType",
												"pkceSupported",
												"clientAuthMethod",
												"jwksUri",
											]);
										}}
									/>
								)}
							/>
							<Controller
								control={control}
								name="pkceSupported"
								render={({ field }) => (
									<Radios
										required
										errorMessage={stepThreeErrorMessage("pkceSupported")}
										hint={t("applicationEnvironmentConnect.stepThree.pkceHint")}
										id={STEP_THREE_FIELD_CONFIG.pkceSupported.hostId}
										name={field.name}
										legend={t(
											"applicationEnvironmentConnect.stepThree.pkceSupported"
										)}
										options={[
											{ id: "pkce-yes", label: t("common.yes"), value: "true" },
											{ id: "pkce-no", label: t("common.no"), value: "false" },
										]}
										value={
											field.value === null ? undefined : String(field.value)
										}
										onInput={(event) => {
											field.onChange(boolValue(event));
											clearErrors("pkceSupported");
										}}
									/>
								)}
							/>
							{values.clientType === "confidential" && (
								<>
									<Controller
										control={control}
										name="clientAuthMethod"
										render={({ field }) => (
											<Radios
												required
												errorMessage={stepThreeErrorMessage("clientAuthMethod")}
												id={STEP_THREE_FIELD_CONFIG.clientAuthMethod.hostId}
												name={field.name}
												value={field.value ?? undefined}
												legend={t(
													"applicationEnvironmentConnect.stepThree.clientAuthMethod"
												)}
												options={[
													{
														id: "private-key-jwt",
														label: t(
															"applicationEnvironmentConnect.privateKeyJwt"
														),
														hint: t(
															"applicationEnvironmentConnect.stepThree.privateKeyJwtHint"
														),
														value: "private_key_jwt",
													},
													{
														id: "client-secret-basic",
														label: t(
															"applicationEnvironmentConnect.clientSecretBasic"
														),
														hint: t(
															"applicationEnvironmentConnect.stepThree.clientSecretBasicHint"
														),
														value: "client_secret_basic",
													},
													{
														id: "client-secret-post",
														label: t(
															"applicationEnvironmentConnect.clientSecretPost"
														),
														hint: t(
															"applicationEnvironmentConnect.stepThree.clientSecretPostHint"
														),
														value: "client_secret_post",
													},
												]}
												onInput={(event) => {
													field.onChange(inputValue(event));
													clearErrors(["clientAuthMethod", "jwksUri"]);
												}}
											/>
										)}
									/>
									{values.clientAuthMethod === "private_key_jwt" && (
										<Controller
											control={control}
											name="jwksUri"
											render={({ field }) => (
												<Input
													required
													errorMessage={stepThreeErrorMessage("jwksUri")}
													id={STEP_THREE_FIELD_CONFIG.jwksUri.hostId}
													inputId="jwks-uri"
													name={field.name}
													value={field.value}
													hint={t(
														"applicationEnvironmentConnect.stepThree.jwksUriHint"
													)}
													label={t(
														"applicationEnvironmentConnect.stepThree.jwksUri"
													)}
													onInput={(event) => {
														field.onChange(inputValue(event));
													}}
												/>
											)}
										/>
									)}
								</>
							)}
							<Controller
								control={control}
								name="sharesIdentifier"
								render={({ field }) => (
									<Radios
										required
										errorMessage={stepThreeErrorMessage("sharesIdentifier")}
										id={STEP_THREE_FIELD_CONFIG.sharesIdentifier.hostId}
										name={field.name}
										legend={t(
											"applicationEnvironmentConnect.stepThree.sharesIdentifier"
										)}
										options={[
											{
												id: "identifier-yes",
												label: t("common.yes"),
												value: "true",
											},
											{
													id: "identifier-no",
													label: t("common.no"),
													value: "false",
											},
										]}
										value={
											field.value === null ? undefined : String(field.value)
										}
										onInput={(event) => {
											const sharesIdentifier = boolValue(event);
											field.onChange(sharesIdentifier);
											clearErrors("sharesIdentifier");
											if (!sharesIdentifier) {
												clearErrors("sectorIdentifierUrl");
											}
										}}
									/>
								)}
							/>
							{values.sharesIdentifier && (
								<Controller
									control={control}
									name="sectorIdentifierUrl"
									render={({ field }) => (
										<Input
											required
											id={STEP_THREE_FIELD_CONFIG.sectorIdentifierUrl.hostId}
											inputId="sector-identifier-url"
											name={field.name}
											value={field.value}
											errorMessage={stepThreeErrorMessage(
												"sectorIdentifierUrl"
											)}
											label={t(
												"applicationEnvironmentConnect.stepThree.sectorIdentifierUrl"
											)}
											onInput={(event) => {
												field.onChange(inputValue(event));
											}}
										/>
									)}
								/>
							)}
						</Grid>
					</Grid>
				)}
				{step === 3 && (
					<Grid columns="1fr" container="md" tag="div">
						<Heading tag="h1">
							{t("applicationEnvironmentConnect.stepFour.title")}
						</Heading>
						<Text marginBottom="0">{t("applicationEnvironmentConnect.stepFour.intro")}</Text>
						<Text marginBottom="0">
							{t(
								"applicationEnvironmentConnect.stepFour.verificationRequirement"
							)}
						</Text>
						<Text marginBottom="0">
							{t("applicationEnvironmentConnect.stepFour.mustVerify")}{" "}
							<Link href="/support">
								{t("applicationEnvironmentConnect.stepFour.messageSecurity")}
							</Link>
							.
						</Text>
						<Fieldset
							legendSize="h3"
							legend={t(
								"applicationEnvironmentConnect.stepFour.verificationTitle"
							)}
						>
							<Controller
								control={control}
								name="verificationMessages"
								render={({ field }) => (
									<Checkboxes
										required
										errorMessage={stepFourErrorMessage("verificationMessages")}
										id={STEP_FOUR_FIELD_CONFIG.verificationMessages.hostId}
										name={field.name}
										value={field.value}
										legend={t(
											"applicationEnvironmentConnect.stepFour.verificationMessages"
										)}
										options={[
											{
												id: "verify-id-token",
												label: t("applicationEnvironmentConnect.idToken"),
												value: "id_token",
											},
											{
												id: "verify-userinfo",
												label: t("applicationEnvironmentConnect.userinfo"),
												value: "userinfo",
											},
										]}
										onInput={(event) => {
											field.onChange(event.target.value);
										}}
									/>
								)}
							/>
							<Controller
								control={control}
								name="verificationSignatureAlgorithms"
								render={({ field }) => (
									<Checkboxes
										required
										name={field.name}
										options={listOptions(SIGNING_ALGORITHMS, (value) => value)}
										value={field.value}
										errorMessage={stepFourErrorMessage(
											"verificationSignatureAlgorithms"
										)}
										id={
											STEP_FOUR_FIELD_CONFIG.verificationSignatureAlgorithms
												.hostId
										}
										legend={t(
											"applicationEnvironmentConnect.stepFour.verificationAlgorithms"
										)}
										onInput={(event) => {
											field.onChange(event.target.value);
										}}
									/>
								)}
							/>
						</Fieldset>
						<Fieldset
							legend={t("applicationEnvironmentConnect.stepFour.signingTitle")}
							legendSize="h3"
						>
							<Controller
								control={control}
								name="canSignMessages"
								render={({ field }) => (
									<Radios
										required
										errorMessage={stepFourErrorMessage("canSignMessages")}
										id={STEP_FOUR_FIELD_CONFIG.canSignMessages.hostId}
										name={field.name}
										legend={t(
											"applicationEnvironmentConnect.stepFour.canSignMessages"
										)}
										options={[
											{ id: "sign-yes", label: t("common.yes"), value: "true" },
											{ id: "sign-no", label: t("common.no"), value: "false" },
										]}
										value={
											field.value === null ? undefined : String(field.value)
										}
										onInput={(event) => {
											field.onChange(boolValue(event));
											clearErrors("canSignMessages");
										}}
									/>
								)}
							/>
							{values.canSignMessages && (
								<>
									<Controller
										control={control}
										name="signingMessages"
										render={({ field }) => (
											<Checkboxes
												required
												errorMessage={stepFourErrorMessage("signingMessages")}
												id={STEP_FOUR_FIELD_CONFIG.signingMessages.hostId}
												name={field.name}
												value={field.value}
												legend={t(
													"applicationEnvironmentConnect.stepFour.signingMessages"
												)}
												options={[
													{
														id: "sign-request",
														label: t(
															"applicationEnvironmentConnect.requestObject"
														),
														value: "request_object",
													},
													{
														id: "sign-token",
														label: t(
															"applicationEnvironmentConnect.tokenEndpoint"
														),
														value: "token_endpoint",
													},
												]}
												onInput={(event) => {
													field.onChange(event.target.value);
												}}
											/>
										)}
									/>
									<Controller
										control={control}
										name="signingSignatureAlgorithms"
										render={({ field }) => (
											<Checkboxes
												required
												name={field.name}
												value={field.value}
												errorMessage={stepFourErrorMessage(
													"signingSignatureAlgorithms"
												)}
												id={
													STEP_FOUR_FIELD_CONFIG.signingSignatureAlgorithms
														.hostId
												}
												legend={t(
													"applicationEnvironmentConnect.stepFour.signingAlgorithms"
												)}
												options={listOptions(
													SIGNING_ALGORITHMS,
													(value) => value
												)}
												onInput={(event) => {
													field.onChange(event.target.value);
												}}
											/>
										)}
									/>
								</>
							)}
						</Fieldset>
						<Fieldset
							legendSize="h3"
							legend={t(
								"applicationEnvironmentConnect.stepFour.encryptionTitle"
							)}
						>
							<Controller
								control={control}
								name="canEncryptRequests"
								render={({ field }) => (
									<Radios
										required
										errorMessage={stepFourErrorMessage("canEncryptRequests")}
										id={STEP_FOUR_FIELD_CONFIG.canEncryptRequests.hostId}
										name={field.name}
										legend={t(
											"applicationEnvironmentConnect.stepFour.canEncryptRequests"
										)}
										options={[
											{
												id: "encrypt-yes",
												label: t("common.yes"),
												value: "true",
											},
											{
													id: "encrypt-no",
													label: t("common.no"),
													value: "false",
											},
										]}
										value={
											field.value === null ? undefined : String(field.value)
										}
										onInput={(event) => {
											field.onChange(boolValue(event));
											clearErrors("canEncryptRequests");
										}}
									/>
								)}
							/>
							{values.canEncryptRequests && (
								<>
									<Controller
										control={control}
										name="encryptionKeyAlgorithms"
										render={({ field }) => (
											<Checkboxes
												required
												name={field.name}
												value={field.value}
												errorMessage={stepFourErrorMessage(
													"encryptionKeyAlgorithms"
												)}
												id={
													STEP_FOUR_FIELD_CONFIG.encryptionKeyAlgorithms.hostId
												}
												legend={t(
													"applicationEnvironmentConnect.stepFour.encryptionKeyAlgorithms"
												)}
												options={listOptions(
													ENCRYPTION_KEY_ALGORITHMS,
													(value) => value
												)}
												onInput={(event) => {
													field.onChange(event.target.value);
												}}
											/>
										)}
									/>
									<Controller
										control={control}
										name="encryptionContentAlgorithms"
										render={({ field }) => (
											<Checkboxes
												required
												name={field.name}
												value={field.value}
												errorMessage={stepFourErrorMessage(
													"encryptionContentAlgorithms"
												)}
												id={
													STEP_FOUR_FIELD_CONFIG.encryptionContentAlgorithms
														.hostId
												}
												legend={t(
													"applicationEnvironmentConnect.stepFour.encryptionContentAlgorithms"
												)}
												options={listOptions(
													ENCRYPTION_CONTENT_ALGORITHMS,
													(value) => value
												)}
												onInput={(event) => {
													field.onChange(event.target.value);
												}}
											/>
										)}
									/>
								</>
							)}
						</Fieldset>
						<Fieldset
							legendSize="h3"
							legend={t(
								"applicationEnvironmentConnect.stepFour.decryptionTitle"
							)}
						>
							<Controller
								control={control}
								name="canDecryptMessages"
								render={({ field }) => (
									<Radios
										required
										errorMessage={stepFourErrorMessage("canDecryptMessages")}
										id={STEP_FOUR_FIELD_CONFIG.canDecryptMessages.hostId}
										name={field.name}
										legend={t(
											"applicationEnvironmentConnect.stepFour.canDecryptMessages"
										)}
										options={[
											{
												id: "decrypt-yes",
												label: t("common.yes"),
												value: "true",
											},
											{
													id: "decrypt-no",
													label: t("common.no"),
													value: "false",
											},
										]}
										value={
											field.value === null ? undefined : String(field.value)
										}
										onInput={(event) => {
											field.onChange(boolValue(event));
											clearErrors("canDecryptMessages");
										}}
									/>
								)}
							/>
							{values.canDecryptMessages && (
								<>
									<Controller
										control={control}
										name="decryptionMessages"
										render={({ field }) => (
											<Checkboxes
												required
												id={STEP_FOUR_FIELD_CONFIG.decryptionMessages.hostId}
												name={field.name}
												value={field.value}
												errorMessage={stepFourErrorMessage(
													"decryptionMessages"
												)}
												legend={t(
													"applicationEnvironmentConnect.stepFour.decryptionMessages"
												)}
												options={[
													{
														id: "decrypt-token-response",
														label: t(
															"applicationEnvironmentConnect.tokenEndpointResponse"
														),
														value: "token_endpoint_response",
													},
													{
														id: "decrypt-id-token",
														label: t("applicationEnvironmentConnect.idToken"),
														value: "id_token",
													},
													{
														id: "decrypt-userinfo",
														label: t("applicationEnvironmentConnect.userinfo"),
														value: "userinfo",
													},
												]}
												onInput={(event) => {
													field.onChange(event.target.value);
												}}
											/>
										)}
									/>
									<Controller
										control={control}
										name="decryptionKeyAlgorithms"
										render={({ field }) => (
											<Checkboxes
												required
												name={field.name}
												value={field.value}
												errorMessage={stepFourErrorMessage(
													"decryptionKeyAlgorithms"
												)}
												id={
													STEP_FOUR_FIELD_CONFIG.decryptionKeyAlgorithms.hostId
												}
												legend={t(
													"applicationEnvironmentConnect.stepFour.decryptionKeyAlgorithms"
												)}
												options={listOptions(
													ENCRYPTION_KEY_ALGORITHMS,
													(value) => value
												)}
												onInput={(event) => {
													field.onChange(event.target.value);
												}}
											/>
										)}
									/>
									<Controller
										control={control}
										name="decryptionContentAlgorithms"
										render={({ field }) => (
											<Checkboxes
												required
												name={field.name}
												value={field.value}
												errorMessage={stepFourErrorMessage(
													"decryptionContentAlgorithms"
												)}
												id={
													STEP_FOUR_FIELD_CONFIG.decryptionContentAlgorithms
														.hostId
												}
												legend={t(
													"applicationEnvironmentConnect.stepFour.decryptionContentAlgorithms"
												)}
												options={listOptions(
													ENCRYPTION_CONTENT_ALGORITHMS,
													(value) => value
												)}
												onInput={(event) => {
													field.onChange(event.target.value);
												}}
											/>
										)}
									/>
								</>
							)}
						</Fieldset>
					</Grid>
				)}
				<div className="connect-environment-actions">
					<Grid alignItems="center" columns="auto auto 1fr" tag="div">
						{step < 3 ? (
							<Button
								type="button"
								onGcdsClick={() => {
									void handleNext();
								}}
							>
								{t("applicationEnvironmentConnect.continue")}
							</Button>
						) : (
							<Button disabled={isCreating} type="submit">
								{isCreating
									? t("applicationEnvironmentConnect.submitting")
									: t("applicationEnvironmentConnect.submit")}
							</Button>
						)}
						{step > 0 && (
							<Button
								buttonRole="secondary"
								type="button"
								onGcdsClick={handleBack}
							>
								{t("common.back")}
							</Button>
						)}
						{step === 0 && (
							<Link href={`/applications/${applicationUuid}/environments`}>
								{t("common.cancel")}
							</Link>
						)}
					</Grid>
				</div>
			</form>
		</Grid>
	);
};
