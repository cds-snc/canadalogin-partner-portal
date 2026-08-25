import { requestJson } from "@/fetch";
import type { CanonicalRole, PartnerRole } from "@/features/auth/authorization";
import type { ApiMessageResponse } from "./api-types";
import { HttpRequestError } from "./errors";

export type { ApiMessageResponse } from "./api-types";

export type RPApplicationSettings = {
	application_url?: string;
	client_auth_method?: string;
	client_type?: string;
	company_name?: string;
	description?: string;
	pkce_enabled?: boolean;
	redirect_uris?: Array<string>;
	[key: string]: unknown;
};

export type CanadaLoginEnvironment = "test" | "staging" | "production";
export type RPApplicationAdoptionFieldName =
	| "displayName"
	| "providerApplicationState"
	| "applicationUrl"
	| "redirectUris"
	| "logoutUri"
	| "logoutRedirectUris"
	| "pkceEnabled"
	| "clientType"
	| "clientAuthMethod";
export type RPApplicationAdoptionFieldStatus =
	"missing" | "fillable" | "preserved" | "conflict";
export type RPApplicationAdoptionFieldValue =
	string | boolean | Array<string> | null;

export type RPApplicationAdoptionCandidateRead = {
	rpApplicationUuid: string;
	configurationName: string;
	partnerEnvironment: string | null;
	name: string;
	ibmApplicationId: string;
	metadataCompleteness: "complete" | "incomplete";
	missingFieldNames: Array<RPApplicationAdoptionFieldName>;
	updatedAt: string | null;
};

export type RPApplicationAdoptionCandidateListRead = {
	items: Array<RPApplicationAdoptionCandidateRead>;
};

export type RPApplicationAdoptionFieldComparisonRead = {
	fieldName: RPApplicationAdoptionFieldName;
	status: RPApplicationAdoptionFieldStatus;
	localValue: RPApplicationAdoptionFieldValue;
	providerValue: RPApplicationAdoptionFieldValue;
};

export type RPApplicationAdoptionCandidatePreviewRead = {
	candidate: RPApplicationAdoptionCandidateRead;
	partnerEnvironment: string | null;
	canadaLoginEnvironment: CanadaLoginEnvironment | null;
	fields: Array<RPApplicationAdoptionFieldComparisonRead>;
	fillableFieldNames: Array<RPApplicationAdoptionFieldName>;
	preservedLocalFieldNames: Array<RPApplicationAdoptionFieldName>;
	conflictingFieldNames: Array<RPApplicationAdoptionFieldName>;
};

export type RPApplicationWorkspaceLinkWrite = {
	workspaceUuid: string;
	applicationInformationUuid: string;
	canadaLoginEnvironment?: CanadaLoginEnvironment | null;
};

export type RPApplicationWorkspaceAdoptionRead = {
	rpApplicationUuid: string;
	workspaceUuid: string;
	departmentUuid: string;
	applicationInformationUuid: string;
	ibmApplicationId: string;
	configurationName: string;
	partnerEnvironment: string | null;
	name: string;
	canadaLoginEnvironment: CanadaLoginEnvironment;
	filledFieldNames: Array<RPApplicationAdoptionFieldName>;
	preservedLocalFieldNames: Array<RPApplicationAdoptionFieldName>;
	conflictingFieldNames: Array<RPApplicationAdoptionFieldName>;
	idempotentReplay: boolean;
};
export type LogoutMode = "back_channel" | "front_channel";
export type ClientType = "confidential" | "public";
export type ClientAuthMethod =
	"private_key_jwt" | "client_secret_basic" | "client_secret_post";
export type PrivateKeyDistributionMethod =
	"jwks_uri" | "offline_exchange" | "not_available";
export type RequestedScope =
	"openid" | "profile" | "email" | "phone" | "language";
export type PKCEAlgorithm = "S256" | "other";
export type SigningTarget = "request_object" | "token_endpoint";
export type SignatureValidationTarget = "id_token" | "userinfo";
export type SignatureAlgorithm =
	| "RS256"
	| "RS384"
	| "RS512"
	| "PS256"
	| "PS384"
	| "PS512"
	| "ES256"
	| "ES384"
	| "ES512"
	| "other";
export type RequestEncryptionTarget = "request_object";
export type MessageDecryptionTarget =
	"token_endpoint_response" | "id_token" | "userinfo";
export type KeyManagementAlgorithm = "RSA-OAEP-256" | "RSA-OAEP" | "other";
export type ContentEncryptionAlgorithm =
	"A128GCM" | "A192GCM" | "A256GCM" | "other";
export type RegistrationDataStep =
	"basics" | "endpoints" | "client-and-access" | "signing" | "encryption";
export type RegistrationSaveMode = "partial" | "completeStep";

