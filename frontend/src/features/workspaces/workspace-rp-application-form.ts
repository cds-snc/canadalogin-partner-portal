import type {
	ClientAuthMethod,
	ClientType,
	ContentEncryptionAlgorithm,
	KeyManagementAlgorithm,
	LogoutMode,
	MessageDecryptionTarget,
	PKCEAlgorithm,
	PrivateKeyDistributionMethod,
	RPApplicationRead,
	RPApplicationUpdate,
	RequestedScope,
	RequestEncryptionTarget,
	RegistrationDataStep,
	SignatureAlgorithm,
	SignatureValidationTarget,
	SigningTarget,
	CanadaLoginEnvironment,
	WorkspaceRPApplicationRegistrationAnswers,
	WorkspaceRPApplicationRegistrationDraftRead,
} from "@/fetch/rp-applications";

export type BooleanField = "" | "yes" | "no";

export type WorkspaceRPApplicationValidationMessageKey =
	| "workspaces.applicationsValidationRequiredAnswers"
	| "workspaces.applicationsValidationAuthorizationCodeFlowRequired"
	| "workspaces.applicationsValidationOpenIdScopeRequired"
	| "workspaces.applicationsValidationPublicClientPkceRequired"
	| "workspaces.applicationsValidationFrontChannelCanadaDomain"
	| "workspaces.applicationsValidationPrivateKeyDetailsRequired"
	| "workspaces.applicationsValidationPkceDetailsRequired"
	| "workspaces.applicationsValidationRequestSigningDetailsRequired"
	| "workspaces.applicationsValidationRequestSigningRoadmapRequired"
	| "workspaces.applicationsValidationSignatureValidationDetailsRequired"
	| "workspaces.applicationsValidationSignatureValidationRoadmapRequired"
	| "workspaces.applicationsValidationRequestEncryptionDetailsRequired"
	| "workspaces.applicationsValidationRequestEncryptionRoadmapRequired"
	| "workspaces.applicationsValidationMessageDecryptionDetailsRequired"
	| "workspaces.applicationsValidationMessageDecryptionRoadmapRequired";

export type WorkspaceRPApplicationFormState = {
	applicationEnvironmentUrlEn: string;
	applicationEnvironmentUrlFr: string;
	applicationInformationUuid: string;
	canadaLoginEnvironment: string;
	clientAuthMethod: string;
	clientType: string;
	jwksUri: string;
	logoutMode: string;
	logoutUri: string;
	messageDecryptionContentAlgorithms: Array<string>;
	messageDecryptionOtherContentAlgorithm: string;
	messageDecryptionOtherKeyManagementAlgorithm: string;
	messageDecryptionRevisitOn: string;
	messageDecryptionKeyManagementAlgorithms: Array<string>;
	messageDecryptionRoadmap: BooleanField;
	messageDecryptionSupported: BooleanField;
	messageDecryptionTargets: Array<string>;
	migrationSectorIdentifierUrl: string;
	offlineJwkOrCertificate: string;
	pkceAlgorithms: Array<string>;
	pkceOtherAlgorithm: string;
	pkceSupported: BooleanField;
	postLogoutRedirectUris: string;
	privateKeyDistributionMethod: string;
	redirectUris: string;
	requestEncryptionContentAlgorithms: Array<string>;
	requestEncryptionOtherContentAlgorithm: string;
	requestEncryptionOtherKeyManagementAlgorithm: string;
	requestEncryptionRevisitOn: string;
	requestEncryptionKeyManagementAlgorithms: Array<string>;
	requestEncryptionRoadmap: BooleanField;
	requestEncryptionSupported: BooleanField;
	requestEncryptionTargets: Array<string>;
	requestSigningAlgorithms: Array<string>;
	requestSigningOtherAlgorithm: string;
	requestSigningRevisitOn: string;
	requestSigningRoadmap: BooleanField;
	requestSigningSupported: BooleanField;
	requestSigningTargets: Array<string>;
	requestedScopes: Array<string>;
	sectorIdentifier: string;
	serviceNameEn: string;
	serviceNameFr: string;
	sharesPairwiseIdentifiers: BooleanField;
	signatureValidationAlgorithms: Array<string>;
	signatureValidationOtherAlgorithm: string;
	signatureValidationRevisitOn: string;
	signatureValidationRoadmap: BooleanField;
	signatureValidationSupported: BooleanField;
	signatureValidationTargets: Array<string>;
	supportsAuthorizationCodeFlow: BooleanField;
};

const readPayload = (
	application: RPApplicationRead
): Record<string, unknown> | null => {
	const payload = application.oidcRegistrationPayload;
	if (!payload || typeof payload !== "object") {
		return null;
	}

	return payload;
};

const readString = (
	payload: Record<string, unknown> | null,
	key: string
): string => {
	const value = payload?.[key];
	return typeof value === "string" ? value : "";
};

const readStringArray = (
	payload: Record<string, unknown> | null,
	key: string
): Array<string> => {
	const value = payload?.[key];
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter(
		(entry): entry is string =>
			typeof entry === "string" && entry.trim().length > 0
	);
};

const readBooleanField = (
	payload: Record<string, unknown> | null,
	key: string
): BooleanField => {
	const value = payload?.[key];
	if (value === true) {
		return "yes";
	}
	if (value === false) {
		return "no";
	}
	return "";
};

const toBoolean = (value: BooleanField): boolean | undefined => {
	if (value === "yes") {
		return true;
	}
	if (value === "no") {
		return false;
	}
	return undefined;
};

const parseLines = (value: string): Array<string> =>
	value
		.split("\n")
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);

const trimOrUndefined = (value: string): string | undefined => {
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
};

const arrayOrUndefined = (value: Array<string>): Array<string> | undefined =>
	value.length > 0 ? value : undefined;

const includesOther = (value: Array<string>): boolean =>
	value.includes("other");

const hasValue = (value: string): boolean => value.trim().length > 0;

const hasLineEntries = (value: string): boolean => parseLines(value).length > 0;

const isCanadaCaUrl = (value: string): boolean => {
	if (!hasValue(value)) {
		return false;
	}

	try {
		const hostname = new URL(value.trim()).hostname.toLowerCase();
		return hostname === "canada.ca" || hostname.endsWith(".canada.ca");
	} catch {
		return false;
	}
};

