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