type WorkspaceRPApplicationRegistrationAnswerValues = {
	applicationInformationUuid?: string | null;
	canadaLoginEnvironment?: CanadaLoginEnvironment;
	serviceNameEn?: string;
	serviceNameFr?: string;
	applicationEnvironmentUrlEn?: string;
	applicationEnvironmentUrlFr?: string;
	redirectUris?: Array<string>;
	postLogoutRedirectUris?: Array<string>;
	logoutMode?: LogoutMode;
	logoutUri?: string;
	clientType?: ClientType;
	supportsAuthorizationCodeFlow?: boolean;
	clientAuthMethod?: ClientAuthMethod;
	privateKeyDistributionMethod?: PrivateKeyDistributionMethod;
	jwksUri?: string;
	offlineJwkOrCertificate?: string;
	requestedScopes?: Array<RequestedScope>;
	sectorIdentifier?: string;
	sharesPairwiseIdentifiers?: boolean;
	migrationSectorIdentifierUrl?: string;
	pkceSupported?: boolean;
	pkceAlgorithms?: Array<PKCEAlgorithm>;
	pkceOtherAlgorithm?: string;
	requestSigningSupported?: boolean;
	requestSigningTargets?: Array<SigningTarget>;
	requestSigningAlgorithms?: Array<SignatureAlgorithm>;
	requestSigningOtherAlgorithm?: string;
	requestSigningRoadmap?: boolean;
	requestSigningRevisitOn?: string;
	signatureValidationSupported?: boolean;
	signatureValidationTargets?: Array<SignatureValidationTarget>;
	signatureValidationAlgorithms?: Array<SignatureAlgorithm>;
	signatureValidationOtherAlgorithm?: string;
	signatureValidationRoadmap?: boolean;
	signatureValidationRevisitOn?: string;
	requestEncryptionSupported?: boolean;
	requestEncryptionTargets?: Array<RequestEncryptionTarget>;
	requestEncryptionKeyManagementAlgorithms?: Array<KeyManagementAlgorithm>;
	requestEncryptionOtherKeyManagementAlgorithm?: string;
	requestEncryptionContentAlgorithms?: Array<ContentEncryptionAlgorithm>;
	requestEncryptionOtherContentAlgorithm?: string;
	requestEncryptionRoadmap?: boolean;
	requestEncryptionRevisitOn?: string;
	messageDecryptionSupported?: boolean;
	messageDecryptionTargets?: Array<MessageDecryptionTarget>;
	messageDecryptionKeyManagementAlgorithms?: Array<KeyManagementAlgorithm>;
	messageDecryptionOtherKeyManagementAlgorithm?: string;
	messageDecryptionContentAlgorithms?: Array<ContentEncryptionAlgorithm>;
	messageDecryptionOtherContentAlgorithm?: string;
	messageDecryptionRoadmap?: boolean;
	messageDecryptionRevisitOn?: string;
};

export type WorkspaceRPApplicationRegistrationAnswers = {
	[K in keyof WorkspaceRPApplicationRegistrationAnswerValues]?: Exclude<
		WorkspaceRPApplicationRegistrationAnswerValues[K],
		undefined
	> | null;
};

export type WorkspaceRPApplicationRegistrationDraftCreate =
	WorkspaceRPApplicationRegistrationAnswers & {
		applicationInformationUuid: string;
		canadaLoginEnvironment: CanadaLoginEnvironment;
		configurationName: string;
		partnerEnvironment: string;
		serviceNameEn: string;
		serviceNameFr: string;
	};

export type ApplicationRPConfigurationRegistrationDraftCreate = {
	canadaLoginEnvironment: CanadaLoginEnvironment;
	configurationName: string;
	partnerEnvironment: string;
};

export type WorkspaceRPApplicationRegistrationDraftPatch = {
	configurationName?: string;
	partnerEnvironment?: string;
	expectedDraftVersion: number;
	registrationAnswers: WorkspaceRPApplicationRegistrationAnswers;
	saveMode: RegistrationSaveMode;
	stepId: RegistrationDataStep;
};

type ValidationErrorDetail = {
	loc?: Array<unknown>;
};

export const isWorkspaceRPRegistrationValidationError = (
	error: Error | null | undefined
): error is HttpRequestError =>
	error instanceof HttpRequestError &&
	error.status === 422 &&
	error.code === "validation_error";

export const getWorkspaceRPRegistrationValidationFieldNames = (
	error: Error | null | undefined
): Array<string> => {
	if (
		!isWorkspaceRPRegistrationValidationError(error) ||
		!Array.isArray(error.details)
	) {
		return [];
	}

	const fieldNames = new Set<string>();
	for (const detail of error.details as Array<ValidationErrorDetail>) {
		if (!Array.isArray(detail.loc)) continue;
		const location = detail.loc;
		const registrationAnswersIndex = location.indexOf("registrationAnswers");
		let fieldName: unknown = location[location.length - 1];
		if (registrationAnswersIndex >= 0) {
			fieldName = location[registrationAnswersIndex + 1];
		}
		if (typeof fieldName === "string" && fieldName !== "body") {
			fieldNames.add(fieldName);
		}
	}
	return [...fieldNames];
};

export type WorkspaceRPApplicationRegistrationDraftRead = {
	applicationInformationUuid: string;
	configurationName?: string;
	partnerEnvironment?: string | null;
	onboardingState: "draft";
	registrationAnswers: WorkspaceRPApplicationRegistrationAnswers;
	registrationDraftVersion: number;
	registrationLastCompletedStep?: RegistrationDataStep | null;
	rpApplicationUuid: string;
	workspaceUuid: string;
};

export type WorkspaceRPApplicationRegistrationSubmissionRead = {
	onboardingState: "submitted";
	registrationDraftVersion: number;
	rpApplicationUuid: string;
	serviceNameEn: string;
	serviceNameFr: string;
	workspaceUuid: string;
};

export type RPApplicationUpdate = WorkspaceRPApplicationRegistrationAnswers;

export type RPApplicationRead = {
	id: number;
	uuid: string;
	workspaceId: number | null;
	departmentId?: number | null;
	applicationInformationId?: number | null;
	dnrAppName: string;
	configurationName?: string | null;
	partnerEnvironment?: string | null;
	oidcRegistrationPayload?: Record<string, unknown> | null;
	onboardingState?: string | null;
	submittedAt?: string | null;
	underReviewAt?: string | null;
	approvedAt?: string | null;
	launchedAt?: string | null;
	promotionStatus?: string | null;
	promotionRequestedAt?: string | null;
	status: string | null;
	createdBy: number | null;
	createdAt: string;
	isDeleted: boolean;
	canadaLoginEnvironment?: string | null;
	ibmSvApplicationId?: string | null;
};

