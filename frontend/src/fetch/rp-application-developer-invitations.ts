import { requestJson } from "@/fetch";

export type RPApplicationDeveloperInvitationRead = {
	acceptedAt: string | null;
	createdAt: string;
	delegatedByGrantUuid: string | null;
	deletedAt: string | null;
	gcNotifyNotificationId: string | null;
	id: number;
	invitedBy: number | null;
	invitedEmail: string;
	inviteExpiresAt: string;
	isDeleted: boolean;
	rpApplicationId: number;
	role: string;
	revokedAt: string | null;
	status: string;
	updatedAt: string | null;
	uuid: string;
	workspaceId: number;
};

export type RPApplicationDeveloperInvitationCreate = {
	gcNotifyNotificationId?: string | null;
	inviteExpiresAt: string;
	invitedEmail: string;
	role: string;
};

export type RPApplicationDeveloperInvitationWriteResponse =
	RPApplicationDeveloperInvitationRead & {
		acceptanceUrl: string;
	};

export type RPApplicationAccessGrantRead = {
	createdAt: string;
	deletedAt: string | null;
	id: number;
	isDeleted: boolean;
	role: string;
	sourceInvitationUuid: string | null;
	status: string;
	updatedAt: string | null;
	userId: number;
	uuid: string;
	workspaceId: number;
};

export type RPApplicationDeveloperInvitationAcceptResponse = {
	accessGrant: RPApplicationAccessGrantRead;
	invitation: RPApplicationDeveloperInvitationRead;
};

export const getWorkspaceRPApplicationDeveloperInvitations = async (
	workspaceUuid: string,
	rpApplicationUuid: string
): Promise<Array<RPApplicationDeveloperInvitationRead>> => {
	const result = await requestJson<
		Array<RPApplicationDeveloperInvitationRead> | null
	>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(rpApplicationUuid)}/developer-invitations`,
		{
			cache: "no-store",
			method: "GET",
		},
		{ redirectOnForbidden: false }
	);

	return result ?? [];
};

export const createWorkspaceRPApplicationDeveloperInvitation = async (
	workspaceUuid: string,
	rpApplicationUuid: string,
	payload: RPApplicationDeveloperInvitationCreate
): Promise<RPApplicationDeveloperInvitationWriteResponse> => {
	const result = await requestJson<RPApplicationDeveloperInvitationWriteResponse | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(rpApplicationUuid)}/developer-invitations`,
		{
			body: JSON.stringify(payload),
			method: "POST",
		},
		{ redirectOnForbidden: false }
	);

	if (!result) {
		throw new Error("Failed to create developer invitation");
	}

	return result;
};

export const revokeWorkspaceRPApplicationDeveloperInvitation = async (
	workspaceUuid: string,
	rpApplicationUuid: string,
	invitationUuid: string
): Promise<RPApplicationDeveloperInvitationRead> => {
	const result = await requestJson<RPApplicationDeveloperInvitationRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(rpApplicationUuid)}/developer-invitations/${encodeURIComponent(invitationUuid)}/revoke`,
		{
			method: "POST",
		},
		{ redirectOnForbidden: false }
	);

	if (!result) {
		throw new Error("Failed to revoke developer invitation");
	}

	return result;
};

export const acceptRPApplicationDeveloperInvitation = async (
	token: string
): Promise<RPApplicationDeveloperInvitationAcceptResponse> => {
	const result = await requestJson<RPApplicationDeveloperInvitationAcceptResponse>(
		"/api/v1/rp-application-developer-invitations/accept",
		{
			body: JSON.stringify({ token }),
			method: "POST",
		},
		{ redirectOnForbidden: false }
	);

	if (result === null) {
		throw new Error("Invitation acceptance returned no data");
	}

	return result;
};