export const validateWorkspaceRPApplicationForm = (
	form: WorkspaceRPApplicationFormState
): Array<WorkspaceRPApplicationValidationMessageKey> => {
	const errors = new Set<WorkspaceRPApplicationValidationMessageKey>();
	const missingRequiredAnswers =
		!hasValue(form.canadaLoginEnvironment) ||
		!hasValue(form.serviceNameEn) ||
		!hasValue(form.serviceNameFr) ||
		!hasValue(form.applicationEnvironmentUrlEn) ||
		!hasValue(form.applicationEnvironmentUrlFr) ||
		!hasLineEntries(form.redirectUris) ||
		!hasValue(form.logoutMode) ||
		!hasValue(form.logoutUri) ||
		!hasValue(form.clientType) ||
		!hasValue(form.clientAuthMethod) ||
		!hasValue(form.sectorIdentifier) ||
		form.supportsAuthorizationCodeFlow === "" ||
		form.sharesPairwiseIdentifiers === "" ||
		form.pkceSupported === "" ||
		form.requestSigningSupported === "" ||
		form.signatureValidationSupported === "" ||
		form.requestEncryptionSupported === "" ||
		form.messageDecryptionSupported === "" ||
		form.requestedScopes.length === 0;

	if (missingRequiredAnswers) {
		errors.add("workspaces.applicationsValidationRequiredAnswers");
	}

	if (form.supportsAuthorizationCodeFlow !== "yes") {
		errors.add(
			"workspaces.applicationsValidationAuthorizationCodeFlowRequired"
		);
	}

	if (!form.requestedScopes.includes("openid")) {
		errors.add("workspaces.applicationsValidationOpenIdScopeRequired");
	}

	if (form.clientType === "public" && form.pkceSupported !== "yes") {
		errors.add("workspaces.applicationsValidationPublicClientPkceRequired");
	}

	if (
		form.logoutMode === "front_channel" &&
		(!isCanadaCaUrl(form.applicationEnvironmentUrlEn) ||
			!isCanadaCaUrl(form.applicationEnvironmentUrlFr))
	) {
		errors.add("workspaces.applicationsValidationFrontChannelCanadaDomain");
	}

	if (form.clientAuthMethod === "private_key_jwt") {
		const missingPrivateKeyDetails =
			!hasValue(form.privateKeyDistributionMethod) ||
			(form.privateKeyDistributionMethod === "jwks_uri" &&
				!hasValue(form.jwksUri)) ||
			(form.privateKeyDistributionMethod === "offline_exchange" &&
				!hasValue(form.offlineJwkOrCertificate));

		if (missingPrivateKeyDetails) {
			errors.add("workspaces.applicationsValidationPrivateKeyDetailsRequired");
		}
	}

	if (
		form.pkceSupported === "yes" &&
		(form.pkceAlgorithms.length === 0 ||
			(includesOther(form.pkceAlgorithms) &&
				!hasValue(form.pkceOtherAlgorithm)))
	) {
		errors.add("workspaces.applicationsValidationPkceDetailsRequired");
	}

	if (form.requestSigningSupported === "yes") {
		const missingRequestSigningDetails =
			form.requestSigningTargets.length === 0 ||
			form.requestSigningAlgorithms.length === 0 ||
			(includesOther(form.requestSigningAlgorithms) &&
				!hasValue(form.requestSigningOtherAlgorithm));

		if (missingRequestSigningDetails) {
			errors.add(
				"workspaces.applicationsValidationRequestSigningDetailsRequired"
			);
		}
	}

	if (
		form.requestSigningSupported === "no" &&
		(form.requestSigningRoadmap === "" ||
			(form.requestSigningRoadmap === "yes" &&
				!hasValue(form.requestSigningRevisitOn)))
	) {
		errors.add(
			"workspaces.applicationsValidationRequestSigningRoadmapRequired"
		);
	}

	if (form.signatureValidationSupported === "yes") {
		const missingSignatureValidationDetails =
			form.signatureValidationTargets.length === 0 ||
			form.signatureValidationAlgorithms.length === 0 ||
			(includesOther(form.signatureValidationAlgorithms) &&
				!hasValue(form.signatureValidationOtherAlgorithm));

		if (missingSignatureValidationDetails) {
			errors.add(
				"workspaces.applicationsValidationSignatureValidationDetailsRequired"
			);
		}
	}

	if (
		form.signatureValidationSupported === "no" &&
		(form.signatureValidationRoadmap === "" ||
			(form.signatureValidationRoadmap === "yes" &&
				!hasValue(form.signatureValidationRevisitOn)))
	) {
		errors.add(
			"workspaces.applicationsValidationSignatureValidationRoadmapRequired"
		);
	}

	if (form.requestEncryptionSupported === "yes") {
		const missingRequestEncryptionDetails =
			form.requestEncryptionTargets.length === 0 ||
			form.requestEncryptionKeyManagementAlgorithms.length === 0 ||
			form.requestEncryptionContentAlgorithms.length === 0 ||
			(includesOther(form.requestEncryptionKeyManagementAlgorithms) &&
				!hasValue(form.requestEncryptionOtherKeyManagementAlgorithm)) ||
			(includesOther(form.requestEncryptionContentAlgorithms) &&
				!hasValue(form.requestEncryptionOtherContentAlgorithm));

		if (missingRequestEncryptionDetails) {
			errors.add(
				"workspaces.applicationsValidationRequestEncryptionDetailsRequired"
			);
		}
	}

	if (
		form.requestEncryptionSupported === "no" &&
		(form.requestEncryptionRoadmap === "" ||
			(form.requestEncryptionRoadmap === "yes" &&
				!hasValue(form.requestEncryptionRevisitOn)))
	) {
		errors.add(
			"workspaces.applicationsValidationRequestEncryptionRoadmapRequired"
		);
	}

	if (form.messageDecryptionSupported === "yes") {
		const missingMessageDecryptionDetails =
			form.messageDecryptionTargets.length === 0 ||
			form.messageDecryptionKeyManagementAlgorithms.length === 0 ||
			form.messageDecryptionContentAlgorithms.length === 0 ||
			(includesOther(form.messageDecryptionKeyManagementAlgorithms) &&
				!hasValue(form.messageDecryptionOtherKeyManagementAlgorithm)) ||
			(includesOther(form.messageDecryptionContentAlgorithms) &&
				!hasValue(form.messageDecryptionOtherContentAlgorithm));

		if (missingMessageDecryptionDetails) {
			errors.add(
				"workspaces.applicationsValidationMessageDecryptionDetailsRequired"
			);
		}
	}

	if (
		form.messageDecryptionSupported === "no" &&
		(form.messageDecryptionRoadmap === "" ||
			(form.messageDecryptionRoadmap === "yes" &&
				!hasValue(form.messageDecryptionRevisitOn)))
	) {
		errors.add(
			"workspaces.applicationsValidationMessageDecryptionRoadmapRequired"
		);
	}

	return Array.from(errors);
};

