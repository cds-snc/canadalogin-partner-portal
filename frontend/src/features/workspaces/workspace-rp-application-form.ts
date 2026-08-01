import type {
	ClientAuthMethod,
	ClientType,
	ContentEncryptionAlgorithm,
	KeyManagementAlgorithm,
	LogoutMode,
	MessageDecryptionTarget,
	PKCEAlgorithm,
	PrivateKeyDistributionMethod,
	RPApplicationCreate,
	RPApplicationRead,
	RPApplicationUpdate,
	RequestedScope,
	RequestEncryptionTarget,
	SignatureAlgorithm,
	SignatureValidationTarget,
	SigningTarget,
	CanadaLoginEnvironment,
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
	const payload = application.oidc_registration_payload;
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

// Backend RP application contracts are snake_case; keep that translation localized here.
/* eslint-disable camelcase */
const buildBasePayload = (
	form: WorkspaceRPApplicationFormState
): RPApplicationUpdate => {
	const payload: RPApplicationUpdate = {};
	const applicationInformationUuid = trimOrUndefined(
		form.applicationInformationUuid
	);
	if (applicationInformationUuid) {
		payload.application_information_uuid = applicationInformationUuid;
	}

	const environment = trimOrUndefined(form.canadaLoginEnvironment);
	if (environment) {
		payload.canada_login_environment = environment as CanadaLoginEnvironment;
	}

	const serviceNameEn = trimOrUndefined(form.serviceNameEn);
	if (serviceNameEn) {
		payload.service_name_en = serviceNameEn;
	}
	const serviceNameFr = trimOrUndefined(form.serviceNameFr);
	if (serviceNameFr) {
		payload.service_name_fr = serviceNameFr;
	}
	const applicationEnvironmentUrlEn = trimOrUndefined(
		form.applicationEnvironmentUrlEn
	);
	if (applicationEnvironmentUrlEn) {
		payload.application_environment_url_en = applicationEnvironmentUrlEn;
	}
	const applicationEnvironmentUrlFr = trimOrUndefined(
		form.applicationEnvironmentUrlFr
	);
	if (applicationEnvironmentUrlFr) {
		payload.application_environment_url_fr = applicationEnvironmentUrlFr;
	}

	const redirectUris = parseLines(form.redirectUris);
	if (redirectUris.length > 0) {
		payload.redirect_uris = redirectUris;
	}
	const postLogoutRedirectUris = parseLines(form.postLogoutRedirectUris);
	if (postLogoutRedirectUris.length > 0) {
		payload.post_logout_redirect_uris = postLogoutRedirectUris;
	}

	const logoutMode = trimOrUndefined(form.logoutMode);
	if (logoutMode) {
		payload.logout_mode = logoutMode as LogoutMode;
	}
	const logoutUri = trimOrUndefined(form.logoutUri);
	if (logoutUri) {
		payload.logout_uri = logoutUri;
	}

	const clientType = trimOrUndefined(form.clientType);
	if (clientType) {
		payload.client_type = clientType as ClientType;
	}
	const supportsAuthorizationCodeFlow = toBoolean(
		form.supportsAuthorizationCodeFlow
	);
	if (typeof supportsAuthorizationCodeFlow === "boolean") {
		payload.supports_authorization_code_flow = supportsAuthorizationCodeFlow;
	}
	const clientAuthMethod = trimOrUndefined(form.clientAuthMethod);
	if (clientAuthMethod) {
		payload.client_auth_method = clientAuthMethod as ClientAuthMethod;
	}
	const privateKeyDistributionMethod = trimOrUndefined(
		form.privateKeyDistributionMethod
	);
	if (privateKeyDistributionMethod) {
		payload.private_key_distribution_method =
			privateKeyDistributionMethod as PrivateKeyDistributionMethod;
	}
	const jwksUri = trimOrUndefined(form.jwksUri);
	if (jwksUri) {
		payload.jwks_uri = jwksUri;
	}
	const offlineJwkOrCertificate = trimOrUndefined(form.offlineJwkOrCertificate);
	if (offlineJwkOrCertificate) {
		payload.offline_jwk_or_certificate = offlineJwkOrCertificate;
	}

	const requestedScopes = arrayOrUndefined(form.requestedScopes);
	if (requestedScopes) {
		payload.requested_scopes = requestedScopes as Array<RequestedScope>;
	}
	const sectorIdentifier = trimOrUndefined(form.sectorIdentifier);
	if (sectorIdentifier) {
		payload.sector_identifier = sectorIdentifier;
	}
	const sharesPairwiseIdentifiers = toBoolean(form.sharesPairwiseIdentifiers);
	if (typeof sharesPairwiseIdentifiers === "boolean") {
		payload.shares_pairwise_identifiers = sharesPairwiseIdentifiers;
	}
	const migrationSectorIdentifierUrl = trimOrUndefined(
		form.migrationSectorIdentifierUrl
	);
	if (migrationSectorIdentifierUrl) {
		payload.migration_sector_identifier_url = migrationSectorIdentifierUrl;
	}

	const pkceSupported = toBoolean(form.pkceSupported);
	if (typeof pkceSupported === "boolean") {
		payload.pkce_supported = pkceSupported;
	}
	const pkceAlgorithms = arrayOrUndefined(form.pkceAlgorithms);
	if (pkceAlgorithms) {
		payload.pkce_algorithms = pkceAlgorithms as Array<PKCEAlgorithm>;
	}
	const pkceOtherAlgorithm = trimOrUndefined(form.pkceOtherAlgorithm);
	if (pkceOtherAlgorithm) {
		payload.pkce_other_algorithm = pkceOtherAlgorithm;
	}

	const requestSigningSupported = toBoolean(form.requestSigningSupported);
	if (typeof requestSigningSupported === "boolean") {
		payload.request_signing_supported = requestSigningSupported;
	}
	const requestSigningTargets = arrayOrUndefined(form.requestSigningTargets);
	if (requestSigningTargets) {
		payload.request_signing_targets =
			requestSigningTargets as Array<SigningTarget>;
	}
	const requestSigningAlgorithms = arrayOrUndefined(
		form.requestSigningAlgorithms
	);
	if (requestSigningAlgorithms) {
		payload.request_signing_algorithms =
			requestSigningAlgorithms as Array<SignatureAlgorithm>;
	}
	const requestSigningOtherAlgorithm = trimOrUndefined(
		form.requestSigningOtherAlgorithm
	);
	if (requestSigningOtherAlgorithm) {
		payload.request_signing_other_algorithm = requestSigningOtherAlgorithm;
	}
	const requestSigningRoadmap = toBoolean(form.requestSigningRoadmap);
	if (typeof requestSigningRoadmap === "boolean") {
		payload.request_signing_roadmap = requestSigningRoadmap;
	}
	const requestSigningRevisitOn = trimOrUndefined(form.requestSigningRevisitOn);
	if (requestSigningRevisitOn) {
		payload.request_signing_revisit_on = requestSigningRevisitOn;
	}

	const signatureValidationSupported = toBoolean(
		form.signatureValidationSupported
	);
	if (typeof signatureValidationSupported === "boolean") {
		payload.signature_validation_supported = signatureValidationSupported;
	}
	const signatureValidationTargets = arrayOrUndefined(
		form.signatureValidationTargets
	);
	if (signatureValidationTargets) {
		payload.signature_validation_targets =
			signatureValidationTargets as Array<SignatureValidationTarget>;
	}
	const signatureValidationAlgorithms = arrayOrUndefined(
		form.signatureValidationAlgorithms
	);
	if (signatureValidationAlgorithms) {
		payload.signature_validation_algorithms =
			signatureValidationAlgorithms as Array<SignatureAlgorithm>;
	}
	const signatureValidationOtherAlgorithm = trimOrUndefined(
		form.signatureValidationOtherAlgorithm
	);
	if (signatureValidationOtherAlgorithm) {
		payload.signature_validation_other_algorithm =
			signatureValidationOtherAlgorithm;
	}
	const signatureValidationRoadmap = toBoolean(form.signatureValidationRoadmap);
	if (typeof signatureValidationRoadmap === "boolean") {
		payload.signature_validation_roadmap = signatureValidationRoadmap;
	}
	const signatureValidationRevisitOn = trimOrUndefined(
		form.signatureValidationRevisitOn
	);
	if (signatureValidationRevisitOn) {
		payload.signature_validation_revisit_on = signatureValidationRevisitOn;
	}

	const requestEncryptionSupported = toBoolean(form.requestEncryptionSupported);
	if (typeof requestEncryptionSupported === "boolean") {
		payload.request_encryption_supported = requestEncryptionSupported;
	}
	const requestEncryptionTargets = arrayOrUndefined(
		form.requestEncryptionTargets
	);
	if (requestEncryptionTargets) {
		payload.request_encryption_targets =
			requestEncryptionTargets as Array<RequestEncryptionTarget>;
	}
	const requestEncryptionKeyManagementAlgorithms = arrayOrUndefined(
		form.requestEncryptionKeyManagementAlgorithms
	);
	if (requestEncryptionKeyManagementAlgorithms) {
		payload.request_encryption_key_management_algorithms =
			requestEncryptionKeyManagementAlgorithms as Array<KeyManagementAlgorithm>;
	}
	const requestEncryptionOtherKeyManagementAlgorithm = trimOrUndefined(
		form.requestEncryptionOtherKeyManagementAlgorithm
	);
	if (requestEncryptionOtherKeyManagementAlgorithm) {
		payload.request_encryption_other_key_management_algorithm =
			requestEncryptionOtherKeyManagementAlgorithm;
	}
	const requestEncryptionContentAlgorithms = arrayOrUndefined(
		form.requestEncryptionContentAlgorithms
	);
	if (requestEncryptionContentAlgorithms) {
		payload.request_encryption_content_algorithms =
			requestEncryptionContentAlgorithms as Array<ContentEncryptionAlgorithm>;
	}
	const requestEncryptionOtherContentAlgorithm = trimOrUndefined(
		form.requestEncryptionOtherContentAlgorithm
	);
	if (requestEncryptionOtherContentAlgorithm) {
		payload.request_encryption_other_content_algorithm =
			requestEncryptionOtherContentAlgorithm;
	}
	const requestEncryptionRoadmap = toBoolean(form.requestEncryptionRoadmap);
	if (typeof requestEncryptionRoadmap === "boolean") {
		payload.request_encryption_roadmap = requestEncryptionRoadmap;
	}
	const requestEncryptionRevisitOn = trimOrUndefined(
		form.requestEncryptionRevisitOn
	);
	if (requestEncryptionRevisitOn) {
		payload.request_encryption_revisit_on = requestEncryptionRevisitOn;
	}

	const messageDecryptionSupported = toBoolean(form.messageDecryptionSupported);
	if (typeof messageDecryptionSupported === "boolean") {
		payload.message_decryption_supported = messageDecryptionSupported;
	}
	const messageDecryptionTargets = arrayOrUndefined(
		form.messageDecryptionTargets
	);
	if (messageDecryptionTargets) {
		payload.message_decryption_targets =
			messageDecryptionTargets as Array<MessageDecryptionTarget>;
	}
	const messageDecryptionKeyManagementAlgorithms = arrayOrUndefined(
		form.messageDecryptionKeyManagementAlgorithms
	);
	if (messageDecryptionKeyManagementAlgorithms) {
		payload.message_decryption_key_management_algorithms =
			messageDecryptionKeyManagementAlgorithms as Array<KeyManagementAlgorithm>;
	}
	const messageDecryptionOtherKeyManagementAlgorithm = trimOrUndefined(
		form.messageDecryptionOtherKeyManagementAlgorithm
	);
	if (messageDecryptionOtherKeyManagementAlgorithm) {
		payload.message_decryption_other_key_management_algorithm =
			messageDecryptionOtherKeyManagementAlgorithm;
	}
	const messageDecryptionContentAlgorithms = arrayOrUndefined(
		form.messageDecryptionContentAlgorithms
	);
	if (messageDecryptionContentAlgorithms) {
		payload.message_decryption_content_algorithms =
			messageDecryptionContentAlgorithms as Array<ContentEncryptionAlgorithm>;
	}
	const messageDecryptionOtherContentAlgorithm = trimOrUndefined(
		form.messageDecryptionOtherContentAlgorithm
	);
	if (messageDecryptionOtherContentAlgorithm) {
		payload.message_decryption_other_content_algorithm =
			messageDecryptionOtherContentAlgorithm;
	}
	const messageDecryptionRoadmap = toBoolean(form.messageDecryptionRoadmap);
	if (typeof messageDecryptionRoadmap === "boolean") {
		payload.message_decryption_roadmap = messageDecryptionRoadmap;
	}
	const messageDecryptionRevisitOn = trimOrUndefined(
		form.messageDecryptionRevisitOn
	);
	if (messageDecryptionRevisitOn) {
		payload.message_decryption_revisit_on = messageDecryptionRevisitOn;
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
		canadaLoginEnvironment: application.canada_login_environment ?? "",
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
			readString(payload, "service_name_en") || application.dnr_app_name || "",
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

export const toRPApplicationCreatePayload = (
	form: WorkspaceRPApplicationFormState
): RPApplicationCreate => ({
	...buildBasePayload(form),
	application_environment_url_en: form.applicationEnvironmentUrlEn.trim(),
	application_environment_url_fr: form.applicationEnvironmentUrlFr.trim(),
	canada_login_environment:
		form.canadaLoginEnvironment as CanadaLoginEnvironment,
	client_auth_method: form.clientAuthMethod as ClientAuthMethod,
	client_type: form.clientType as ClientType,
	logout_mode: form.logoutMode as LogoutMode,
	logout_uri: form.logoutUri.trim(),
	message_decryption_supported:
		toBoolean(form.messageDecryptionSupported) ?? false,
	pkce_supported: toBoolean(form.pkceSupported) ?? false,
	redirect_uris: parseLines(form.redirectUris),
	request_encryption_supported:
		toBoolean(form.requestEncryptionSupported) ?? false,
	request_signing_supported: toBoolean(form.requestSigningSupported) ?? false,
	requested_scopes: form.requestedScopes as Array<RequestedScope>,
	sector_identifier: form.sectorIdentifier.trim(),
	service_name_en: form.serviceNameEn.trim(),
	service_name_fr: form.serviceNameFr.trim(),
	shares_pairwise_identifiers:
		toBoolean(form.sharesPairwiseIdentifiers) ?? false,
	signature_validation_supported:
		toBoolean(form.signatureValidationSupported) ?? false,
	supports_authorization_code_flow:
		toBoolean(form.supportsAuthorizationCodeFlow) ?? true,
});

/* eslint-enable camelcase */

export const toRPApplicationUpdatePayload = (
	form: WorkspaceRPApplicationFormState
): RPApplicationUpdate => buildBasePayload(form);