export type AccessibleRPApplicationRead = {
	uuid: string;
	applicationInformationUuid?: string | null;
	dnrAppName: string;
	configurationName?: string | null;
	partnerEnvironment?: string | null;
	ibmSvApplicationId?: string | null;
	departmentUuid?: string | null;
	canadaLoginEnvironment?: string | null;
	onboardingState?: string | null;
	promotionStatus?: string | null;
	role: PartnerRole;
	workspaceUuid: string;
};

export type RPApplicationSummaryRead = {
	applicationInformationUuid?: string;
	canadaLoginEnvironment?: string | null;
	onboardingState?: string | null;
	promotionStatus?: string | null;
	registrationLastCompletedStep?: RegistrationDataStep | null;
	resumeTaskPath?: string | null;
	role?: CanonicalRole | null;
	serviceNameEn: string;
	serviceNameFr: string;
	configurationName?: string | null;
	partnerEnvironment?: string | null;
	uuid: string;
	workspaceName: string;
	workspaceUuid: string;
};

export type ApplicationRPConfigurationSummaryRead = Omit<
	RPApplicationSummaryRead,
	"configurationName"
> & {
	applicationInformationUuid: string;
	configurationName: string;
};

export type ApplicationRPConfigurationPartnerEnvironmentUpdate = {
	partnerEnvironment: string;
};

export type ApplicationRPConfigurationPartnerEnvironmentRead = {
	applicationInformationUuid: string;
	partnerEnvironment: string;
	rpConfigurationUuid: string;
	updatedAt: string;
	workspaceUuid: string;
};

export type WorkspaceRPApplicationConfigurationRead = {
	canadaLoginEnvironment?: CanadaLoginEnvironment | null;
	configurationName?: string | null;
	partnerEnvironment?: string | null;
	offlinePublicKeyProvided: boolean;
	onboardingState?: string | null;
	promotionStatus?: string | null;
	registrationAnswers: WorkspaceRPApplicationRegistrationAnswers;
	registrationDraftVersion: number;
	registrationLastCompletedStep?: RegistrationDataStep | null;
	rpApplicationUuid: string;
	serviceNameEn: string;
	serviceNameFr: string;
	workspaceUuid: string;
};

export type ApplicationRPConfigurationRead = Omit<
	WorkspaceRPApplicationConfigurationRead,
	"configurationName"
> & {
	applicationInformationUuid: string;
	configurationName: string;
};

export type ApplicationRPConfigurationProgressionCreate = {
	targetConfigurationName: string;
	targetPartnerEnvironment: string;
	targetEnvironment: "staging" | "production";
};

export type ApplicationRPConfigurationCopyCreate = {
	targetConfigurationName: string;
	targetPartnerEnvironment: string;
	targetEnvironment: CanadaLoginEnvironment;
};

export type ApplicationRPConfigurationCopyRead = {
	applicationInformationUuid: string;
	copyPolicyVersion: number;
	sourceConfigurationName: string;
	sourcePartnerEnvironment: string | null;
	sourceEnvironment: CanadaLoginEnvironment;
	sourceRpConfigurationUuid: string;
	targetConfigurationName: string;
	targetPartnerEnvironment: string;
	targetEnvironment: CanadaLoginEnvironment;
	targetRegistrationDraftVersion: number;
	targetRegistrationLastCompletedStep?: RegistrationDataStep | null;
	targetRpConfigurationUuid: string;
	workspaceUuid: string;
};

export type ApplicationRPConfigurationProgressionRead = {
	applicationInformationUuid: string;
	promotionStatus: string | null;
	selfServe: boolean;
	sourceConfigurationName: string;
	sourcePartnerEnvironment: string | null;
	sourceEnvironment: CanadaLoginEnvironment;
	sourceRpConfigurationUuid: string;
	targetConfigurationName: string;
	targetPartnerEnvironment: string | null;
	targetEnvironment: "staging" | "production";
	targetRegistrationDraftVersion: number;
	targetRegistrationLastCompletedStep?: RegistrationDataStep | null;
	targetRpConfigurationUuid: string;
	workspaceUuid: string;
};

export type ApplicationRPConfigurationPromotionRequestRead = {
	applicationInformationUuid: string;
	createdAt: string;
	decidedAt: string | null;
	externalReference: string | null;
	reviewedAt: string | null;
	reviewedByTeam: string | null;
	reviewedByUserUuid: string | null;
	requestedAt: string;
	sourceRpConfigurationUuid: string | null;
	status: "review_tracked" | "changes_requested" | "approved" | "launched";
	targetConfigurationName: string;
	targetEnvironment: "production";
	targetRpConfigurationUuid: string;
	updatedAt: string | null;
};

export type ApplicationRPConfigurationPromotionRequestUpsert = {
	externalReference?: string;
};

export type ApplicationRPConfigurationPromotionReviewUpdate = {
	externalReference?: string;
	reviewedByTeam?: string;
	status: "changes_requested" | "approved" | "launched";
};

export type RPApplicationClientCredentialsRead = {
	clientId: string;
	clientSecret: string | null;
	clientSecretId: string | null;
};

export type RPApplicationRotatedSecretRead = {
	description: string | null;
	expiredAt: number | null;
	path?: string | null;
	rotatedAt?: number | null;
	value?: string | null;
	secretId?: string | null;
};

export type RPApplicationRotatedSecretCreateRequest = {
	description?: string;
	rotatedSecretExpiredAt?: number;
};

export type RPApplicationClientSecretRotateRequest = {
	deleteRotatedSecrets: boolean;
	description?: string;
	rotatedSecretExpiredAt?: number;
};

export type RPApplicationUsageSummaryRead = {
	failed: number;
	succeeded: number;
	total: number;
};

export type AccessibleRPApplicationSummaryRead = {
	id: number;
	uuid: string;
	dnrAppName: string;
	departmentId: number | null;
};

