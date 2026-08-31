import { requestJson } from "@/fetch";
import type { ApiMessageResponse } from "./api-types";

export type UserRead = {
	uuid: string;
	name: string;
	email: string;
};

export type WorkspaceCreate = {
	name: string;
	slug?: string | null;
	description?: string | null;
};

export type WorkspaceUpdate = {
	name?: string;
	slug?: string | null;
	description?: string | null;
};

export type WorkspaceRead = {
	id: number;
	uuid: string;
	name: string;
	slug: string;
	departmentId: number;
	description: string | null;
	created_at: string;
	updated_at: string | null;
	is_deleted: boolean;
	created_by: number | null;
};

export type WorkspaceMemberCreate = {
	userUuid: string;
	role: string;
};

export type WorkspaceMemberRead = {
	id: number;
	uuid: string;
	workspace_id: number;
	user_id: number;
	role: string;
	created_at: string;
	is_deleted: boolean;
	userEmail?: string;
	userName?: string;
	userUuid?: string;
};

export const getWorkspaces = async (): Promise<Array<WorkspaceRead>> => {
	const result = await requestJson<Array<WorkspaceRead> | null>(
		"/api/v1/workspaces",
		{
			cache: "no-store",
			method: "GET",
		}
	);
	return result ?? [];
};

export const getCurrentUserWorkspaces = async (): Promise<
	Array<WorkspaceRead>
> => {
	const result = await requestJson<Array<WorkspaceRead> | null>(
		"/api/v1/workspaces/mine",
		{
			cache: "no-store",
			method: "GET",
		}
	);
	return result ?? [];
};

export const createWorkspace = async (
	payload: WorkspaceCreate
): Promise<WorkspaceRead> => {
	const result = await requestJson<WorkspaceRead | null>("/api/v1/workspaces", {
		body: JSON.stringify(payload),
		method: "POST",
	});
	if (!result) {
		throw new Error("Failed to create workspace");
	}
	return result;
};

export const updateWorkspace = async (
	workspaceUuid: string,
	payload: WorkspaceUpdate
): Promise<WorkspaceRead> => {
	const result = await requestJson<WorkspaceRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}`,
		{
			body: JSON.stringify(payload),
			method: "PATCH",
		}
	);
	if (!result) {
		throw new Error("Failed to update workspace");
	}
	return result;
};

export const deleteWorkspace = async (
	workspaceUuid: string
): Promise<ApiMessageResponse> => {
	const result = await requestJson<ApiMessageResponse | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}`,
		{
			method: "DELETE",
		}
	);
	if (!result) {
		throw new Error("Failed to delete workspace");
	}
	return result;
};

export const getWorkspace = async (
	workspaceUuid: string
): Promise<WorkspaceRead> => {
	const result = await requestJson<WorkspaceRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}`,
		{
			cache: "no-store",
			method: "GET",
		}
	);
	if (!result) {
		throw new Error("Workspace not found");
	}
	return result;
};

export const addWorkspaceMember = async (
	workspaceUuid: string,
	payload: WorkspaceMemberCreate
): Promise<WorkspaceMemberRead> => {
	const result = await requestJson<WorkspaceMemberRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/members`,
		{
			body: JSON.stringify(payload),
			method: "POST",
		}
	);
	if (!result) {
		throw new Error("Failed to add member");
	}
	return result;
};

export const removeWorkspaceMember = async (
	workspaceUuid: string,
	userUuid: string
): Promise<ApiMessageResponse> => {
	const result = await requestJson<ApiMessageResponse | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/members/${encodeURIComponent(userUuid)}`,
		{
			method: "DELETE",
		}
	);
	if (!result) {
		throw new Error("Failed to remove member");
	}
	return result;
};

export const getWorkspaceMembers = async (
	workspaceUuid: string
): Promise<Array<WorkspaceMemberRead>> => {
	const result = await requestJson<Array<WorkspaceMemberRead> | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/members`,
		{
			cache: "no-store",
			method: "GET",
		}
	);
	return result ?? [];
};

export const searchUsers = async (
	query: string,
	workspaceUuid?: string
): Promise<Array<UserRead>> => {
	let url = `/api/v1/users/search?q=${encodeURIComponent(query)}`;
	if (workspaceUuid) {
		url += `&workspace_uuid=${encodeURIComponent(workspaceUuid)}`;
	}

	const result = await requestJson<Array<UserRead> | null>(url, {
		method: "GET",
	});
	return result ?? [];
};
