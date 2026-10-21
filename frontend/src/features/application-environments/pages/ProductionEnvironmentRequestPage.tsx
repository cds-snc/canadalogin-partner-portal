import { zodResolver } from "@hookform/resolvers/zod";
import { TrashIcon } from "@heroicons/react/24/outline";
import { useNavigate, useParams } from "@tanstack/react-router";
import { GcdsHint, GcdsLabel } from "@gcds-core/components-react";
import {
	Fragment,
	useEffect,
	useRef,
	useState,
	type FormEvent,
	type ReactNode,
} from "react";
import { Controller, useController, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import {
	Button,
	ConfigurationGrid,
	ErrorSummary,
	Fieldset,
	Grid,
	Heading,
	Icon,
	Input,
	Link,
	Notice,
	SrOnly,
	Stepper,
	Text,
} from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import { useApplicationEnvironment } from "../hooks/use-application-environment";
import { useApplicationEnvironments } from "../hooks/use-application-environments";
import { useApplicationEnvironmentManagement } from "../hooks/use-application-environment-management";
import {
	applicationEnvironmentSchema,
	DEFAULT_VALUES,
	stripEnvironmentTypePrefix,
	toPayload,
	type ApplicationEnvironmentFormValues,
} from "./connect-environment-form";
import "./environments-page.css";

const AUTHORIZATION_CODE_FLOW_URL =
	"https://openid.net/specs/openid-connect-core-1_0.html#AuthorizationEndpoint";

const inputValue = (event: FormEvent<Element>): string =>
	(event.target as HTMLInputElement).value;

type StepTwoArrayFieldName =
	| "redirectUris"
	| "postLogoutRedirectUris"
	| "outboundIps";

type StepThreeFieldName =
	| "clientType"
	| "pkceSupported"
	| "clientAuthMethod"
	| "jwksUri";

type SummaryChange = {
	field: string;
	focusId: string;
	step: number;
};

type SummaryRow = {
	change?: SummaryChange;
	field: ReactNode;
	value: ReactNode;
};

type SummarySection = {
	rows: Array<SummaryRow>;
	title: string;
};

const CONFIGURATION_FIELD_COLUMN_WIDTH = "16rem";
const ABSOLUTE_URL_PATTERN = /^[a-z][a-z\d+.-]*:\/\//i;

const isNonEmptyString = (value: unknown): value is string =>
	typeof value === "string" && value.trim().length > 0;

const formatValue = (
	value: unknown,
	inactiveLabel: string,
	formatToken: (token: string) => string
): string => {
	if (Array.isArray(value)) {
		return value.length > 0
			? value.map((item) => formatToken(String(item))).join(", ")
			: inactiveLabel;
	}
	if (isNonEmptyString(value)) {
		return formatToken(value);
	}
	return inactiveLabel;
};

const formatUrlList = (
	value: unknown,
	inactiveLabel: string,
	formatToken: (token: string) => string
): ReactNode => {
	if (!Array.isArray(value)) {
		return formatValue(value, inactiveLabel, formatToken);
	}

	const urls = value.map((item) => formatToken(String(item)));
	return urls.length > 0
		? urls.map((url, index) => (
				<Fragment key={`${url}-${index}`}>
					{index > 0 ? <br /> : null}
					{url}
				</Fragment>
			))
		: inactiveLabel;
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
};

export const ProductionEnvironmentRequestPage = (): FunctionComponent => {
	const { i18n, t } = useTranslation();
	const navigate = useNavigate({
		from: "/applications/$applicationUuid/environments/$environmentUuid/request-production",
	});
	const { applicationUuid, environmentUuid } = useParams({
		from: "/applications/$applicationUuid/environments/$environmentUuid/request-production",
	});
	const {
		data: environment,
		error: environmentError,
		isLoading: isEnvironmentLoading,
	} = useApplicationEnvironment(applicationUuid, environmentUuid);
	const { data: environments } = useApplicationEnvironments(
		applicationUuid,
		1,
		1
	);
	const { createEnvironment, error, isCreating } =
		useApplicationEnvironmentManagement(applicationUuid);
	const [step, setStep] = useState(0);
	const formRef = useRef<HTMLFormElement>(null);
	const initializedEnvironmentUuid = useRef<string | null>(null);
	const pendingFocusTarget = useRef<string | null>(null);
	const previousStep = useRef(step);
	const form = useForm<ApplicationEnvironmentFormValues>({
		defaultValues: { ...DEFAULT_VALUES, outboundIps: [""] },
		mode: "onBlur",
		resolver: zodResolver(applicationEnvironmentSchema),
	});
	const {
		control,
		formState: { errors },
		handleSubmit,
		reset,
		setValue,
		trigger,
	} = form;
	const values = useWatch({ control });
	const redirectUris = values.redirectUris ?? [];
	const postLogoutRedirectUris = values.postLogoutRedirectUris ?? [];
	const outboundIps = values.outboundIps ?? [];
	const redirectUriRowCount = Math.max(1, redirectUris.length);
	const postLogoutRedirectUriRowCount = Math.max(
		1,
		postLogoutRedirectUris.length
	);
	const outboundIpRowCount = Math.max(1, outboundIps.length);
	const applicationName =
		i18n.resolvedLanguage === "fr" && environments?.application.nameFr
			? environments.application.nameFr
			: (environments?.application.nameEn ??
				t("applicationEnvironmentConnect.applicationNameFallback"));
	const loadError = getRequestErrorNotice(environmentError, {
		bodyKey: "applicationEnvironmentProductionRequest.errorBody",
		titleKey: "applicationEnvironmentProductionRequest.errorTitle",
	});
	const requestError = getRequestErrorNotice(error, {
		bodyKey: "applicationEnvironmentConnect.submitErrorBody",
		titleKey: "applicationEnvironmentConnect.submitErrorTitle",
	});
	const environmentNameErrorMessage = errors.environmentName
		? t("applicationEnvironments.connect.validationEnvironmentName")
		: undefined;
	const applicationUrlEnErrorMessage = errors.applicationUrlEn
		? t("applicationEnvironments.connect.validationEnglishUrl")
		: undefined;
	const applicationUrlFrErrorMessage = errors.applicationUrlFr
		? t("applicationEnvironments.connect.validationFrenchUrl")
		: undefined;
	const stepOneErrorLinks: Record<string, string> = Object.fromEntries(
		[
			["#environment-name-control", environmentNameErrorMessage],
			["#application-url-en-control", applicationUrlEnErrorMessage],
			["#application-url-fr-control", applicationUrlFrErrorMessage],
		].filter((entry): entry is [string, string] => Boolean(entry[1]))
	);
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
		const errorKey =
			fieldName === "redirectUris"
				? "applicationEnvironmentConnect.stepTwo.validationRedirectUrl"
				: fieldName === "postLogoutRedirectUris"
					? "applicationEnvironmentConnect.stepTwo.validationPostLogoutUrl"
					: "applicationEnvironmentProductionRequest.validationOutboundIp";
		return stepTwoErrorMessage(itemError, errorKey);
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
	outboundIps.forEach((_, index) => {
		const errorMessage = stepTwoArrayErrorMessage("outboundIps", index);
		if (errorMessage) {
			stepTwoErrorLinks[`#outbound-ip-control-${index}`] = errorMessage;
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
	if (signOutRequestUrlErrorMessage) {
		stepTwoErrorLinks["#sign-out-request-url-control"] =
			signOutRequestUrlErrorMessage;
	}
	const stepThreeFieldNames = [
		"clientType",
		"pkceSupported",
		"clientAuthMethod",
		"jwksUri",
	] as const satisfies ReadonlyArray<StepThreeFieldName>;
	const stepThreeErrorLinks = Object.fromEntries(
		stepThreeFieldNames
			.filter((fieldName) => errors[fieldName])
			.map((fieldName) => [
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
	const logoutMethodLabel = values.logoutMethod
		? values.logoutMethod === "front_channel"
			? t("applicationEnvironmentConnect.frontChannel")
			: t("applicationEnvironmentConnect.backChannel")
		: t("applicationEnvironmentManagement.inactive");
	const clientTypeLabel =
		values.clientType === "public"
			? t("applicationEnvironmentConnect.publicClient")
			: values.clientType === "confidential"
				? t("applicationEnvironmentConnect.confidentialClient")
				: t("applicationEnvironmentManagement.inactive");
	const pkceSupportedLabel =
		values.pkceSupported === true
			? t("common.yes")
			: values.pkceSupported === false
				? t("common.no")
				: t("applicationEnvironmentManagement.inactive");
	const clientAuthMethodLabel =
		values.clientAuthMethod === "private_key_jwt"
			? t("applicationEnvironmentConnect.privateKeyJwt")
			: values.clientAuthMethod === "client_secret_basic"
				? t("applicationEnvironmentConnect.clientSecretBasic")
				: values.clientAuthMethod === "client_secret_post"
					? t("applicationEnvironmentConnect.clientSecretPost")
					: t("applicationEnvironmentManagement.inactive");
	const inactiveLabel = t("applicationEnvironmentManagement.inactive");
	const formatToken = (token: string): string => {
		if (ABSOLUTE_URL_PATTERN.test(token)) {
			return token;
		}
		const translationKey = `applicationEnvironmentManagement.values.${token}`;
		const translated = t(translationKey as never);
		return translated === translationKey ? token : translated;
	};
	const canSignMessages = values.canSignMessages === true;
	const canEncryptRequests = values.canEncryptRequests === true;
	const canDecryptMessages = values.canDecryptMessages === true;
	const summarySections: Array<SummarySection> = [
		{
			title: t("applicationEnvironmentManagement.sections.environment"),
			rows: [
				{
					field: t("applicationEnvironmentManagement.fields.environmentType"),
					value: t(
						"applicationEnvironmentProductionRequest.environmentType"
					),
				},
				{
					change: {
						field: t("applicationEnvironmentManagement.fields.environmentName"),
						focusId: "environment-name",
						step: 0,
					},
					field: t("applicationEnvironmentManagement.fields.environmentName"),
					value: formatValue(values.environmentName, inactiveLabel, formatToken),
				},
				{
					field: t(
						"applicationEnvironmentManagement.fields.productionStatus"
					),
					value: formatValue("submitted", inactiveLabel, formatToken),
				},
				{
					change: {
						field: t("applicationEnvironmentManagement.fields.englishUrl"),
						focusId: "application-url-en",
						step: 0,
					},
					field: t("applicationEnvironmentManagement.fields.englishUrl"),
					value: formatValue(values.applicationUrlEn, inactiveLabel, formatToken),
				},
				{
					change: {
						field: t("applicationEnvironmentManagement.fields.frenchUrl"),
						focusId: "application-url-fr",
						step: 0,
					},
					field: t("applicationEnvironmentManagement.fields.frenchUrl"),
					value: formatValue(values.applicationUrlFr, inactiveLabel, formatToken),
				},
			],
		},
		{
			title: t("applicationEnvironmentManagement.sections.connection"),
			rows: [
				{
					change: {
						field: t("applicationEnvironmentManagement.fields.redirectUris"),
						focusId: "redirect-uri-0",
						step: 1,
					},
					field: t("applicationEnvironmentManagement.fields.redirectUris"),
					value: formatUrlList(
						values.redirectUris,
						inactiveLabel,
						formatToken
					),
				},
				{
					change: {
						field: t(
							"applicationEnvironmentManagement.fields.postLogoutRedirectUris"
						),
						focusId: "post-logout-redirect-uri-0",
						step: 1,
					},
					field: t(
						"applicationEnvironmentManagement.fields.postLogoutRedirectUris"
					),
					value: formatUrlList(
						values.postLogoutRedirectUris,
						inactiveLabel,
						formatToken
					),
				},
				{
					field: t(
						"applicationEnvironmentManagement.fields.singleSignOutMethod"
					),
					value: values.singleSignOut
						? logoutMethodLabel
						: inactiveLabel,
				},
				...(values.singleSignOut
					? [
							{
								change: {
									field: t(
										"applicationEnvironmentManagement.fields.signOutRequestUrl"
									),
									focusId: "sign-out-request-url",
									step: 1,
								},
								field: t(
									"applicationEnvironmentManagement.fields.signOutRequestUrl"
								),
								value: formatValue(
									values.signOutRequestUrl,
									inactiveLabel,
									formatToken
								),
							},
						]
					: []),
				{
					change: {
						field: t("applicationEnvironmentManagement.fields.outboundIps"),
						focusId: "outbound-ip-0",
						step: 1,
					},
					field: t("applicationEnvironmentManagement.fields.outboundIps"),
					value: formatValue(values.outboundIps, inactiveLabel, formatToken),
				},
			],
		},
		{
			title: t("applicationEnvironmentManagement.sections.authentication"),
			rows: [
				{
					field: t("applicationEnvironmentManagement.fields.clientType"),
					value: clientTypeLabel,
				},
				{
					field: t("applicationEnvironmentManagement.fields.pkce"),
					value: pkceSupportedLabel,
				},
				...(values.clientType === "confidential"
					? [
							{
								field: t(
									"applicationEnvironmentManagement.fields.authenticationMethod"
								),
								value: clientAuthMethodLabel,
							},
							...(values.clientAuthMethod === "private_key_jwt"
								? [
										{
											change: {
												field: t(
													"applicationEnvironmentManagement.fields.jwksUri"
												),
												focusId: "jwks-uri",
												step: 2,
											},
											field: t(
												"applicationEnvironmentManagement.fields.jwksUri"
											),
											value: formatValue(
												values.jwksUri,
												inactiveLabel,
												formatToken
											),
										},
									]
								: []),
						]
					: []),
			],
		},
		{
			title: t("applicationEnvironmentManagement.sections.verificationSigning"),
			rows: [
				{
					field: t("applicationEnvironmentManagement.fields.messagesVerified"),
					value: formatValue(
						values.verificationMessages,
						inactiveLabel,
						formatToken
					),
				},
				{
					field: t(
						"applicationEnvironmentManagement.fields.verificationAlgorithms"
					),
					value: formatValue(
						values.verificationSignatureAlgorithms,
						inactiveLabel,
						formatToken
					),
				},
				{
					field: t("applicationEnvironmentManagement.fields.messagesSigned"),
					value: canSignMessages
						? formatValue(values.signingMessages, inactiveLabel, formatToken)
						: inactiveLabel,
				},
				...(canSignMessages
					? [
							{
								field: t(
									"applicationEnvironmentManagement.fields.signingAlgorithms"
								),
								value: formatValue(
									values.signingSignatureAlgorithms,
									inactiveLabel,
									formatToken
								),
							},
						]
					: []),
			],
		},
		{
			title: t(
				"applicationEnvironmentManagement.sections.encryptionDecryption"
			),
			rows: [
				{
					field: t(
						"applicationEnvironmentManagement.fields.requestsEncrypted"
					),
					value: canEncryptRequests
						? t("applicationEnvironmentManagement.enabled")
						: inactiveLabel,
				},
				...(canEncryptRequests
					? [
							{
								field: t(
									"applicationEnvironmentManagement.fields.encryptionKeyManagement"
								),
								value: formatValue(
									values.encryptionKeyAlgorithms,
									inactiveLabel,
									formatToken
								),
							},
							{
								field: t(
									"applicationEnvironmentManagement.fields.encryptionAlgorithms"
								),
								value: formatValue(
									values.encryptionContentAlgorithms,
									inactiveLabel,
									formatToken
								),
							},
						]
					: []),
				{
					field: t("applicationEnvironmentManagement.fields.messagesDecrypted"),
					value: canDecryptMessages
						? formatValue(values.decryptionMessages, inactiveLabel, formatToken)
						: inactiveLabel,
				},
				...(canDecryptMessages
					? [
							{
								field: t(
									"applicationEnvironmentManagement.fields.decryptionKeyManagement"
								),
								value: formatValue(
									values.decryptionKeyAlgorithms,
									inactiveLabel,
									formatToken
								),
							},
							{
								field: t(
									"applicationEnvironmentManagement.fields.decryptionAlgorithms"
								),
								value: formatValue(
									values.decryptionContentAlgorithms,
									inactiveLabel,
									formatToken
								),
							},
						]
					: []),
			],
		},
	];

	const environmentNameField = useController({
		control,
		name: "environmentName",
	});
	const applicationUrlEnField = useController({
		control,
		name: "applicationUrlEn",
	});
	const applicationUrlFrField = useController({
		control,
		name: "applicationUrlFr",
	});

	useEffect(() => {
		if (
			!environment ||
			initializedEnvironmentUuid.current === environment.uuid
		) {
			return;
		}
		initializedEnvironmentUuid.current = environment.uuid;

		reset({
			...DEFAULT_VALUES,
			...environment.config,
			applicationUrlEn: environment.config?.applicationUrlEn ?? "",
			applicationUrlFr: environment.config?.applicationUrlFr ?? "",
			environmentName: stripEnvironmentTypePrefix(
				environment.config?.environmentName ?? environment.partnerLabel
			),
			copyExisting: true,
			outboundIps: [""],
			sourceEnvironmentUuid: environment.uuid,
			tenantCode: "production",
			singleSignOut: true,
		});
	}, [environment, reset]);

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

	useEffect(() => {
		const targetId = pendingFocusTarget.current;
		if (!targetId) {
			return;
		}
		pendingFocusTarget.current = null;
		const target = document.getElementById(targetId);
		if (!target) {
			return;
		}
		target.focus();
		if (typeof target.scrollIntoView === "function") {
			target.scrollIntoView({ behavior: "smooth", block: "center" });
		}
	}, [step]);

	const stepFields: Array<Array<keyof ApplicationEnvironmentFormValues>> = [
		["environmentName", "applicationUrlEn", "applicationUrlFr"],
		[
			"redirectUris",
			"postLogoutRedirectUris",
			"outboundIps",
			"singleSignOut",
			"logoutMethod",
			"signOutRequestUrl",
		],
		["clientType", "pkceSupported", "clientAuthMethod", "jwksUri"],
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
		const isValid = await trigger(stepFields[step]);
		if (!isValid) {
			return;
		}
		setStep((currentStep) => Math.min(3, currentStep + 1));
	};
	const handleBack = (): void => {
		setStep((currentStep) => Math.max(0, currentStep - 1));
	};
	const handleSummaryChange = (event: Event, change: SummaryChange): void => {
		event.preventDefault();
		pendingFocusTarget.current = change.focusId;
		setStep(change.step);
	};
	const handleCreate = async (
		formValues: ApplicationEnvironmentFormValues
	): Promise<void> => {
		try {
			const result = await createEnvironment(toPayload(formValues));
			if (result) {
				void navigate({
					to: "/applications/$applicationUuid/environments/$environmentUuid",
					params: {
						applicationUuid,
						environmentUuid: result.uuid,
					},
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
				<div className="application-switch-icon">
					<Icon name="arrow-up-down" size="text" />
				</div>
				<Link href="/applications">
					{t("applicationEnvironmentConnect.switchApplication")}
				</Link>
			</Grid>
			{step === 0 && Object.keys(stepOneErrorLinks).length > 0 && (
				<ErrorSummary errorLinks={stepOneErrorLinks} listen={false} />
			)}
			{step === 1 && Object.keys(stepTwoErrorLinks).length > 0 && (
				<ErrorSummary errorLinks={stepTwoErrorLinks} listen={false} />
			)}
			{step === 2 && Object.keys(stepThreeErrorLinks).length > 0 && (
				<ErrorSummary errorLinks={stepThreeErrorLinks} listen={false} />
			)}
			{isEnvironmentLoading && (
				<Notice
					noticeRole="info"
					noticeTitleTag="h2"
					noticeTitle={t(
						"applicationEnvironmentProductionRequest.loadingTitle"
					)}
				>
					<Text>
						{t("applicationEnvironmentProductionRequest.loadingBody")}
					</Text>
				</Notice>
			)}
			{!isEnvironmentLoading && (loadError || !environment) && (
				<Notice
					noticeRole={loadError?.noticeRole ?? "danger"}
					noticeTitleTag="h2"
					noticeTitle={
						loadError
							? t(loadError.titleKey as never)
							: t("applicationEnvironmentProductionRequest.errorTitle")
					}
				>
					<Text>
						{loadError
							? (loadError.bodyText ?? t(loadError.bodyKey as never))
							: t("applicationEnvironmentProductionRequest.errorBody")}
					</Text>
				</Notice>
			)}
			{!isEnvironmentLoading && environment && !loadError && (
				<>
					{environment.tenantCode !== "staging" ? (
						<Notice
							noticeRole="danger"
							noticeTitleTag="h2"
							noticeTitle={t(
								"applicationEnvironmentProductionRequest.stagingRequiredTitle"
							)}
						>
							<Text>
								{t(
									"applicationEnvironmentProductionRequest.stagingRequiredBody"
								)}
							</Text>
						</Notice>
					) : (
						<form
							ref={formRef}
							noValidate
							onSubmit={handleSubmit(handleCreate)}
						>
							{requestError && (
								<Notice
									noticeRole="danger"
									noticeTitle={t(requestError.titleKey as never)}
									noticeTitleTag="h2"
								>
									<Text>{t(requestError.bodyKey as never)}</Text>
								</Notice>
							)}
							<Stepper
								currentStep={step + 1}
								tabIndex={0}
								tag="h2"
								totalSteps={4}
							>
								<SrOnly>
									{t("applicationEnvironmentProductionRequest.title")}
								</SrOnly>
							</Stepper>
							{step === 0 && (
								<Grid columns="1fr" container="md" tag="div">
									<Heading tag="h1">
										{t("applicationEnvironmentProductionRequest.title")}
									</Heading>
									<Text>
										{t(
											"applicationEnvironmentProductionRequest.requirementsIntro"
										)}
										<ul className="list-disc">
											<li>
												<Link external href={AUTHORIZATION_CODE_FLOW_URL}>
													{t(
														"applicationEnvironmentConnect.stepOne.authorizationCodeFlow"
													)}
												</Link>
											</li>
											<li>
												{t(
													"applicationEnvironmentProductionRequest.pkceRequirement"
												)}
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
											"applicationEnvironmentProductionRequest.ipAllowlistBody"
										)}
									</Text>
									<Text>
										{t(
											"applicationEnvironmentProductionRequest.stagingSettingsBody"
										)}
									</Text>
									<Text>
										<Link href="/support">
											{t(
												"applicationEnvironmentProductionRequest.requirementsLink"
											)}
										</Link>
										.
									</Text>
									<Text marginBottom="0">
										<strong>
											{t(
												"applicationEnvironmentProductionRequest.basedOnTitle"
											)}
										</strong>
										<br />
										{environment.config?.environmentName ?? environment.partnerLabel}
									</Text>
									<Grid columns="1fr" tag="section">
										<GcdsLabel
											required
											className="environment-name-label"
											labelFor="environment-name-control"
											label={t(
												"applicationEnvironmentConnect.stepOne.environmentName"
											)}
										/>
										<GcdsHint hintId="environment-name">
											{t(
												"applicationEnvironmentConnect.stepOne.environmentNameHint"
											)}
										</GcdsHint>
										<Grid alignItems="end" columns="auto 1fr" tag="div">
											<Text marginBottom="100" size="body">
												PROD-
											</Text>
											<Input
												hideLabel
												required
												ariaDescribedBy="hint-environment-name"
												className="environment-name-input"
												errorMessage={environmentNameErrorMessage}
												id="environment-name-control"
												inputId="environment-name"
												name={environmentNameField.field.name}
												value={environmentNameField.field.value}
												label={t(
													"applicationEnvironmentConnect.stepOne.environmentName"
												)}
												onInput={(event) => {
													environmentNameField.field.onChange(inputValue(event));
												}}
											/>
										</Grid>
									</Grid>
									<Input
										required
										errorMessage={applicationUrlEnErrorMessage}
										id="application-url-en-control"
										inputId="application-url-en"
										name={applicationUrlEnField.field.name}
										value={applicationUrlEnField.field.value}
										label={t(
											"applicationEnvironmentConnect.stepOne.applicationUrlEn"
										)}
										onInput={(event) => {
											applicationUrlEnField.field.onChange(inputValue(event));
										}}
									/>
									<Input
										required
										errorMessage={applicationUrlFrErrorMessage}
										id="application-url-fr-control"
										inputId="application-url-fr"
										name={applicationUrlFrField.field.name}
										value={applicationUrlFrField.field.value}
										hint={t(
											"applicationEnvironmentConnect.stepOne.applicationUrlFrHint"
										)}
										label={t(
											"applicationEnvironmentConnect.stepOne.applicationUrlFr"
										)}
										onInput={(event) => {
											applicationUrlFrField.field.onChange(inputValue(event));
										}}
									/>
								</Grid>
							)}
							{step === 1 && (
								<Grid columns="1fr" container="md" tag="div">
									<Heading tag="h1">
										{t("applicationEnvironmentConnect.stepTwo.title")}
									</Heading>
									<Text>
										{t("applicationEnvironmentConnect.stepTwo.intro")} 
										<Link href="/support">
											{t(
												"applicationEnvironmentConnect.stepTwo.requirementsLink"
											)}
										</Link>
									</Text>
									<Fieldset
										legendSize="h3"
										hint={t(
											"applicationEnvironmentConnect.stepTwo.redirectUrlsHint"
										)}
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
											<span aria-hidden="true">+</span>{" "}
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
											<span aria-hidden="true">+</span>{" "}
											{t(
												"applicationEnvironmentConnect.stepTwo.addPostLogoutRedirectUri"
											)}
										</Button>
									</Fieldset>
									<Fieldset
										legendSize="h3"
										hint={t(
											"applicationEnvironmentProductionRequest.outboundIpsHint"
										)}
										legend={t(
											"applicationEnvironmentProductionRequest.outboundIpsTitle"
										)}
									>
										{Array.from({ length: outboundIpRowCount }, (_, index) => (
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
														labelFor={`outbound-ip-control-${index}`}
														required={index === 0}
														label={t(
															"applicationEnvironmentProductionRequest.outboundIp",
															{ count: index + 1 }
														)}
													/>
													{outboundIpRowCount > 1 && index > 0 && (
														<Link
															href={`#outbound-ip-${index}`}
															size="small"
															onGcdsClick={(event) => {
																event.preventDefault();
																setValue(
																	"outboundIps",
																	outboundIps.filter(
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
													name={`outboundIps.${index}` as const}
													render={({ field: inputField }) => (
														<Input
															hideLabel
															id={`outbound-ip-control-${index}`}
															inputId={`outbound-ip-${index}`}
															name={inputField.name}
															required={index === 0}
															value={inputField.value}
															errorMessage={stepTwoArrayErrorMessage(
																"outboundIps",
																index
															)}
															label={t(
																"applicationEnvironmentProductionRequest.outboundIp",
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
												setValue("outboundIps", [...outboundIps, ""]);
											}}
										>
											<span aria-hidden="true">+</span>{" "}
											{t(
												"applicationEnvironmentProductionRequest.addOutboundIp"
											)}
										</Button>
									</Fieldset>
									<Text marginBottom="0">
										<strong>
											{t("applicationEnvironmentConnect.stepTwo.logoutMethod")}
										</strong>
										<br />
										{logoutMethodLabel}
									</Text>
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
								</Grid>
							)}
							{step === 2 && (
								<Grid columns="1fr" container="md" tag="div">
									<Heading tag="h1">
										{t("applicationEnvironmentConnect.stepThree.title")}
									</Heading>
									<Text marginBottom="0">
										{t("applicationEnvironmentConnect.stepThree.intro")}
									</Text>
									<Text marginBottom="0">
										{t("applicationEnvironmentConnect.stepThree.learnMorePrefix")} {" "}
										<Link href="/support">
											{t(
												"applicationEnvironmentConnect.stepThree.authenticationLink"
											)}
										</Link>
										.
									</Text>
									<Grid columns="1fr" tag="div">
										<Text marginBottom="0">
											<strong>
												{t("applicationEnvironmentConnect.stepThree.clientType")}
											</strong>
											<br />
											{clientTypeLabel}
										</Text>
										<Text marginBottom="0">
											<strong>
												{t("applicationEnvironmentConnect.stepThree.pkceSupported")}
											</strong>
											<br />
											{pkceSupportedLabel}
										</Text>
										{values.clientType === "confidential" && (
											<>
												<Text marginBottom="0">
													<strong>
														{t(
															"applicationEnvironmentProductionRequest.tokenAuthenticationMethod"
														)}
													</strong>
													<br />
													{clientAuthMethodLabel}
												</Text>
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
									</Grid>
								</Grid>
							)}
							{step === 3 && (
								<Grid columns="1fr" container="md" tag="div">
									<Heading tag="h1">
										{t(
											"applicationEnvironmentProductionRequest.checkAnswersTitle"
										)}
									</Heading>
									<Text marginBottom="0">
										{t(
											"applicationEnvironmentProductionRequest.checkAnswersIntro"
										)}
									</Text>
									{summarySections.map((section) => (
										<Grid key={section.title} columns="1fr" tag="section">
											<Heading marginBottom="0" tag="h2">
												{section.title}
											</Heading>
											<ConfigurationGrid
												ariaLabel={section.title}
												fieldColumnWidth={CONFIGURATION_FIELD_COLUMN_WIDTH}
												rows={section.rows.map(({ change, field, value }) => ({
													edit: change ? (
														<Link
															href={`#${change.focusId}`}
															ariaLabel={t(
																"applicationEnvironmentManagement.changeAccessible",
																{ field: change.field }
															)}
															onGcdsClick={(event) => {
																handleSummaryChange(event, change);
															}}
														>
															{t("applicationEnvironmentManagement.change")}
														</Link>
													) : null,
													field,
													value,
												}))}
											/>
										</Grid>
									))}
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
											{t("applicationEnvironmentProductionRequest.continue")}
										</Button>
									) : (
										<Button disabled={isCreating} type="submit">
											{isCreating
												? t("applicationEnvironmentConnect.submitting")
												: t(
														"applicationEnvironmentProductionRequest.submit"
													)}
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
										<Link
											href={`/applications/${applicationUuid}/environments/${environmentUuid}`}
										>
											{t("applicationEnvironmentProductionRequest.cancel")}
										</Link>
									)}
								</Grid>
							</div>
						</form>
					)}
				</>
			)}
		</Grid>
	);
};