export const validateWorkspaceRPApplicationStep = (
	form: WorkspaceRPApplicationFormState,
	step: RegistrationDataStep
): Array<WorkspaceRPApplicationValidationMessageKey> => {
	const errors = new Set<WorkspaceRPApplicationValidationMessageKey>();
	if (
		step === "basics" &&
		(!hasValue(form.canadaLoginEnvironment) ||
			!hasValue(form.serviceNameEn) ||
			!hasValue(form.serviceNameFr))
	) {
		errors.add("workspaces.applicationsValidationRequiredAnswers");
	}
	if (
		step === "endpoints" &&
		(!hasValue(form.applicationEnvironmentUrlEn) ||
			!hasValue(form.applicationEnvironmentUrlFr) ||
			!hasLineEntries(form.redirectUris) ||
			!hasValue(form.logoutMode) ||
			!hasValue(form.logoutUri))
	) {
		errors.add("workspaces.applicationsValidationRequiredAnswers");
	}
	if (
		step === "endpoints" &&
		form.logoutMode === "front_channel" &&
		(!isCanadaCaUrl(form.applicationEnvironmentUrlEn) ||
			!isCanadaCaUrl(form.applicationEnvironmentUrlFr))
	) {
		errors.add("workspaces.applicationsValidationFrontChannelCanadaDomain");
	}
	if (step === "client-and-access") {
		for (const error of validateWorkspaceRPApplicationForm({
			...form,
			applicationEnvironmentUrlEn: "https://canada.ca",
			applicationEnvironmentUrlFr: "https://canada.ca/fr",
			canadaLoginEnvironment: form.canadaLoginEnvironment || "test",
			logoutMode: "back_channel",
			logoutUri: "https://canada.ca/logout",
			messageDecryptionSupported: "no",
			messageDecryptionRoadmap: "no",
			redirectUris: "https://canada.ca/callback",
			requestEncryptionSupported: "no",
			requestEncryptionRoadmap: "no",
			requestSigningSupported: "no",
			requestSigningRoadmap: "no",
			serviceNameEn: form.serviceNameEn || "Service",
			serviceNameFr: form.serviceNameFr || "Service",
			signatureValidationSupported: "no",
			signatureValidationRoadmap: "no",
		})) {
			if (
				error.includes("AuthorizationCode") ||
				error.includes("OpenId") ||
				error.includes("PublicClient") ||
				error.includes("PrivateKey") ||
				error.includes("Pkce") ||
				error.endsWith("RequiredAnswers")
			) {
				errors.add(error);
			}
		}
	}
	if (step === "signing") {
		const allErrors = validateWorkspaceRPApplicationForm({
			...form,
			applicationEnvironmentUrlEn: "https://canada.ca",
			applicationEnvironmentUrlFr: "https://canada.ca/fr",
			canadaLoginEnvironment: "test",
			clientAuthMethod: "client_secret_basic",
			clientType: "confidential",
			logoutMode: "back_channel",
			logoutUri: "https://canada.ca/logout",
			messageDecryptionSupported: "no",
			messageDecryptionRoadmap: "no",
			pkceSupported: "no",
			redirectUris: "https://canada.ca/callback",
			requestedScopes: ["openid"],
			requestEncryptionSupported: "no",
			requestEncryptionRoadmap: "no",
			sectorIdentifier: "https://canada.ca",
			serviceNameEn: "Service",
			serviceNameFr: "Service",
			sharesPairwiseIdentifiers: "no",
			supportsAuthorizationCodeFlow: "yes",
		});
		for (const error of allErrors.filter(
			(error) =>
				error.includes("RequestSigning") ||
				error.includes("SignatureValidation") ||
				error.endsWith("RequiredAnswers")
		)) {
			errors.add(error);
		}
	}
	if (step === "encryption") {
		const allErrors = validateWorkspaceRPApplicationForm({
			...form,
			applicationEnvironmentUrlEn: "https://canada.ca",
			applicationEnvironmentUrlFr: "https://canada.ca/fr",
			canadaLoginEnvironment: "test",
			clientAuthMethod: "client_secret_basic",
			clientType: "confidential",
			logoutMode: "back_channel",
			logoutUri: "https://canada.ca/logout",
			pkceSupported: "no",
			redirectUris: "https://canada.ca/callback",
			requestedScopes: ["openid"],
			requestSigningSupported: "no",
			requestSigningRoadmap: "no",
			sectorIdentifier: "https://canada.ca",
			serviceNameEn: "Service",
			serviceNameFr: "Service",
			sharesPairwiseIdentifiers: "no",
			signatureValidationSupported: "no",
			signatureValidationRoadmap: "no",
			supportsAuthorizationCodeFlow: "yes",
		});
		for (const error of allErrors.filter(
			(error) =>
				error.includes("RequestEncryption") ||
				error.includes("MessageDecryption") ||
				error.endsWith("RequiredAnswers")
		)) {
			errors.add(error);
		}
	}
	return [...errors];
};

export type WorkspaceRPApplicationFieldErrorKeys = Partial<
	Record<
		keyof WorkspaceRPApplicationFormState,
		WorkspaceRPApplicationValidationMessageKey
	>
>;

const REQUIRED_FIELDS_BY_STEP: Record<
	RegistrationDataStep,
	Array<keyof WorkspaceRPApplicationFormState>
