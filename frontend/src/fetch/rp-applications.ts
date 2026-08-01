import { requestJson } from "@/fetch";
import type { ApiMessageResponse } from "./api-types";

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

export type WorkspaceRPApplicationRegistrationBase = {
	application_information_uuid?: string | null;
	canada_login_environment?: CanadaLoginEnvironment;
	service_name_en?: string;
	service_name_fr?: string;
	application_environment_url_en?: string;
	application_environment_url_fr?: string;
	redirect_uris?: Array<string>;
	post_logout_redirect_uris?: Array<string>;
	logout_mode?: LogoutMode;
	logout_uri?: string;
	client_type?: ClientType;
	supports_authorization_code_flow?: boolean;
	client_auth_method?: ClientAuthMethod;
	private_key_distribution_method?: PrivateKeyDistributionMethod;
	jwks_uri?: string;
	offline_jwk_or_certificate?: string;
	requested_scopes?: Array<RequestedScope>;
	sector_identifier?: string;
	shares_pairwise_identifiers?: boolean;
	migration_sector_identifier_url?: string;
	pkce_supported?: boolean;
	pkce_algorithms?: Array<PKCEAlgorithm>;
	pkce_other_algorithm?: string;
	request_signing_supported?: boolean;
	request_signing_targets?: Array<SigningTarget>;
	request_signing_algorithms?: Array<SignatureAlgorithm>;
	request_signing_other_algorithm?: string;
	request_signing_roadmap?: boolean;
	request_signing_revisit_on?: string;
	signature_validation_supported?: boolean;
	signature_validation_targets?: Array<SignatureValidationTarget>;
	signature_validation_algorithms?: Array<SignatureAlgorithm>;
	signature_validation_other_algorithm?: string;
	signature_validation_roadmap?: boolean;
	signature_validation_revisit_on?: string;
	request_encryption_supported?: boolean;
	request_encryption_targets?: Array<RequestEncryptionTarget>;
	request_encryption_key_management_algorithms?: Array<KeyManagementAlgorithm>;
	request_encryption_other_key_management_algorithm?: string;
	request_encryption_content_algorithms?: Array<ContentEncryptionAlgorithm>;
	request_encryption_other_content_algorithm?: string;
	request_encryption_roadmap?: boolean;
	request_encryption_revisit_on?: string;
	message_decryption_supported?: boolean;
	message_decryption_targets?: Array<MessageDecryptionTarget>;
	message_decryption_key_management_algorithms?: Array<KeyManagementAlgorithm>;
	message_decryption_other_key_management_algorithm?: string;
	message_decryption_content_algorithms?: Array<ContentEncryptionAlgorithm>;
	message_decryption_other_content_algorithm?: string;
	message_decryption_roadmap?: boolean;
	message_decryption_revisit_on?: string;
};

export type RPApplicationCreate = WorkspaceRPApplicationRegistrationBase & {
	canada_login_environment: CanadaLoginEnvironment;
	service_name_en: string;
	service_name_fr: string;
	application_environment_url_en: string;
	application_environment_url_fr: string;
	redirect_uris: Array<string>;
	logout_mode: LogoutMode;
	logout_uri: string;
	client_type: ClientType;
	supports_authorization_code_flow: boolean;
	client_auth_method: ClientAuthMethod;
	requested_scopes: Array<RequestedScope>;
	sector_identifier: string;
	shares_pairwise_identifiers: boolean;
	pkce_supported: boolean;
	request_signing_supported: boolean;
	signature_validation_supported: boolean;
	request_encryption_supported: boolean;
	message_decryption_supported: boolean;
};

export type RPApplicationUpdate = WorkspaceRPApplicationRegistrationBase;

export type RPApplicationRead = {
	id: number;
	uuid: string;
	workspace_id: number | null;
	department_id?: number | null;
	application_information_id?: number | null;
	dnr_app_name: string;
	oidc_registration_payload?: Record<string, unknown> | null;
	status: string | null;
	created_by: number | null;
	created_at: string;
	is_deleted: boolean;
	canada_login_environment?: string | null;
	ibm_sv_application_id?: string | null;
	application_owner?: {
		owners: Array<{ email: string }>;
	} | null;
};

export type CurrentUserRPApplicationRead = {
	id: number;
	uuid: string;
	dnrAppName?: string;
	name?: string;
	status?: string;
	settings?: RPApplicationSettings | null;
	ibm_sv_application_id?: string | null;
	departmentId?: number | null;
	applicationOwner?: {
		owners: Array<{ email: string }>;
	} | null;
};