export type AccessibleRPApplicationDepartmentAssignRequest = {
	departmentUuid: string;
};

export type RPApplicationUsageAuditEventRead = {
	country: string;
	ipVersion: number | null;
	origin: string;
	originDisplay: string;
	result: string;
	timeSeconds: number | null;
	username: string;
	usernameDisplay: string;
	usernameKnown: boolean;
};

export type RPApplicationUsageAuditTrailRead = {
	events: Array<RPApplicationUsageAuditEventRead>;
	next: string | null;
	total: number | null;
};

export type RPApplicationUsageAuditTrailRequest = {
	selectedDate: string;
	size?: number;
};

export type RPApplicationUsageAuditTrailSearchAfterRequest =
	RPApplicationUsageAuditTrailRequest & {
		searchAfter: string;
	};

const toUsageSelectedDateTimestamp = (selectedDate: string): string => {
	const trimmedDate = selectedDate.trim();
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmedDate);
	if (!match) {
		throw new Error("selectedDate must be in YYYY-MM-DD format");
	}

	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const timestamp = Date.UTC(year, month - 1, day);
	const normalizedDate = new Date(timestamp);
	if (
		normalizedDate.getUTCFullYear() !== year ||
		normalizedDate.getUTCMonth() !== month - 1 ||
		normalizedDate.getUTCDate() !== day
	) {
		throw new Error("selectedDate must be a valid calendar date");
	}

	return String(timestamp);
};

export const getRPApplicationAdoptionCandidates =
	async (): Promise<RPApplicationAdoptionCandidateListRead> => {
		const result =
			await requestJson<RPApplicationAdoptionCandidateListRead | null>(
				"/api/v1/rp-applications/workspace-adoption-candidates",
				{
					cache: "no-store",
					method: "GET",
				}
			);
		return result ?? { items: [] };
	};

export const getRPApplicationAdoptionCandidatePreview = async (
	rpApplicationUuid: string
): Promise<RPApplicationAdoptionCandidatePreviewRead> => {
	const result =
		await requestJson<RPApplicationAdoptionCandidatePreviewRead | null>(
			`/api/v1/rp-applications/workspace-adoption-candidates/${encodeURIComponent(rpApplicationUuid)}`,
			{
				cache: "no-store",
				method: "GET",
			}
		);
	if (!result) {
		throw new Error("Failed to load RP application adoption candidate");
	}
	return result;
};

export const linkRPApplicationToWorkspace = async (
	rpApplicationUuid: string,
	payload: RPApplicationWorkspaceLinkWrite
): Promise<RPApplicationWorkspaceAdoptionRead> => {
	const result = await requestJson<RPApplicationWorkspaceAdoptionRead | null>(
		`/api/v1/rp-applications/${encodeURIComponent(rpApplicationUuid)}/workspace-link`,
		{
			body: JSON.stringify(payload),
			method: "PUT",
		}
	);
	if (!result) {
		throw new Error("Failed to link RP application to workspace");
	}
	return result;
};

export const getAccessibleRPApplications = async (): Promise<
	Array<RPApplicationSummaryRead>
> => {
	const result = await requestJson<Array<RPApplicationSummaryRead> | null>(
		"/api/v1/rp-applications/accessible",
		{
			cache: "no-store",
			method: "GET",
		}
	);
	return result ?? [];
};

export const getAccessibleRPApplication = async (
	rpApplicationUuid: string
): Promise<AccessibleRPApplicationRead> => {
	const result = await requestJson<AccessibleRPApplicationRead | null>(
		`/api/v1/rp-applications/accessible/${encodeURIComponent(rpApplicationUuid)}`,
		{
			cache: "no-store",
			method: "GET",
		}
	);
	if (!result) {
		throw new Error("Failed to load RP application");
	}
	return result;
};

export const getAccessibleRPApplicationDepartment = async (
	rpApplicationUuid: string
): Promise<AccessibleRPApplicationSummaryRead> => {
	const result = await requestJson<AccessibleRPApplicationSummaryRead | null>(
		`/api/v1/rp-applications/accessible/${encodeURIComponent(rpApplicationUuid)}/department`,
		{
			cache: "no-store",
			method: "GET",
		}
	);
	if (!result) {
		throw new Error("Failed to load RP application department");
	}
	return result;
};

export const assignAccessibleRPApplicationDepartment = async (
	rpApplicationUuid: string,
	payload: AccessibleRPApplicationDepartmentAssignRequest
): Promise<AccessibleRPApplicationSummaryRead> => {
	const result = await requestJson<AccessibleRPApplicationSummaryRead | null>(
		`/api/v1/rp-applications/accessible/${encodeURIComponent(rpApplicationUuid)}/department`,
		{
			body: JSON.stringify(payload),
			method: "PATCH",
		}
	);
	if (!result) {
		throw new Error("Failed to assign RP application department");
	}
	return result;
};

