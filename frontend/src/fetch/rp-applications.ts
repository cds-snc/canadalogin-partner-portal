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

export type RPApplicationCreate = {
	name: string;
	applicationInfoUuid?: string;
	application_url?: string;
	client_type?: "public" | "confidential";
	company_name?: string;
	description?: string;
	pkce_enabled?: boolean;
	redirect_uris?: Array<string>;
	status?: string;
};

export type RPApplicationUpdate = {
	name?: string;
	application_url?: string;
	client_type?: "public" | "confidential";
	company_name?: string;
	description?: string;
	pkce_enabled?: boolean;
	redirect_uris?: Array<string>;
	status?: string;
};

export type RPApplicationRead = {
	id: number;
	uuid: string;
	workspace_id: number;
	applicationInfoId?: number | null;
	name: string;
	settings: RPApplicationSettings | null;
	status: string;
	created_by: number | null;
	created_at: string;
	is_deleted: boolean;
	ibm_sv_application_id?: string | null;
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
	workspaceName?: string;
	workspaceUuid?: string;
	applicationOwner?: {
		owners: Array<{ email: string }>;
	} | null;
};

export type CurrentUserRPOAuthSetupRead = {
	rpApplicationName: string;
	status: string;
	applicationUrl?: string | null;
	discoveryEndpoint?: string | null;
	clientId: string;
	clientSecret: string;
	pkceEnabled?: boolean | null;
	redirectUris: Array<string>;
	logoutUri?: string | null;
	logoutRedirectUris: Array<string>;
};

export type RPApplicationDeveloperInvitationRead = {
	accepted_at?: string | null;
	created_at: string;
	gc_notify_notification_id?: string | null;
	id: number;
	invited_by?: number | null;
	invited_email: string;
	invite_expires_at?: string;
	rp_application_id: number;
	role: string;
	revoked_at?: string | null;
	uuid: string;
	workspace_id: number;
};

export type RPApplicationDeveloperInvitationManagementRead = {
	acceptedAt?: string | null;
	createdAt: string;
	gcNotifyNotificationId?: string | null;
	id: number;
	invitedBy?: number | null;
	invitedEmail: string;
	inviteExpiresAt?: string;
	rpApplicationId: number;
	role: string;
	revokedAt?: string | null;
	status: "pending" | "accepted" | "revoked" | "expired";
	uuid: string;
	workspaceId: number;
};

export const rpApplicationDeveloperInvitationsQueryKey = (
	workspaceUuid: string,
	rpApplicationUuid: string
): Array<string> => [
	"rp-application-developer-invitations",
	workspaceUuid,
	rpApplicationUuid,
];

export type RPApplicationClientCredentialsRead = {
	client_id: string;
	client_secret: string | null;
	client_secret_id: string | null;
};