export type CurrentUserRPOAuthSetupRead = {
	rpApplicationName: string;
	status: string;
	applicationUrl?: string | null;
	discoveryEndpoint?: string | null;
	departmentName?: string | null;
	departmentNameFr?: string | null;
	pkceEnabled?: boolean | null;
	redirectUris: Array<string>;
	logoutUri?: string | null;
	logoutRedirectUris: Array<string>;
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

export type CurrentUserRPApplicationSummaryRead = {
	id: number;
	uuid: string;
	dnrAppName: string;
	departmentId: number | null;
};

export type CurrentUserRPApplicationDepartmentAssignRequest = {
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

export const getCurrentUserRPApplications = async (): Promise<
	Array<CurrentUserRPApplicationRead>
> => {
	const result = await requestJson<Array<CurrentUserRPApplicationRead> | null>(
		"/api/v1/rp-applications/mine",
		{
			cache: "no-store",
			method: "GET",
		}
	);
	return result ?? [];
};

export const getCurrentUserRPApplication = async (
	rpApplicationUuid: string
): Promise<CurrentUserRPApplicationRead> => {
	const result = await requestJson<CurrentUserRPApplicationRead | null>(
		`/api/v1/rp-applications/mine/${encodeURIComponent(rpApplicationUuid)}`,
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

export const getCurrentUserRPOAuthSetup = async (
	rpApplicationUuid: string
): Promise<CurrentUserRPOAuthSetupRead> => {
	const result = await requestJson<CurrentUserRPOAuthSetupRead | null>(
		`/api/v1/rp-applications/mine/${encodeURIComponent(rpApplicationUuid)}/oauth-setup`,
		{
			cache: "no-store",
			method: "GET",
		}
	);
	if (!result) {
		throw new Error("Failed to load RP OAuth setup");
	}
	return result;
};

export const getCurrentUserRPApplicationDepartment = async (
	rpApplicationUuid: string
): Promise<CurrentUserRPApplicationSummaryRead> => {
	const result = await requestJson<CurrentUserRPApplicationSummaryRead | null>(
		`/api/v1/rp-applications/mine/${encodeURIComponent(rpApplicationUuid)}/department`,
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

export const assignCurrentUserRPApplicationDepartment = async (
	rpApplicationUuid: string,
	payload: CurrentUserRPApplicationDepartmentAssignRequest
): Promise<CurrentUserRPApplicationSummaryRead> => {
	const result = await requestJson<CurrentUserRPApplicationSummaryRead | null>(
		`/api/v1/rp-applications/mine/${encodeURIComponent(rpApplicationUuid)}/department`,
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

export const updateCurrentUserRPApplication = async (
	rpApplicationUuid: string,
	payload: RPApplicationUpdate
): Promise<CurrentUserRPApplicationRead> => {
	const result = await requestJson<CurrentUserRPApplicationRead | null>(
		`/api/v1/rp-applications/mine/${encodeURIComponent(rpApplicationUuid)}`,
		{
			body: JSON.stringify(payload),
			method: "PATCH",
		}
	);
	if (!result) {
		throw new Error("Failed to update RP application");
	}
	return result;
};

export const getRPApplications = async (
	workspaceUuid: string
): Promise<Array<RPApplicationRead>> => {
	const result = await requestJson<Array<RPApplicationRead> | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/applications`,
		{
			cache: "no-store",
			method: "GET",
		}
	);
	return result ?? [];
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

export const createRPApplication = async (
	workspaceUuid: string,
	payload: RPApplicationCreate
): Promise<RPApplicationRead> => {
	const result = await requestJson<RPApplicationRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/applications`,
		{
			body: JSON.stringify(payload),
			method: "POST",
		}
	);
	if (!result) {
		throw new Error("Failed to create application");
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

export const getCurrentUserRPApplicationClientCredentials = async (
	rpApplicationUuid: string
): Promise<RPApplicationClientCredentialsRead> => {
	const result = await requestJson<RPApplicationClientCredentialsRead | null>(
		`/api/v1/rp-applications/mine/${encodeURIComponent(rpApplicationUuid)}/client`,
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

export const getCurrentUserRPApplicationRotatedClientSecrets = async (
	rpApplicationUuid: string
): Promise<Array<RPApplicationRotatedSecretRead>> => {
	const result =
		await requestJson<Array<RPApplicationRotatedSecretRead> | null>(
			`/api/v1/rp-applications/mine/${encodeURIComponent(rpApplicationUuid)}/client/rotated-secrets`,
			{
				cache: "no-store",
				method: "GET",
			}
		);
	return result ?? [];
};

export const createCurrentUserRPApplicationRotatedClientSecret = async (
	rpApplicationUuid: string,
	payload: RPApplicationRotatedSecretCreateRequest
): Promise<Array<RPApplicationRotatedSecretRead>> => {
	const result =
		await requestJson<Array<RPApplicationRotatedSecretRead> | null>(
			`/api/v1/rp-applications/mine/${encodeURIComponent(rpApplicationUuid)}/client/rotated-secrets`,
			{
				body: JSON.stringify(payload),
				method: "POST",
			}
		);
	return result ?? [];
};

export const deleteCurrentUserRPApplicationRotatedClientSecret = async (
	rpApplicationUuid: string,
	value: string
): Promise<ApiMessageResponse> => {
	const result = await requestJson<ApiMessageResponse | null>(
		`/api/v1/rp-applications/mine/${encodeURIComponent(rpApplicationUuid)}/client/rotated-secrets/${encodeURIComponent(value)}`,
		{
			method: "DELETE",
		}
	);
	if (!result) {
		throw new Error("Failed to delete rotated client secret");
	}
	return result;
};

export const rotateCurrentUserRPApplicationClientSecret = async (
	rpApplicationUuid: string,
	payload?: RPApplicationClientSecretRotateRequest
): Promise<RPApplicationClientCredentialsRead> => {
	const requestPayload: RPApplicationClientSecretRotateRequest = payload ?? {
		deleteRotatedSecrets: false,
		description: "",
		rotatedSecretExpiredAt: 0,
	};
	const result = await requestJson<RPApplicationClientCredentialsRead | null>(
		`/api/v1/rp-applications/mine/${encodeURIComponent(rpApplicationUuid)}/client/rotate-secret`,
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