> = {
	basics: ["canadaLoginEnvironment", "serviceNameEn", "serviceNameFr"],
	"client-and-access": [
		"supportsAuthorizationCodeFlow",
		"clientType",
		"clientAuthMethod",
		"requestedScopes",
		"sectorIdentifier",
		"sharesPairwiseIdentifiers",
		"pkceSupported",
	],
	endpoints: [
		"applicationEnvironmentUrlEn",
		"applicationEnvironmentUrlFr",
		"redirectUris",
		"logoutMode",
		"logoutUri",
	],
	encryption: ["requestEncryptionSupported", "messageDecryptionSupported"],
	signing: ["requestSigningSupported", "signatureValidationSupported"],
};

const answerIsMissing = (value: string | Array<string>): boolean =>
	Array.isArray(value) ? value.length === 0 : !hasValue(value);

export const getWorkspaceRPApplicationStepFieldErrorKeys = (
	form: WorkspaceRPApplicationFormState,
	step: RegistrationDataStep,
	messageKeys: Array<WorkspaceRPApplicationValidationMessageKey>
): WorkspaceRPApplicationFieldErrorKeys => {
	const fieldErrors: WorkspaceRPApplicationFieldErrorKeys = {};
	const setError = (
		field: keyof WorkspaceRPApplicationFormState,
		messageKey: WorkspaceRPApplicationValidationMessageKey
	): void => {
		fieldErrors[field] ??= messageKey;
	};

	for (const messageKey of messageKeys) {
		if (messageKey === "workspaces.applicationsValidationRequiredAnswers") {
			for (const field of REQUIRED_FIELDS_BY_STEP[step]) {
				if (answerIsMissing(form[field])) setError(field, messageKey);
			}
			continue;
		}

		if (
			messageKey ===
			"workspaces.applicationsValidationAuthorizationCodeFlowRequired"
		) {
			setError("supportsAuthorizationCodeFlow", messageKey);
		} else if (
			messageKey === "workspaces.applicationsValidationOpenIdScopeRequired"
		) {
			setError("requestedScopes", messageKey);
		} else if (
			messageKey === "workspaces.applicationsValidationPublicClientPkceRequired"
		) {
			setError("pkceSupported", messageKey);
		} else if (
			messageKey === "workspaces.applicationsValidationFrontChannelCanadaDomain"
		) {
			if (!isCanadaCaUrl(form.applicationEnvironmentUrlEn))
				setError("applicationEnvironmentUrlEn", messageKey);
			if (!isCanadaCaUrl(form.applicationEnvironmentUrlFr))
				setError("applicationEnvironmentUrlFr", messageKey);
		} else if (
			messageKey ===
			"workspaces.applicationsValidationPrivateKeyDetailsRequired"
		) {
			if (!hasValue(form.privateKeyDistributionMethod)) {
				setError("privateKeyDistributionMethod", messageKey);
			} else if (
				form.privateKeyDistributionMethod === "jwks_uri" &&
				!hasValue(form.jwksUri)
			) {
				setError("jwksUri", messageKey);
			} else if (
				form.privateKeyDistributionMethod === "offline_exchange" &&
				!hasValue(form.offlineJwkOrCertificate)
			) {
				setError("offlineJwkOrCertificate", messageKey);
			}
		} else if (
			messageKey === "workspaces.applicationsValidationPkceDetailsRequired"
		) {
			if (form.pkceAlgorithms.length === 0)
				setError("pkceAlgorithms", messageKey);
			if (
				includesOther(form.pkceAlgorithms) &&
				!hasValue(form.pkceOtherAlgorithm)
			)
				setError("pkceOtherAlgorithm", messageKey);
		} else if (
			messageKey ===
			"workspaces.applicationsValidationRequestSigningDetailsRequired"
		) {
			if (form.requestSigningTargets.length === 0)
				setError("requestSigningTargets", messageKey);
			if (form.requestSigningAlgorithms.length === 0)
				setError("requestSigningAlgorithms", messageKey);
			if (
				includesOther(form.requestSigningAlgorithms) &&
				!hasValue(form.requestSigningOtherAlgorithm)
			)
				setError("requestSigningOtherAlgorithm", messageKey);
		} else if (
			messageKey ===
			"workspaces.applicationsValidationSignatureValidationDetailsRequired"
		) {
			if (form.signatureValidationTargets.length === 0)
				setError("signatureValidationTargets", messageKey);
			if (form.signatureValidationAlgorithms.length === 0)
				setError("signatureValidationAlgorithms", messageKey);
			if (
				includesOther(form.signatureValidationAlgorithms) &&
				!hasValue(form.signatureValidationOtherAlgorithm)
			)
				setError("signatureValidationOtherAlgorithm", messageKey);
		} else if (
			messageKey ===
			"workspaces.applicationsValidationRequestSigningRoadmapRequired"
		) {
			if (form.requestSigningRoadmap === "")
				setError("requestSigningRoadmap", messageKey);
			if (
				form.requestSigningRoadmap === "yes" &&
				!hasValue(form.requestSigningRevisitOn)
			)
				setError("requestSigningRevisitOn", messageKey);
		} else if (
			messageKey ===
			"workspaces.applicationsValidationSignatureValidationRoadmapRequired"
		) {
			if (form.signatureValidationRoadmap === "")
				setError("signatureValidationRoadmap", messageKey);
			if (
				form.signatureValidationRoadmap === "yes" &&
				!hasValue(form.signatureValidationRevisitOn)
			)
				setError("signatureValidationRevisitOn", messageKey);
		} else if (
			messageKey ===
			"workspaces.applicationsValidationRequestEncryptionDetailsRequired"
		) {
			for (const field of [
				"requestEncryptionTargets",
				"requestEncryptionKeyManagementAlgorithms",
				"requestEncryptionContentAlgorithms",
			] as const) {
				if (form[field].length === 0) setError(field, messageKey);
			}
			if (
				includesOther(form.requestEncryptionKeyManagementAlgorithms) &&
				!hasValue(form.requestEncryptionOtherKeyManagementAlgorithm)
			)
				setError("requestEncryptionOtherKeyManagementAlgorithm", messageKey);
			if (
				includesOther(form.requestEncryptionContentAlgorithms) &&
				!hasValue(form.requestEncryptionOtherContentAlgorithm)
			)
				setError("requestEncryptionOtherContentAlgorithm", messageKey);
		} else if (
			messageKey ===
			"workspaces.applicationsValidationMessageDecryptionDetailsRequired"
		) {
			for (const field of [
				"messageDecryptionTargets",
				"messageDecryptionKeyManagementAlgorithms",
				"messageDecryptionContentAlgorithms",
			] as const) {
				if (form[field].length === 0) setError(field, messageKey);
			}
			if (
				includesOther(form.messageDecryptionKeyManagementAlgorithms) &&
				!hasValue(form.messageDecryptionOtherKeyManagementAlgorithm)
			)
				setError("messageDecryptionOtherKeyManagementAlgorithm", messageKey);
			if (
				includesOther(form.messageDecryptionContentAlgorithms) &&
				!hasValue(form.messageDecryptionOtherContentAlgorithm)
			)
				setError("messageDecryptionOtherContentAlgorithm", messageKey);
		} else if (
			messageKey ===
			"workspaces.applicationsValidationRequestEncryptionRoadmapRequired"
		) {
			if (form.requestEncryptionRoadmap === "")
				setError("requestEncryptionRoadmap", messageKey);
			if (
				form.requestEncryptionRoadmap === "yes" &&
				!hasValue(form.requestEncryptionRevisitOn)
			)
				setError("requestEncryptionRevisitOn", messageKey);
		} else if (
			messageKey ===
			"workspaces.applicationsValidationMessageDecryptionRoadmapRequired"
		) {
			if (form.messageDecryptionRoadmap === "")
				setError("messageDecryptionRoadmap", messageKey);
			if (
				form.messageDecryptionRoadmap === "yes" &&
				!hasValue(form.messageDecryptionRevisitOn)
			)
				setError("messageDecryptionRevisitOn", messageKey);
		}
	}

	return fieldErrors;
};

