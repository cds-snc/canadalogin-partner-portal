import { requestJson } from "@/fetch";
import type { PartnerRole } from "@/features/auth/authorization";
import type { ApiMessageResponse } from "./api-types";

export type AdminUserRead = {
	email: string;
	enabled: boolean;
	globalRole: "cl_admin" | null;
	name: string;
	uuid: string;
	workspaceAssignments: Array<{
		role: PartnerRole;
		workspaceName: string;
		workspaceUuid: string;
	}>;
};

export type AdminUserProfileRead = {
	acceptedTermsAt: string | null;
	authProvider: string | null;
	departmentAbbreviation: string | null;
	departmentUuid: string | null;
	email: string;
	enabled: boolean;
	name: string;
	profileImageUrl: string;
	termsVersion: string | null;
	tierUuid: string | null;
	uuid: string;
	username: string;
};

export type UserAccessAdministrationRead = {
	globalAssignment: {
		assignedAt: string;
		assignmentUuid: string;
		role: "cl_admin";
	} | null;
	pendingInvitations: Array<{
		createdAt: string;
		invitationUuid: string;
		inviteExpiresAt: string;
		role: PartnerRole;
		status: "pending";
		workspaceName: string;
		workspaceUuid: string;
	}>;
	user: {
		email: string;
		enabled: boolean;
		name: string;
		username: string;
		uuid: string;
	};
	workspaceAssignments: Array<{
		assignedAt: string;
		assignmentUuid: string;
		role: PartnerRole;
		workspaceName: string;
		workspaceUuid: string;
	}>;
};

export type UserInvitationTargetResolutionRead = {
	outcome: "existing_identity" | "ineligible_identity" | "new_identity";
	userUuid: string | null;
};

export type UserCreate = {
	email: string;
	name: string;
};

export type UserUpdate = {
	email?: string | null;
	name?: string | null;
	profileImageUrl?: string | null;
};

export type UsersListResponse = {
	data: Array<AdminUserRead>;
	has_more: boolean;
	items_per_page: number;
	page: number;
	total_count: number;
};

export type PendingUserInvitationRead = {
	createdAt: string;
	invitationUuid: string;
	inviteExpiresAt: string;
	invitedEmail: string;
	role: PartnerRole;
	status: "pending";
	workspaceName: string;
	workspaceUuid: string;
};

export type PendingUserInvitationsListResponse = {
	data: Array<PendingUserInvitationRead>;
	has_more: boolean;
	items_per_page: number;
	page: number;
	total_count: number;
};

export const getUsers = async (
	page = 1,
	itemsPerPage = 10
): Promise<UsersListResponse> => {
	const searchParameters = new URLSearchParams();
	searchParameters.set("items_per_page", String(itemsPerPage));
	searchParameters.set("page", String(page));

	return (await requestJson<UsersListResponse>(
		`/api/v1/users?${searchParameters.toString()}`,
		{
			cache: "no-store",
			method: "GET",
		}
	)) as UsersListResponse;
};

export const getPendingUserInvitations = async (
	page = 1,
	itemsPerPage = 10
): Promise<PendingUserInvitationsListResponse> => {
	const searchParameters = new URLSearchParams();
	searchParameters.set("items_per_page", String(itemsPerPage));
	searchParameters.set("page", String(page));

	return (await requestJson<PendingUserInvitationsListResponse>(
		`/api/v1/users/invitations?${searchParameters.toString()}`,
		{
			cache: "no-store",
			method: "GET",
		}
	)) as PendingUserInvitationsListResponse;
};

export const searchUsers = async (
	query: string
): Promise<Array<AdminUserRead>> => {
	const searchParameters = new URLSearchParams({ q: query.trim() });
	return (
		(await requestJson<Array<AdminUserRead>>(
			`/api/v1/users/search?${searchParameters.toString()}`,
			{
				cache: "no-store",
				method: "GET",
			}
		)) ?? []
	);
};
export const createUser = async (
	payload: UserCreate
): Promise<AdminUserProfileRead | null> =>
	requestJson<AdminUserProfileRead>("/api/v1/user", {
		body: JSON.stringify(payload),
		method: "POST",
	});

export const updateUser = async (
	userUuid: string,
	payload: UserUpdate
): Promise<ApiMessageResponse | null> =>
	requestJson<ApiMessageResponse>(`/api/v1/user/${userUuid}`, {
		body: JSON.stringify(payload),
		method: "PATCH",
	});

export const deleteUser = async (
	userUuid: string
): Promise<ApiMessageResponse | null> =>
	requestJson<ApiMessageResponse>(`/api/v1/user/${userUuid}`, {
		method: "DELETE",
	});

export const getUserAccessAdministration = async (
	userUuid: string
): Promise<UserAccessAdministrationRead> => {
	const result = await requestJson<UserAccessAdministrationRead | null>(
		`/api/v1/users/${encodeURIComponent(userUuid)}/access`,
		{ cache: "no-store", method: "GET" }
	);
	if (!result) {
		throw new Error("Failed to load user access");
	}
	return result;
};

export const resolveUserInvitationTarget = async (
	invitedEmail: string
): Promise<UserInvitationTargetResolutionRead> => {
	const result = await requestJson<UserInvitationTargetResolutionRead | null>(
		"/api/v1/users/invitation-target-resolution",
		{
			body: JSON.stringify({ invitedEmail }),
			method: "POST",
		}
	);
	if (!result) {
		throw new Error("Failed to resolve invitation target");
	}
	return result;
};
