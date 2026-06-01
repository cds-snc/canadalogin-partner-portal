import { requestJson } from "@/fetch";
import type { ApiMessageResponse } from "./api-types";

export type WorkspaceCreate = {
	name: string;
	slug?: string | null;
	description?: string | null;
};

export type WorkspaceUpdate = WorkspaceCreate;

export type WorkspaceRead = {
	id: number;
	uuid: string;
	name: string;
	slug: string;
	departmentId: number;
	description: string | null;
	createdAt?: string;
	updatedAt?: string | null;
	isDeleted?: boolean;
	createdBy?: number | null;
};

export type CurrentUserRPApplicationRead = {
	id: number;
	uuid: string;
	name: string;
	status: string;
	settings?: Record<string, unknown> | null;
	ibm_sv_application_id?: string | null;
	workspaceName: string;
	workspaceUuid: string;
};

export type RPApplicationDeveloperInvitationRead = {
	id: number;
	uuid: string;
	workspaceId: number;
	rpApplicationId: number;
	invitedEmail: string;
	invitedBy?: number | null;
	role: string;
	status: "pending" | "accepted" | "revoked" | "expired";
};

export type RPApplicationDeveloperInvitationCreate = {
	email: string;
};

export type RPApplicationUpdate = {
	name?: string;
	description?: string;
	status?: string;
};

export const getWorkspaces = async (): Promise<Array<WorkspaceRead>> => {
	return (await requestJson<Array<WorkspaceRead> | null>("/api/v1/workspaces", {
		cache: "no-store",
		method: "GET",
	})) ?? [];
};

export const createWorkspace = async (payload: WorkspaceCreate): Promise<WorkspaceRead> => {
	const result = await requestJson<WorkspaceRead | null>("/api/v1/workspaces", {
		body: JSON.stringify(payload),
		method: "POST",
	});
	if (!result) throw new Error("Failed to create workspace");
	return result;
};

export const updateWorkspace = async (workspaceUuid: string, payload: WorkspaceUpdate): Promise<WorkspaceRead> => {
	const result = await requestJson<WorkspaceRead | null>(`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}`, {
		body: JSON.stringify(payload),
		method: "PATCH",
	});
	if (!result) throw new Error("Failed to update workspace");
	return result;
};

export const deleteWorkspace = async (workspaceUuid: string): Promise<ApiMessageResponse> => {
	const result = await requestJson<ApiMessageResponse | null>(`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}`, {
		method: "DELETE",
	});
	if (!result) throw new Error("Failed to delete workspace");
	return result;
};

export const getCurrentUserRPApplications = async (): Promise<Array<CurrentUserRPApplicationRead>> => {
	return (await requestJson<Array<CurrentUserRPApplicationRead> | null>("/api/v1/rp-applications/mine", {
		cache: "no-store",
		method: "GET",
	})) ?? [];
};

export const getCurrentUserRPApplication = async (rpApplicationUuid: string): Promise<CurrentUserRPApplicationRead> => {
	const result = await requestJson<CurrentUserRPApplicationRead | null>(`/api/v1/rp-applications/mine/${encodeURIComponent(rpApplicationUuid)}`, {
		cache: "no-store",
		method: "GET",
	});
	if (!result) throw new Error("Failed to load RP application");
	return result;
};

export const updateCurrentUserRPApplication = async (
	rpApplicationUuid: string,
	payload: RPApplicationUpdate
): Promise<CurrentUserRPApplicationRead> => {
	const result = await requestJson<CurrentUserRPApplicationRead | null>(`/api/v1/rp-applications/mine/${encodeURIComponent(rpApplicationUuid)}`, {
		body: JSON.stringify(payload),
		method: "PATCH",
	});
	if (!result) throw new Error("Failed to update RP application");
	return result;
};

export const acceptRPApplicationDeveloperInvitation = async (
	token: string
): Promise<RPApplicationDeveloperInvitationRead> => {
	const result = await requestJson<RPApplicationDeveloperInvitationRead | null>("/api/v1/rp-application-developer-invitations/accept", {
		body: JSON.stringify({ token }),
		method: "POST",
	});
	if (!result) throw new Error("Failed to accept RP application invitation");
	return result;
};