export const getRPApplications = async (
	workspaceUuid: string
): Promise<Array<RPApplicationSummaryRead>> => {
	const result = await requestJson<Array<RPApplicationSummaryRead> | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/applications`,
		{
			cache: "no-store",
			method: "GET",
		}
	);
	return result ?? [];
};

export const getApplicationRPConfigurations = async (
	workspaceUuid: string,
	applicationInformationUuid: string
): Promise<Array<ApplicationRPConfigurationSummaryRead>> => {
	const result =
		await requestJson<Array<ApplicationRPConfigurationSummaryRead> | null>(
			`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-information/${encodeURIComponent(applicationInformationUuid)}/rp-configurations`,
			{
				cache: "no-store",
				method: "GET",
			}
		);
	return result ?? [];
};

export const getApplicationRPConfiguration = async (
	workspaceUuid: string,
	applicationInformationUuid: string,
	rpConfigurationUuid: string
): Promise<ApplicationRPConfigurationSummaryRead> => {
	const result =
		await requestJson<ApplicationRPConfigurationSummaryRead | null>(
			`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-information/${encodeURIComponent(applicationInformationUuid)}/rp-configurations/${encodeURIComponent(rpConfigurationUuid)}`,
			{
				cache: "no-store",
				method: "GET",
			}
		);
	if (!result) {
		throw new Error("Failed to load RP configuration");
	}
	return result;
};

export const updateApplicationRPConfigurationPartnerEnvironment = async (
	workspaceUuid: string,
	applicationInformationUuid: string,
	rpConfigurationUuid: string,
	payload: ApplicationRPConfigurationPartnerEnvironmentUpdate
): Promise<ApplicationRPConfigurationPartnerEnvironmentRead> => {
	const result =
		await requestJson<ApplicationRPConfigurationPartnerEnvironmentRead | null>(
			`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-information/${encodeURIComponent(applicationInformationUuid)}/rp-configurations/${encodeURIComponent(rpConfigurationUuid)}/partner-environment`,
			{
				body: JSON.stringify(payload),
				method: "PATCH",
			}
		);
	if (!result) {
		throw new Error("Failed to update Partner environment");
	}
	return result;
};

export const getApplicationRPConfigurationConfiguration = async (
	workspaceUuid: string,
	applicationInformationUuid: string,
	rpConfigurationUuid: string
): Promise<ApplicationRPConfigurationRead> => {
	const result = await requestJson<ApplicationRPConfigurationRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-information/${encodeURIComponent(applicationInformationUuid)}/rp-configurations/${encodeURIComponent(rpConfigurationUuid)}/configuration`,
		{
			cache: "no-store",
			method: "GET",
		}
	);
	if (!result) {
		throw new Error("Failed to load RP configuration details");
	}
	return result;
};

export const createApplicationRPConfigurationProgression = async (
	workspaceUuid: string,
	applicationInformationUuid: string,
	sourceRpConfigurationUuid: string,
	payload: ApplicationRPConfigurationProgressionCreate,
	progressionCreationKey: string
): Promise<ApplicationRPConfigurationProgressionRead> => {
	const result =
		await requestJson<ApplicationRPConfigurationProgressionRead | null>(
			`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-information/${encodeURIComponent(applicationInformationUuid)}/rp-configurations/${encodeURIComponent(sourceRpConfigurationUuid)}/progression`,
			{
				body: JSON.stringify(payload),
				headers: { "Idempotency-Key": progressionCreationKey },
				method: "POST",
			}
		);
	if (!result) {
		throw new Error("Failed to create RP configuration progression target");
	}
	return result;
};

export const createApplicationRPConfigurationCopy = async (
	workspaceUuid: string,
	applicationInformationUuid: string,
	sourceRpConfigurationUuid: string,
	payload: ApplicationRPConfigurationCopyCreate,
	copyCreationKey: string
): Promise<ApplicationRPConfigurationCopyRead> => {
	const result = await requestJson<ApplicationRPConfigurationCopyRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-information/${encodeURIComponent(applicationInformationUuid)}/rp-configurations/${encodeURIComponent(sourceRpConfigurationUuid)}/copy`,
		{
			body: JSON.stringify(payload),
			headers: { "Idempotency-Key": copyCreationKey },
			method: "POST",
		}
	);
	if (!result) {
		throw new Error("Failed to copy RP configuration");
	}
	return result;
};

const applicationRPConfigurationPromotionRequestPath = (
	workspaceUuid: string,
	applicationInformationUuid: string,
	rpConfigurationUuid: string
): string =>
	`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-information/${encodeURIComponent(applicationInformationUuid)}/rp-configurations/${encodeURIComponent(rpConfigurationUuid)}/promotion-request`;

export const getApplicationRPConfigurationPromotionRequest = async (
	workspaceUuid: string,
	applicationInformationUuid: string,
	rpConfigurationUuid: string
): Promise<ApplicationRPConfigurationPromotionRequestRead> => {
	const result =
		await requestJson<ApplicationRPConfigurationPromotionRequestRead | null>(
			applicationRPConfigurationPromotionRequestPath(
				workspaceUuid,
				applicationInformationUuid,
				rpConfigurationUuid
			),
			{ cache: "no-store", method: "GET" }
		);
	if (!result) throw new Error("Failed to load Production review");
	return result;
};

export const requestApplicationRPConfigurationProductionReview = async (
	workspaceUuid: string,
	applicationInformationUuid: string,
	rpConfigurationUuid: string,
	payload: ApplicationRPConfigurationPromotionRequestUpsert
): Promise<ApplicationRPConfigurationPromotionRequestRead> => {
	const result =
		await requestJson<ApplicationRPConfigurationPromotionRequestRead | null>(
			applicationRPConfigurationPromotionRequestPath(
				workspaceUuid,
				applicationInformationUuid,
				rpConfigurationUuid
			),
			{ body: JSON.stringify(payload), method: "POST" }
		);
	if (!result) throw new Error("Failed to request Production review");
	return result;
};

export const reviewApplicationRPConfigurationProductionRequest = async (
	workspaceUuid: string,
	applicationInformationUuid: string,
	rpConfigurationUuid: string,
	payload: ApplicationRPConfigurationPromotionReviewUpdate
): Promise<ApplicationRPConfigurationPromotionRequestRead> => {
	const result =
		await requestJson<ApplicationRPConfigurationPromotionRequestRead | null>(
			applicationRPConfigurationPromotionRequestPath(
				workspaceUuid,
				applicationInformationUuid,
				rpConfigurationUuid
			),
			{ body: JSON.stringify(payload), method: "PATCH" }
		);
	if (!result) throw new Error("Failed to record Production review");
	return result;
};

export const getWorkspaceRPApplicationConfiguration = async (
	workspaceUuid: string,
	rpApplicationUuid: string
): Promise<WorkspaceRPApplicationConfigurationRead> => {
	const result =
		await requestJson<WorkspaceRPApplicationConfigurationRead | null>(
			`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(rpApplicationUuid)}/configuration`,
			{ cache: "no-store", method: "GET" }
		);
	if (!result) {
		throw new Error("Failed to load RP application configuration");
	}
	return result;
};

export const getRPApplication = async (
	workspaceUuid: string,
	rpApplicationUuid: string
): Promise<RPApplicationRead> => {
	const result = await requestJson<RPApplicationRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(rpApplicationUuid)}`,
		{
			cache: "no-store",
			method: "GET",
		}
	);
	if (!result) {
		throw new Error("Failed to load application");
	}
	return result;
};