const buildBasePayload = (
	form: WorkspaceRPApplicationFormState
): RPApplicationUpdate => {
	const payload: RPApplicationUpdate = {};
	const applicationInformationUuid = trimOrUndefined(
		form.applicationInformationUuid
	);
	if (applicationInformationUuid) {
		payload.applicationInformationUuid = applicationInformationUuid;
	}

	const environment = trimOrUndefined(form.canadaLoginEnvironment);
	if (environment) {
		payload.canadaLoginEnvironment = environment as CanadaLoginEnvironment;
	}

	const serviceNameEn = trimOrUndefined(form.serviceNameEn);
	if (serviceNameEn) {
		payload.serviceNameEn = serviceNameEn;
	}
	const serviceNameFr = trimOrUndefined(form.serviceNameFr);
	if (serviceNameFr) {
		payload.serviceNameFr = serviceNameFr;
	}
	const applicationEnvironmentUrlEn = trimOrUndefined(
		form.applicationEnvironmentUrlEn
	);
	if (applicationEnvironmentUrlEn) {
		payload.applicationEnvironmentUrlEn = applicationEnvironmentUrlEn;
	}
	const applicationEnvironmentUrlFr = trimOrUndefined(
		form.applicationEnvironmentUrlFr
	);
	if (applicationEnvironmentUrlFr) {
		payload.applicationEnvironmentUrlFr = applicationEnvironmentUrlFr;
	}

	const redirectUris = parseLines(form.redirectUris);
	if (redirectUris.length > 0) {
		payload.redirectUris = redirectUris;
	}
	const postLogoutRedirectUris = parseLines(form.postLogoutRedirectUris);
	if (postLogoutRedirectUris.length > 0) {
		payload.postLogoutRedirectUris = postLogoutRedirectUris;
	}

	const logoutMode = trimOrUndefined(form.logoutMode);
	if (logoutMode) {
		payload.logoutMode = logoutMode as LogoutMode;
	}
	const logoutUri = trimOrUndefined(form.logoutUri);
	if (logoutUri) {
		payload.logoutUri = logoutUri;
	}

	const clientType = trimOrUndefined(form.clientType);
	if (clientType) {
		payload.clientType = clientType as ClientType;
	}
	const supportsAuthorizationCodeFlow = toBoolean(
		form.supportsAuthorizationCodeFlow
	);
	if (typeof supportsAuthorizationCodeFlow === "boolean") {
		payload.supportsAuthorizationCodeFlow = supportsAuthorizationCodeFlow;
	}
	const clientAuthMethod = trimOrUndefined(form.clientAuthMethod);
	if (clientAuthMethod) {
		payload.clientAuthMethod = clientAuthMethod as ClientAuthMethod;
	}
	const privateKeyDistributionMethod = trimOrUndefined(
		form.privateKeyDistributionMethod
	);
	if (privateKeyDistributionMethod) {
		payload.privateKeyDistributionMethod =
			privateKeyDistributionMethod as PrivateKeyDistributionMethod;
	}
	const jwksUri = trimOrUndefined(form.jwksUri);
	if (jwksUri) {
		payload.jwksUri = jwksUri;
	}
	const offlineJwkOrCertificate = trimOrUndefined(form.offlineJwkOrCertificate);
	if (offlineJwkOrCertificate) {
		payload.offlineJwkOrCertificate = offlineJwkOrCertificate;
	}

	const requestedScopes = arrayOrUndefined(form.requestedScopes);
	if (requestedScopes) {
		payload.requestedScopes = requestedScopes as Array<RequestedScope>;
	}
	const sectorIdentifier = trimOrUndefined(form.sectorIdentifier);
	if (sectorIdentifier) {
		payload.sectorIdentifier = sectorIdentifier;
	}
	const sharesPairwiseIdentifiers = toBoolean(form.sharesPairwiseIdentifiers);
	if (typeof sharesPairwiseIdentifiers === "boolean") {
		payload.sharesPairwiseIdentifiers = sharesPairwiseIdentifiers;
	}
	const migrationSectorIdentifierUrl = trimOrUndefined(
		form.migrationSectorIdentifierUrl
	);
	if (migrationSectorIdentifierUrl) {
		payload.migrationSectorIdentifierUrl = migrationSectorIdentifierUrl;
	}

	const pkceSupported = toBoolean(form.pkceSupported);
	if (typeof pkceSupported === "boolean") {
		payload.pkceSupported = pkceSupported;
	}
	const pkceAlgorithms = arrayOrUndefined(form.pkceAlgorithms);
	if (pkceAlgorithms) {
		payload.pkceAlgorithms = pkceAlgorithms as Array<PKCEAlgorithm>;
	}
	const pkceOtherAlgorithm = trimOrUndefined(form.pkceOtherAlgorithm);
	if (pkceOtherAlgorithm) {
		payload.pkceOtherAlgorithm = pkceOtherAlgorithm;
	}

	const requestSigningSupported = toBoolean(form.requestSigningSupported);
	if (typeof requestSigningSupported === "boolean") {
		payload.requestSigningSupported = requestSigningSupported;
	}
	const requestSigningTargets = arrayOrUndefined(form.requestSigningTargets);
	if (requestSigningTargets) {
		payload.requestSigningTargets =
			requestSigningTargets as Array<SigningTarget>;
	}
	const requestSigningAlgorithms = arrayOrUndefined(
		form.requestSigningAlgorithms
	);
	if (requestSigningAlgorithms) {
		payload.requestSigningAlgorithms =
			requestSigningAlgorithms as Array<SignatureAlgorithm>;
	}
	const requestSigningOtherAlgorithm = trimOrUndefined(
		form.requestSigningOtherAlgorithm
	);
	if (requestSigningOtherAlgorithm) {
		payload.requestSigningOtherAlgorithm = requestSigningOtherAlgorithm;
	}
	const requestSigningRoadmap = toBoolean(form.requestSigningRoadmap);
	if (typeof requestSigningRoadmap === "boolean") {
		payload.requestSigningRoadmap = requestSigningRoadmap;
	}
	const requestSigningRevisitOn = trimOrUndefined(form.requestSigningRevisitOn);
	if (requestSigningRevisitOn) {
		payload.requestSigningRevisitOn = requestSigningRevisitOn;
	}

	const signatureValidationSupported = toBoolean(
		form.signatureValidationSupported
	);
	if (typeof signatureValidationSupported === "boolean") {
		payload.signatureValidationSupported = signatureValidationSupported;
	}
	const signatureValidationTargets = arrayOrUndefined(
		form.signatureValidationTargets
	);
	if (signatureValidationTargets) {
		payload.signatureValidationTargets =
			signatureValidationTargets as Array<SignatureValidationTarget>;
	}
	const signatureValidationAlgorithms = arrayOrUndefined(
		form.signatureValidationAlgorithms
	);
	if (signatureValidationAlgorithms) {
		payload.signatureValidationAlgorithms =
			signatureValidationAlgorithms as Array<SignatureAlgorithm>;
	}
	const signatureValidationOtherAlgorithm = trimOrUndefined(
		form.signatureValidationOtherAlgorithm
	);
	if (signatureValidationOtherAlgorithm) {
		payload.signatureValidationOtherAlgorithm =
			signatureValidationOtherAlgorithm;
	}
	const signatureValidationRoadmap = toBoolean(form.signatureValidationRoadmap);
	if (typeof signatureValidationRoadmap === "boolean") {
		payload.signatureValidationRoadmap = signatureValidationRoadmap;
	}
	const signatureValidationRevisitOn = trimOrUndefined(
		form.signatureValidationRevisitOn
	);
	if (signatureValidationRevisitOn) {
		payload.signatureValidationRevisitOn = signatureValidationRevisitOn;
	}

	const requestEncryptionSupported = toBoolean(form.requestEncryptionSupported);
	if (typeof requestEncryptionSupported === "boolean") {
		payload.requestEncryptionSupported = requestEncryptionSupported;
	}
	const requestEncryptionTargets = arrayOrUndefined(
		form.requestEncryptionTargets
	);
	if (requestEncryptionTargets) {
		payload.requestEncryptionTargets =
			requestEncryptionTargets as Array<RequestEncryptionTarget>;
	}
	const requestEncryptionKeyManagementAlgorithms = arrayOrUndefined(
		form.requestEncryptionKeyManagementAlgorithms
	);
	if (requestEncryptionKeyManagementAlgorithms) {
		payload.requestEncryptionKeyManagementAlgorithms =
			requestEncryptionKeyManagementAlgorithms as Array<KeyManagementAlgorithm>;
	}
	const requestEncryptionOtherKeyManagementAlgorithm = trimOrUndefined(
		form.requestEncryptionOtherKeyManagementAlgorithm
	);
	if (requestEncryptionOtherKeyManagementAlgorithm) {
		payload.requestEncryptionOtherKeyManagementAlgorithm =
			requestEncryptionOtherKeyManagementAlgorithm;
	}
	const requestEncryptionContentAlgorithms = arrayOrUndefined(
		form.requestEncryptionContentAlgorithms
	);
	if (requestEncryptionContentAlgorithms) {
		payload.requestEncryptionContentAlgorithms =
			requestEncryptionContentAlgorithms as Array<ContentEncryptionAlgorithm>;
	}
	const requestEncryptionOtherContentAlgorithm = trimOrUndefined(
		form.requestEncryptionOtherContentAlgorithm
	);
	if (requestEncryptionOtherContentAlgorithm) {
		payload.requestEncryptionOtherContentAlgorithm =
			requestEncryptionOtherContentAlgorithm;
	}
	const requestEncryptionRoadmap = toBoolean(form.requestEncryptionRoadmap);
	if (typeof requestEncryptionRoadmap === "boolean") {
		payload.requestEncryptionRoadmap = requestEncryptionRoadmap;
	}
	const requestEncryptionRevisitOn = trimOrUndefined(
		form.requestEncryptionRevisitOn
	);
	if (requestEncryptionRevisitOn) {
		payload.requestEncryptionRevisitOn = requestEncryptionRevisitOn;
	}

	const messageDecryptionSupported = toBoolean(form.messageDecryptionSupported);
	if (typeof messageDecryptionSupported === "boolean") {
		payload.messageDecryptionSupported = messageDecryptionSupported;
	}
	const messageDecryptionTargets = arrayOrUndefined(
		form.messageDecryptionTargets
	);
	if (messageDecryptionTargets) {
		payload.messageDecryptionTargets =
			messageDecryptionTargets as Array<MessageDecryptionTarget>;
	}
	const messageDecryptionKeyManagementAlgorithms = arrayOrUndefined(
		form.messageDecryptionKeyManagementAlgorithms
	);
	if (messageDecryptionKeyManagementAlgorithms) {
		payload.messageDecryptionKeyManagementAlgorithms =
			messageDecryptionKeyManagementAlgorithms as Array<KeyManagementAlgorithm>;
	}
	const messageDecryptionOtherKeyManagementAlgorithm = trimOrUndefined(
		form.messageDecryptionOtherKeyManagementAlgorithm
	);
	if (messageDecryptionOtherKeyManagementAlgorithm) {
		payload.messageDecryptionOtherKeyManagementAlgorithm =
			messageDecryptionOtherKeyManagementAlgorithm;
	}
	const messageDecryptionContentAlgorithms = arrayOrUndefined(
		form.messageDecryptionContentAlgorithms
	);
	if (messageDecryptionContentAlgorithms) {
		payload.messageDecryptionContentAlgorithms =
			messageDecryptionContentAlgorithms as Array<ContentEncryptionAlgorithm>;
	}
	const messageDecryptionOtherContentAlgorithm = trimOrUndefined(
		form.messageDecryptionOtherContentAlgorithm
	);
	if (messageDecryptionOtherContentAlgorithm) {
		payload.messageDecryptionOtherContentAlgorithm =
			messageDecryptionOtherContentAlgorithm;
	}
	const messageDecryptionRoadmap = toBoolean(form.messageDecryptionRoadmap);
	if (typeof messageDecryptionRoadmap === "boolean") {
		payload.messageDecryptionRoadmap = messageDecryptionRoadmap;
	}
	const messageDecryptionRevisitOn = trimOrUndefined(
		form.messageDecryptionRevisitOn
	);
	if (messageDecryptionRevisitOn) {
		payload.messageDecryptionRevisitOn = messageDecryptionRevisitOn;
	}

	return payload;
};