export type RPApplicationRotatedSecretRead = {
	description: string | null;
	expired_at: number | null;
	rotated_at?: number | null;
	value?: string | null;
	secret_id?: string | null;
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

export const acceptRPApplicationDeveloperInvitation = async (
	token: string
): Promise<RPApplicationDeveloperInvitationRead> => {
	const result = await requestJson<RPApplicationDeveloperInvitationRead | null>(
		"/api/v1/rp-application-developer-invitations/accept",
		{
			body: JSON.stringify({ token }),
			method: "POST",
		}
	);
	if (!result) {
		throw new Error("Failed to accept RP application invitation");
	}
	return result;
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

export const inviteRPApplicationDeveloper = async (
	workspaceUuid: string,
	rpApplicationUuid: string,
	email: string
): Promise<RPApplicationDeveloperInvitationRead> => {
	const result = await requestJson<RPApplicationDeveloperInvitationRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(rpApplicationUuid)}/developers/invite`,
		{
			body: JSON.stringify({ email }),
			method: "POST",
		}
	);
	if (!result) {
		throw new Error("Failed to invite RP application developer");
	}
	return result;
};

export const getRPApplicationDeveloperInvitations = async (
	workspaceUuid: string,
	rpApplicationUuid: string
): Promise<Array<RPApplicationDeveloperInvitationManagementRead>> => {
	const result =
		await requestJson<Array<RPApplicationDeveloperInvitationManagementRead> | null>(
			`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(rpApplicationUuid)}/developer-invitations`,
			{
				cache: "no-store",
				method: "GET",
			}
		);
	return result ?? [];
};

export const revokeRPApplicationDeveloperInvitation = async (
	workspaceUuid: string,
	rpApplicationUuid: string,
	invitationUuid: string
): Promise<RPApplicationDeveloperInvitationManagementRead> => {
	const result =
		await requestJson<RPApplicationDeveloperInvitationManagementRead | null>(
			`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(rpApplicationUuid)}/developer-invitations/${encodeURIComponent(invitationUuid)}`,
			{
				method: "DELETE",
			}
		);
	if (!result) {
		throw new Error("Failed to revoke RP application developer invitation");
	}
	return result;
};

export const resendRPApplicationDeveloperInvitation = async (
	workspaceUuid: string,
	rpApplicationUuid: string,
	invitationUuid: string
): Promise<RPApplicationDeveloperInvitationManagementRead> => {
	const result =
		await requestJson<RPApplicationDeveloperInvitationManagementRead | null>(
			`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(rpApplicationUuid)}/developer-invitations/${encodeURIComponent(invitationUuid)}/resend`,
			{
				method: "POST",
			}
		);
	if (!result) {
		throw new Error("Failed to resend RP application developer invitation");
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

export const getRPApplicationClientCredentials = async (
	workspaceUuid: string,
	rpApplicationUuid: string
): Promise<RPApplicationClientCredentialsRead> => {
	const result = await requestJson<RPApplicationClientCredentialsRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(rpApplicationUuid)}/client`,
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

export const getRPApplicationRotatedClientSecrets = async (
	workspaceUuid: string,
	rpApplicationUuid: string
): Promise<Array<RPApplicationRotatedSecretRead>> => {
	const result =
		await requestJson<Array<RPApplicationRotatedSecretRead> | null>(
			`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(rpApplicationUuid)}/client/rotated-secrets`,
			{
				cache: "no-store",
				method: "GET",
			}
		);
	return result ?? [];
};

export const createRPApplicationRotatedClientSecret = async (
	workspaceUuid: string,
	rpApplicationUuid: string,
	payload: RPApplicationRotatedSecretCreateRequest
): Promise<Array<RPApplicationRotatedSecretRead>> => {
	const result =
		await requestJson<Array<RPApplicationRotatedSecretRead> | null>(
			`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(rpApplicationUuid)}/client/rotated-secrets`,
			{
				body: JSON.stringify(payload),
				method: "POST",
			}
		);
	return result ?? [];
};

export const deleteRPApplicationRotatedClientSecret = async (
	workspaceUuid: string,
	rpApplicationUuid: string,
	rotatedSecretId: string
): Promise<ApiMessageResponse> => {
	const result = await requestJson<ApiMessageResponse | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(rpApplicationUuid)}/client/rotated-secrets/${encodeURIComponent(rotatedSecretId)}`,
		{
			method: "DELETE",
		}
	);
	if (!result) {
		throw new Error("Failed to delete rotated client secret");
	}
	return result;
};

export const rotateRPApplicationClientSecret = async (
	workspaceUuid: string,
	rpApplicationUuid: string,
	payload?: RPApplicationClientSecretRotateRequest
): Promise<RPApplicationClientCredentialsRead> => {
	const requestPayload: RPApplicationClientSecretRotateRequest = payload ?? {
		deleteRotatedSecrets: false,
		description: "",
		rotatedSecretExpiredAt: 0,
	};
	const result = await requestJson<RPApplicationClientCredentialsRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(rpApplicationUuid)}/client/rotate-secret`,
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
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(rpApplicationUuid)}/usage/audit-trail?${searchParameters.toString()}`,
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
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(rpApplicationUuid)}/usage/audit-trail/search-after?${searchParameters.toString()}`,
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