export const createWorkspaceRPApplicationRegistrationDraft = async (
	workspaceUuid: string,
	payload: WorkspaceRPApplicationRegistrationDraftCreate,
	registrationCreationKey: string
): Promise<WorkspaceRPApplicationRegistrationDraftRead> => {
	const result =
		await requestJson<WorkspaceRPApplicationRegistrationDraftRead | null>(
			`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/applications`,
			{
				body: JSON.stringify(payload),
				headers: { "Idempotency-Key": registrationCreationKey },
				method: "POST",
			}
		);
	if (!result) {
		throw new Error("Failed to create registration draft");
	}
	return result;
};

export const createApplicationRPConfigurationRegistrationDraft = async (
	workspaceUuid: string,
	applicationInformationUuid: string,
	payload: ApplicationRPConfigurationRegistrationDraftCreate,
	registrationCreationKey: string
): Promise<WorkspaceRPApplicationRegistrationDraftRead> => {
	const result =
		await requestJson<WorkspaceRPApplicationRegistrationDraftRead | null>(
			`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-information/${encodeURIComponent(applicationInformationUuid)}/rp-configurations`,
			{
				body: JSON.stringify(payload),
				headers: { "Idempotency-Key": registrationCreationKey },
				method: "POST",
			}
		);
	if (!result) {
		throw new Error("Failed to create RP configuration registration draft");
	}
	return result;
};

export const getWorkspaceRPApplicationRegistrationDraft = async (
	workspaceUuid: string,
	rpApplicationUuid: string
): Promise<WorkspaceRPApplicationRegistrationDraftRead> => {
	const result =
		await requestJson<WorkspaceRPApplicationRegistrationDraftRead | null>(
			`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(rpApplicationUuid)}/registration-draft`,
			{ cache: "no-store", method: "GET" }
		);
	if (!result) {
		throw new Error("Failed to load registration draft");
	}
	return result;
};

export const getApplicationRPConfigurationRegistrationDraft = async (
	workspaceUuid: string,
	applicationInformationUuid: string,
	rpConfigurationUuid: string
): Promise<WorkspaceRPApplicationRegistrationDraftRead> => {
	const result =
		await requestJson<WorkspaceRPApplicationRegistrationDraftRead | null>(
			`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-information/${encodeURIComponent(applicationInformationUuid)}/rp-configurations/${encodeURIComponent(rpConfigurationUuid)}/registration-draft`,
			{ cache: "no-store", method: "GET" }
		);
	if (!result) {
		throw new Error("Failed to load RP configuration registration draft");
	}
	return result;
};

export const updateWorkspaceRPApplicationRegistrationDraft = async (
	workspaceUuid: string,
	rpApplicationUuid: string,
	payload: WorkspaceRPApplicationRegistrationDraftPatch
): Promise<WorkspaceRPApplicationRegistrationDraftRead> => {
	const result =
		await requestJson<WorkspaceRPApplicationRegistrationDraftRead | null>(
			`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(rpApplicationUuid)}/registration-draft`,
			{ body: JSON.stringify(payload), method: "PATCH" }
		);
	if (!result) {
		throw new Error("Failed to update registration draft");
	}
	return result;
};

export const updateApplicationRPConfigurationRegistrationDraft = async (
	workspaceUuid: string,
	applicationInformationUuid: string,
	rpConfigurationUuid: string,
	payload: WorkspaceRPApplicationRegistrationDraftPatch
): Promise<WorkspaceRPApplicationRegistrationDraftRead> => {
	const result =
		await requestJson<WorkspaceRPApplicationRegistrationDraftRead | null>(
			`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-information/${encodeURIComponent(applicationInformationUuid)}/rp-configurations/${encodeURIComponent(rpConfigurationUuid)}/registration-draft`,
			{ body: JSON.stringify(payload), method: "PATCH" }
		);
	if (!result) {
		throw new Error("Failed to update RP configuration registration draft");
	}
	return result;
};

export const submitWorkspaceRPApplicationRegistration = async (
	workspaceUuid: string,
	rpApplicationUuid: string,
	expectedDraftVersion: number
): Promise<WorkspaceRPApplicationRegistrationSubmissionRead> => {
	const result =
		await requestJson<WorkspaceRPApplicationRegistrationSubmissionRead | null>(
			`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(rpApplicationUuid)}/onboarding-state`,
			{
				body: JSON.stringify({
					expectedDraftVersion,
					targetState: "submitted",
				}),
				method: "POST",
			}
		);
	if (!result) {
		throw new Error("Failed to submit registration");
	}
	return result;
};