export const createEmptyWorkspaceRPApplicationForm =
	(): WorkspaceRPApplicationFormState => ({
		applicationEnvironmentUrlEn: "",
		applicationEnvironmentUrlFr: "",
		applicationInformationUuid: "",
		canadaLoginEnvironment: "",
		clientAuthMethod: "",
		clientType: "",
		jwksUri: "",
		logoutMode: "",
		logoutUri: "",
		messageDecryptionContentAlgorithms: [],
		messageDecryptionOtherContentAlgorithm: "",
		messageDecryptionOtherKeyManagementAlgorithm: "",
		messageDecryptionRevisitOn: "",
		messageDecryptionKeyManagementAlgorithms: [],
		messageDecryptionRoadmap: "",
		messageDecryptionSupported: "",
		messageDecryptionTargets: [],
		migrationSectorIdentifierUrl: "",
		offlineJwkOrCertificate: "",
		pkceAlgorithms: [],
		pkceOtherAlgorithm: "",
		pkceSupported: "",
		postLogoutRedirectUris: "",
		privateKeyDistributionMethod: "",
		redirectUris: "",
		requestEncryptionContentAlgorithms: [],
		requestEncryptionOtherContentAlgorithm: "",
		requestEncryptionOtherKeyManagementAlgorithm: "",
		requestEncryptionRevisitOn: "",
		requestEncryptionKeyManagementAlgorithms: [],
		requestEncryptionRoadmap: "",
		requestEncryptionSupported: "",
		requestEncryptionTargets: [],
		requestSigningAlgorithms: [],
		requestSigningOtherAlgorithm: "",
		requestSigningRevisitOn: "",
		requestSigningRoadmap: "",
		requestSigningSupported: "",
		requestSigningTargets: [],
		requestedScopes: ["openid"],
		sectorIdentifier: "",
		serviceNameEn: "",
		serviceNameFr: "",
		sharesPairwiseIdentifiers: "",
		signatureValidationAlgorithms: [],
		signatureValidationOtherAlgorithm: "",
		signatureValidationRevisitOn: "",
		signatureValidationRoadmap: "",
		signatureValidationSupported: "",
		signatureValidationTargets: [],
		supportsAuthorizationCodeFlow: "yes",
	});

