import { requestJson } from "@/fetch";
import type { PartnerRole } from "@/features/auth/authorization";

export type RPApplicationDeveloperInvitationStatus =
	"accepted" | "expired" | "pending" | "revoked";

export type RPApplicationAccessGrantStatus = "active" | "revoked";

export type RPApplicationDeveloperInvitationRead = {
	acceptedAt: string | null;
	createdAt: string;
	delegatedByGrantUuid: string | null;
	invitedEmail: string;
	inviteExpiresAt: string;
	replacedByInvitationUuid: string | null;
	revocationReason: string | null;
	role: PartnerRole;
	revokedAt: string | null;
	status: RPApplicationDeveloperInvitationStatus;
	updatedAt: string | null;
	uuid: string;
};

export type RPApplicationDeveloperInvitationCreate = {
	inviteExpiresAt: string;
	invitedEmail: string;
	role: PartnerRole;
};

export type RPApplicationDeveloperInvitationReissue = {
	inviteExpiresAt: string;
};

export type RPApplicationDeveloperInvitationWriteResponse =
	RPApplicationDeveloperInvitationRead & {
		acceptanceUrl: string;
	};

export type RPApplicationAccessGrantRead = {
	createdAt: string;
	role: PartnerRole;
	revokedAt: string | null;
	sourceInvitationUuid: string | null;
	status: RPApplicationAccessGrantStatus;
	updatedAt: string | null;
	uuid: string;
};

export type RPApplicationDeveloperInvitationAcceptResponse = {
	accessGrant: RPApplicationAccessGrantRead;
	invitation: RPApplicationDeveloperInvitationRead;
	nextDestination: string;
};

export const getWorkspaceDeveloperInvitations = async (
	workspaceUuid: string
): Promise<Array<RPApplicationDeveloperInvitationRead>> =>
	(await requestJson<Array<RPApplicationDeveloperInvitationRead> | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/invitations`,
		{ cache: "no-store", method: "GET" },
		{ redirectOnForbidden: false }
	)) ?? [];

export const createWorkspaceDeveloperInvitation = async (
	workspaceUuid: string,
	payload: RPApplicationDeveloperInvitationCreate
): Promise<RPApplicationDeveloperInvitationWriteResponse> => {
	const result =
		await requestJson<RPApplicationDeveloperInvitationWriteResponse | null>(
			`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/invitations`,
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

export const getWorkspaceDeveloperInvitation = async (
	workspaceUuid: string,
	invitationUuid: string
): Promise<RPApplicationDeveloperInvitationRead> => {
	const result = await requestJson<RPApplicationDeveloperInvitationRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/invitations/${encodeURIComponent(invitationUuid)}`,
		{ cache: "no-store", method: "GET" },
		{ redirectOnForbidden: false }
	);
	if (!result) {
		throw new Error("Failed to load developer invitation");
	}
	return result;
};

export const revokeWorkspaceDeveloperInvitation = async (
	workspaceUuid: string,
	invitationUuid: string
): Promise<RPApplicationDeveloperInvitationRead> => {
	const result = await requestJson<RPApplicationDeveloperInvitationRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/invitations/${encodeURIComponent(invitationUuid)}/revoke`,
		{ method: "POST" },
		{ redirectOnForbidden: false }
	);
	if (!result) {
		throw new Error("Failed to revoke developer invitation");
	}
	return result;
};

export const reissueWorkspaceDeveloperInvitation = async (
	workspaceUuid: string,
	invitationUuid: string,
	payload: RPApplicationDeveloperInvitationReissue
): Promise<RPApplicationDeveloperInvitationWriteResponse> => {
	const result =
		await requestJson<RPApplicationDeveloperInvitationWriteResponse | null>(
			`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/invitations/${encodeURIComponent(invitationUuid)}/reissue`,
			{
				body: JSON.stringify(payload),
				method: "POST",
			},
			{ redirectOnForbidden: false }
		);
	if (!result) {
		throw new Error("Failed to reissue developer invitation");
	}
	return result;
};

export const getWorkspaceRPApplicationDeveloperInvitations = async (
	workspaceUuid: string,
	rpApplicationUuid: string
): Promise<Array<RPApplicationDeveloperInvitationRead>> => {
	const result =
		await requestJson<Array<RPApplicationDeveloperInvitationRead> | null>(
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
	const result =
		await requestJson<RPApplicationDeveloperInvitationWriteResponse | null>(
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

export const prepareRPApplicationDeveloperInvitation = async (
	token: string
): Promise<void> => {
	const result = await requestJson<{ prepared: boolean }>(
		"/api/v1/rp-application-developer-invitations/prepare",
		{
			body: JSON.stringify({ token }),
			cache: "no-store",
			method: "POST",
		},
		{
			redirectOnForbidden: false,
			redirectOnUnauthorized: false,
		}
	);

	if (result?.prepared !== true) {
		throw new Error("Invitation preparation returned no confirmation");
	}
};

export const acceptPreparedRPApplicationDeveloperInvitation =
	async (): Promise<RPApplicationDeveloperInvitationAcceptResponse> => {
		const result =
			await requestJson<RPApplicationDeveloperInvitationAcceptResponse>(
				"/api/v1/rp-application-developer-invitations/accept-prepared",
				{
					body: JSON.stringify({}),
					cache: "no-store",
					method: "POST",
				},
				{ redirectOnForbidden: false }
			);

		if (result === null) {
			throw new Error("Invitation acceptance returned no data");
		}

		return result;
	};