export const submitApplicationRPConfigurationRegistration = async (
	workspaceUuid: string,
	applicationInformationUuid: string,
	rpConfigurationUuid: string,
	expectedDraftVersion: number
): Promise<WorkspaceRPApplicationRegistrationSubmissionRead> => {
	const result =
		await requestJson<WorkspaceRPApplicationRegistrationSubmissionRead | null>(
			`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-information/${encodeURIComponent(applicationInformationUuid)}/rp-configurations/${encodeURIComponent(rpConfigurationUuid)}/onboarding-state`,
			{
				body: JSON.stringify({
					expectedDraftVersion,
					targetState: "submitted",
				}),
				method: "POST",
			}
		);
	if (!result) {
		throw new Error("Failed to submit RP configuration registration");
	}
	return result;
};

export const updateRPApplication = async (
	workspaceUuid: string,
	rpApplicationUuid: string,
	payload: RPApplicationUpdate
): Promise<RPApplicationRead> => {
	const result = await requestJson<RPApplicationRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(rpApplicationUuid)}`,
		{
			body: JSON.stringify(payload),
			method: "PATCH",
		}
	);
	if (!result) {
		throw new Error("Failed to update application");
	}
	return result;
};

export const deleteRPApplication = async (
	workspaceUuid: string,
	rpApplicationUuid: string
): Promise<ApiMessageResponse> => {
	const result = await requestJson<ApiMessageResponse | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(rpApplicationUuid)}`,
		{
			method: "DELETE",
		}
	);
	if (!result) {
		throw new Error("Failed to delete application");
	}
	return result;
};

export const deleteApplicationRPConfiguration = async (
	workspaceUuid: string,
	applicationInformationUuid: string,
	rpConfigurationUuid: string
): Promise<ApiMessageResponse> => {
	const result = await requestJson<ApiMessageResponse | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-information/${encodeURIComponent(applicationInformationUuid)}/rp-configurations/${encodeURIComponent(rpConfigurationUuid)}`,
		{ method: "DELETE" }
	);
	if (!result) {
		throw new Error("Failed to delete RP configuration");
	}
	return result;
};

const buildAccessibleRPApplicationAncestryQuery = (
	workspaceUuid?: string,
	applicationInformationUuid?: string
): string => {
	const searchParameters = new URLSearchParams();
	if (workspaceUuid) {
		searchParameters.set("workspaceUuid", workspaceUuid);
	}
	if (applicationInformationUuid) {
		searchParameters.set(
			"applicationInformationUuid",
			applicationInformationUuid
		);
	}
	const query = searchParameters.toString();
	return query.length > 0 ? `?${query}` : "";
};

export const getAccessibleRPApplicationClientCredentials = async (
	rpApplicationUuid: string,
	workspaceUuid?: string,
	applicationInformationUuid?: string
): Promise<RPApplicationClientCredentialsRead> => {
	const ancestryQuery = buildAccessibleRPApplicationAncestryQuery(
		workspaceUuid,
		applicationInformationUuid
	);
	const result = await requestJson<RPApplicationClientCredentialsRead | null>(
		`/api/v1/rp-applications/accessible/${encodeURIComponent(rpApplicationUuid)}/client${ancestryQuery}`,
		{
			cache: "no-store",
			method: "GET",
		}
	);
	if (!result) {
		throw new Error("Failed to get application client credentials");
	}
	return result;
};

export const getAccessibleRPApplicationRotatedClientSecrets = async (
	rpApplicationUuid: string,
	workspaceUuid?: string,
	applicationInformationUuid?: string
): Promise<Array<RPApplicationRotatedSecretRead>> => {
	const ancestryQuery = buildAccessibleRPApplicationAncestryQuery(
		workspaceUuid,
		applicationInformationUuid
	);
	const result =
		await requestJson<Array<RPApplicationRotatedSecretRead> | null>(
			`/api/v1/rp-applications/accessible/${encodeURIComponent(rpApplicationUuid)}/client/rotated-secrets${ancestryQuery}`,
			{
				cache: "no-store",
				method: "GET",
			}
		);
	return result ?? [];
};

export const createAccessibleRPApplicationRotatedClientSecret = async (
	rpApplicationUuid: string,
	payload: RPApplicationRotatedSecretCreateRequest,
	workspaceUuid?: string,
	applicationInformationUuid?: string
): Promise<Array<RPApplicationRotatedSecretRead>> => {
	const ancestryQuery = buildAccessibleRPApplicationAncestryQuery(
		workspaceUuid,
		applicationInformationUuid
	);
	const result =
		await requestJson<Array<RPApplicationRotatedSecretRead> | null>(
			`/api/v1/rp-applications/accessible/${encodeURIComponent(rpApplicationUuid)}/client/rotated-secrets${ancestryQuery}`,
			{
				body: JSON.stringify(payload),
				method: "POST",
			}
		);
	return result ?? [];
};

export const deleteAccessibleRPApplicationRotatedClientSecret = async (
	rpApplicationUuid: string,
	secretId: string,
	workspaceUuid?: string,
	applicationInformationUuid?: string
): Promise<ApiMessageResponse> => {
	const ancestryQuery = buildAccessibleRPApplicationAncestryQuery(
		workspaceUuid,
		applicationInformationUuid
	);
	const result = await requestJson<ApiMessageResponse | null>(
		`/api/v1/rp-applications/accessible/${encodeURIComponent(rpApplicationUuid)}/client/rotated-secrets${ancestryQuery}`,
		{
			body: JSON.stringify({ secretId }),
			method: "DELETE",
		}
	);
	if (!result) {
		throw new Error("Failed to delete rotated client secret");
	}
	return result;
};

export const rotateAccessibleRPApplicationClientSecret = async (
	rpApplicationUuid: string,
	payload?: RPApplicationClientSecretRotateRequest,
	workspaceUuid?: string,
	applicationInformationUuid?: string
): Promise<RPApplicationClientCredentialsRead> => {
	const ancestryQuery = buildAccessibleRPApplicationAncestryQuery(
		workspaceUuid,
		applicationInformationUuid
	);
	const requestPayload: RPApplicationClientSecretRotateRequest = payload ?? {
		deleteRotatedSecrets: false,
		description: "",
		rotatedSecretExpiredAt: 0,
	};
	const result = await requestJson<RPApplicationClientCredentialsRead | null>(
		`/api/v1/rp-applications/accessible/${encodeURIComponent(rpApplicationUuid)}/client/rotate-secret${ancestryQuery}`,
		{
			body: JSON.stringify(requestPayload),
			method: "POST",
		}
	);
	if (!result) {
		throw new Error("Failed to rotate application client secret");
	}
	return result;
};

export const getRPApplicationUsageSummary = async (
	workspaceUuid: string,
	rpApplicationUuid: string,
	selectedDate: string
): Promise<RPApplicationUsageSummaryRead> => {
	const searchParameters = new URLSearchParams();
	searchParameters.set(
		"selected_date",
		toUsageSelectedDateTimestamp(selectedDate)
	);

	const result = await requestJson<RPApplicationUsageSummaryRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(rpApplicationUuid)}/usage/summary?${searchParameters.toString()}`,
		{
			cache: "no-store",
			method: "GET",
		}
	);
	if (!result) {
		throw new Error("Failed to load application usage summary");
	}
	return result;
};