export const toWorkspaceRPApplicationFormState = (
	application: RPApplicationRead,
	applicationInformationUuid: string | null
): WorkspaceRPApplicationFormState => {
	const payload = readPayload(application);

	return {
		applicationEnvironmentUrlEn: readString(
			payload,
			"application_environment_url_en"
		),
		applicationEnvironmentUrlFr: readString(
			payload,
			"application_environment_url_fr"
		),
		applicationInformationUuid: applicationInformationUuid ?? "",
		canadaLoginEnvironment: application.canadaLoginEnvironment ?? "",
		clientAuthMethod: readString(payload, "client_auth_method"),
		clientType: readString(payload, "client_type"),
		jwksUri: readString(payload, "jwks_uri"),
		logoutMode: readString(payload, "logout_mode"),
		logoutUri: readString(payload, "logout_uri"),
		messageDecryptionContentAlgorithms: readStringArray(
			payload,
			"message_decryption_content_algorithms"
		),
		messageDecryptionOtherContentAlgorithm: readString(
			payload,
			"message_decryption_other_content_algorithm"
		),
		messageDecryptionOtherKeyManagementAlgorithm: readString(
			payload,
			"message_decryption_other_key_management_algorithm"
		),
		messageDecryptionRevisitOn: readString(
			payload,
			"message_decryption_revisit_on"
		),
		messageDecryptionKeyManagementAlgorithms: readStringArray(
			payload,
			"message_decryption_key_management_algorithms"
		),
		messageDecryptionRoadmap: readBooleanField(
			payload,
			"message_decryption_roadmap"
		),
		messageDecryptionSupported: readBooleanField(
			payload,
			"message_decryption_supported"
		),
		messageDecryptionTargets: readStringArray(
			payload,
			"message_decryption_targets"
		),
		migrationSectorIdentifierUrl: readString(
			payload,
			"migration_sector_identifier_url"
		),
		offlineJwkOrCertificate: readString(payload, "offline_jwk_or_certificate"),
		pkceAlgorithms: readStringArray(payload, "pkce_algorithms"),
		pkceOtherAlgorithm: readString(payload, "pkce_other_algorithm"),
		pkceSupported: readBooleanField(payload, "pkce_supported"),
		postLogoutRedirectUris: readStringArray(
			payload,
			"post_logout_redirect_uris"
		).join("\n"),
		privateKeyDistributionMethod: readString(
			payload,
			"private_key_distribution_method"
		),
		redirectUris: readStringArray(payload, "redirect_uris").join("\n"),
		requestEncryptionContentAlgorithms: readStringArray(
			payload,
			"request_encryption_content_algorithms"
		),
		requestEncryptionOtherContentAlgorithm: readString(
			payload,
			"request_encryption_other_content_algorithm"
		),
		requestEncryptionOtherKeyManagementAlgorithm: readString(
			payload,
			"request_encryption_other_key_management_algorithm"
		),
		requestEncryptionRevisitOn: readString(
			payload,
			"request_encryption_revisit_on"
		),
		requestEncryptionKeyManagementAlgorithms: readStringArray(
			payload,
			"request_encryption_key_management_algorithms"
		),
		requestEncryptionRoadmap: readBooleanField(
			payload,
			"request_encryption_roadmap"
		),
		requestEncryptionSupported: readBooleanField(
			payload,
			"request_encryption_supported"
		),
		requestEncryptionTargets: readStringArray(
			payload,
			"request_encryption_targets"
		),
		requestSigningAlgorithms: readStringArray(
			payload,
			"request_signing_algorithms"
		),
		requestSigningOtherAlgorithm: readString(
			payload,
			"request_signing_other_algorithm"
		),
		requestSigningRevisitOn: readString(payload, "request_signing_revisit_on"),
		requestSigningRoadmap: readBooleanField(payload, "request_signing_roadmap"),
		requestSigningSupported: readBooleanField(
			payload,
			"request_signing_supported"
		),
		requestSigningTargets: readStringArray(payload, "request_signing_targets"),
		requestedScopes: readStringArray(payload, "requested_scopes"),
		sectorIdentifier: readString(payload, "sector_identifier"),
		serviceNameEn:
			readString(payload, "service_name_en") || application.dnrAppName || "",
		serviceNameFr: readString(payload, "service_name_fr"),
		sharesPairwiseIdentifiers: readBooleanField(
			payload,
			"shares_pairwise_identifiers"
		),
		signatureValidationAlgorithms: readStringArray(
			payload,
			"signature_validation_algorithms"
		),
		signatureValidationOtherAlgorithm: readString(
			payload,
			"signature_validation_other_algorithm"
		),
		signatureValidationRevisitOn: readString(
			payload,
			"signature_validation_revisit_on"
		),
		signatureValidationRoadmap: readBooleanField(
			payload,
			"signature_validation_roadmap"
		),
		signatureValidationSupported: readBooleanField(
			payload,
			"signature_validation_supported"
		),
		signatureValidationTargets: readStringArray(
			payload,
			"signature_validation_targets"
		),
		supportsAuthorizationCodeFlow: readBooleanField(
			payload,
			"supports_authorization_code_flow"
		),
	};
};

export const toRPApplicationUpdatePayload = (
	form: WorkspaceRPApplicationFormState
): RPApplicationUpdate => buildBasePayload(form);

const camelToSnake = (key: string): string =>
	key.replace(/[A-Z]/gu, (letter) => `_${letter.toLowerCase()}`);

export const toWorkspaceRPApplicationRegistrationAnswers = (
	form: WorkspaceRPApplicationFormState,
	step?: RegistrationDataStep
): WorkspaceRPApplicationRegistrationAnswers => {
	const answers = { ...buildBasePayload(form) } as Record<string, unknown>;

	if (step === "client-and-access") {
		if (form.clientAuthMethod !== "private_key_jwt") {
			answers["privateKeyDistributionMethod"] = null;
			answers["jwksUri"] = null;
			answers["offlineJwkOrCertificate"] = null;
		} else if (form.privateKeyDistributionMethod === "jwks_uri") {
			answers["offlineJwkOrCertificate"] = null;
		} else if (form.privateKeyDistributionMethod === "offline_exchange") {
			answers["jwksUri"] = null;
		} else {
			answers["jwksUri"] = null;
			answers["offlineJwkOrCertificate"] = null;
		}
		if (form.pkceSupported !== "yes") {
			answers["pkceAlgorithms"] = null;
			answers["pkceOtherAlgorithm"] = null;
		}
	}
	if (step === "signing") {
		if (form.requestSigningSupported !== "yes") {
			answers["requestSigningTargets"] = null;
			answers["requestSigningAlgorithms"] = null;
			answers["requestSigningOtherAlgorithm"] = null;
		} else {
			answers["requestSigningRoadmap"] = null;
			answers["requestSigningRevisitOn"] = null;
		}
		if (form.signatureValidationSupported !== "yes") {
			answers["signatureValidationTargets"] = null;
			answers["signatureValidationAlgorithms"] = null;
			answers["signatureValidationOtherAlgorithm"] = null;
		} else {
			answers["signatureValidationRoadmap"] = null;
			answers["signatureValidationRevisitOn"] = null;
		}
	}
	if (step === "encryption") {
		for (const prefix of ["requestEncryption", "messageDecryption"] as const) {
			const supported =
				prefix === "requestEncryption"
					? form.requestEncryptionSupported
					: form.messageDecryptionSupported;
			if (supported !== "yes") {
				answers[`${prefix}Targets`] = null;
				answers[`${prefix}KeyManagementAlgorithms`] = null;
				answers[`${prefix}OtherKeyManagementAlgorithm`] = null;
				answers[`${prefix}ContentAlgorithms`] = null;
				answers[`${prefix}OtherContentAlgorithm`] = null;
			} else {
				answers[`${prefix}Roadmap`] = null;
				answers[`${prefix}RevisitOn`] = null;
			}
		}
	}

	return answers;
};

export const toWorkspaceRPApplicationDraftFormState = (
	draft: WorkspaceRPApplicationRegistrationDraftRead
): WorkspaceRPApplicationFormState => {
	const snakeAnswers = Object.fromEntries(
		Object.entries(draft.registrationAnswers).map(([key, value]) => [
			camelToSnake(key),
			value,
		])
	);
	return toWorkspaceRPApplicationFormState(
		{
			canadaLoginEnvironment:
				draft.registrationAnswers.canadaLoginEnvironment ?? null,
			createdAt: "",
			createdBy: null,
			dnrAppName: draft.registrationAnswers.serviceNameEn ?? "",
			id: 0,
			isDeleted: false,
			oidcRegistrationPayload: snakeAnswers,
			status: null,
			uuid: draft.rpApplicationUuid,
			workspaceId: null,
		},
		draft.registrationAnswers.applicationInformationUuid ?? null
	);
};