export const getApplicationRPConfigurationUsageSummary = async (
	workspaceUuid: string,
	applicationInformationUuid: string,
	rpConfigurationUuid: string,
	selectedDate: string
): Promise<RPApplicationUsageSummaryRead> => {
	const searchParameters = new URLSearchParams();
	searchParameters.set(
		"selected_date",
		toUsageSelectedDateTimestamp(selectedDate)
	);
	const result = await requestJson<RPApplicationUsageSummaryRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-information/${encodeURIComponent(applicationInformationUuid)}/rp-configurations/${encodeURIComponent(rpConfigurationUuid)}/usage/summary?${searchParameters.toString()}`,
		{
			cache: "no-store",
			method: "GET",
		}
	);
	if (!result) {
		throw new Error("Failed to load RP configuration usage summary");
	}
	return result;
};

export const getRPApplicationUsageAuditTrail = async (
	workspaceUuid: string,
	rpApplicationUuid: string,
	request: RPApplicationUsageAuditTrailRequest
): Promise<RPApplicationUsageAuditTrailRead> => {
	const searchParameters = new URLSearchParams();
	searchParameters.set(
		"selected_date",
		toUsageSelectedDateTimestamp(request.selectedDate)
	);
	if (typeof request.size === "number") {
		searchParameters.set("size", String(request.size));
	}

	const result = await requestJson<RPApplicationUsageAuditTrailRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(rpApplicationUuid)}/audit-events?${searchParameters.toString()}`,
		{
			cache: "no-store",
			method: "GET",
		}
	);
	if (!result) {
		throw new Error("Failed to load application usage audit trail");
	}
	return result;
};

export const getApplicationRPConfigurationUsageAuditTrail = async (
	workspaceUuid: string,
	applicationInformationUuid: string,
	rpConfigurationUuid: string,
	request: RPApplicationUsageAuditTrailRequest
): Promise<RPApplicationUsageAuditTrailRead> => {
	const searchParameters = new URLSearchParams();
	searchParameters.set(
		"selected_date",
		toUsageSelectedDateTimestamp(request.selectedDate)
	);
	if (typeof request.size === "number") {
		searchParameters.set("size", String(request.size));
	}
	const result = await requestJson<RPApplicationUsageAuditTrailRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-information/${encodeURIComponent(applicationInformationUuid)}/rp-configurations/${encodeURIComponent(rpConfigurationUuid)}/audit-events?${searchParameters.toString()}`,
		{
			cache: "no-store",
			method: "GET",
		}
	);
	if (!result) {
		throw new Error("Failed to load RP configuration audit trail");
	}
	return result;
};

export const getRPApplicationUsageAuditTrailSearchAfter = async (
	workspaceUuid: string,
	rpApplicationUuid: string,
	request: RPApplicationUsageAuditTrailSearchAfterRequest
): Promise<RPApplicationUsageAuditTrailRead> => {
	const searchParameters = new URLSearchParams();
	searchParameters.set(
		"selected_date",
		toUsageSelectedDateTimestamp(request.selectedDate)
	);
	searchParameters.set("search_after", request.searchAfter);
	if (typeof request.size === "number") {
		searchParameters.set("size", String(request.size));
	}

	const result = await requestJson<RPApplicationUsageAuditTrailRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(rpApplicationUuid)}/audit-events/search-after?${searchParameters.toString()}`,
		{
			cache: "no-store",
			method: "GET",
		}
	);
	if (!result) {
		throw new Error(
			"Failed to load additional application usage audit trail events"
		);
	}
	return result;
};

export const getApplicationRPConfigurationUsageAuditTrailSearchAfter = async (
	workspaceUuid: string,
	applicationInformationUuid: string,
	rpConfigurationUuid: string,
	request: RPApplicationUsageAuditTrailSearchAfterRequest
): Promise<RPApplicationUsageAuditTrailRead> => {
	const searchParameters = new URLSearchParams();
	searchParameters.set(
		"selected_date",
		toUsageSelectedDateTimestamp(request.selectedDate)
	);
	searchParameters.set("search_after", request.searchAfter);
	if (typeof request.size === "number") {
		searchParameters.set("size", String(request.size));
	}
	const result = await requestJson<RPApplicationUsageAuditTrailRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-information/${encodeURIComponent(applicationInformationUuid)}/rp-configurations/${encodeURIComponent(rpConfigurationUuid)}/audit-events/search-after?${searchParameters.toString()}`,
		{
			cache: "no-store",
			method: "GET",
		}
	);
	if (!result) {
		throw new Error(
			"Failed to load additional RP configuration audit trail events"
		);
	}
	return result;
};
