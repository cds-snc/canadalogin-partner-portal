import type { CanonicalRole, PartnerRole } from "@/features/auth/authorization";
import { requestJson } from "@/fetch";
import type { ApiMessageResponse } from "./api-types";

export type RoleAssignmentRead = {
	assignedAt: string;
	assignmentUuid: string;
	role: CanonicalRole;
	userEmail: string;
	userName: string;
	userUuid: string;
	workspaceUuid: string | null;
};

export type RoleAssignmentCandidateRead = {
	email: string;
	name: string;
	uuid: string;
};

export type ClAdminAssignmentEligibilityReason =
	"active_partner_access" | "already_cl_admin" | "eligible" | "inactive_user";

export type ClAdminAssignmentEligibilityRead = {
	eligible: boolean;
	reason: ClAdminAssignmentEligibilityReason;
	userUuid: string;
};

export type PartnerRoleAssignmentWrite = {
	role: PartnerRole;
	userUuid: string;
};

export const getClAdminRoleAssignments = async (): Promise<
	Array<RoleAssignmentRead>
> =>
	(await requestJson<Array<RoleAssignmentRead> | null>(
		"/api/v1/role-assignments/cl-admin",
		{
			cache: "no-store",
			method: "GET",
		}
	)) ?? [];

export const assignClAdminRole = async (
	userUuid: string
): Promise<RoleAssignmentRead> => {
	const result = await requestJson<RoleAssignmentRead | null>(
		"/api/v1/role-assignments/cl-admin",
		{
			body: JSON.stringify({ userUuid }),
			method: "POST",
		}
	);
	if (!result) {
		throw new Error("Failed to assign CL Admin");
	}
	return result;
};

export const getClAdminAssignmentEligibility = async (
	userUuid: string
): Promise<ClAdminAssignmentEligibilityRead> => {
	const result = await requestJson<ClAdminAssignmentEligibilityRead | null>(
		`/api/v1/role-assignments/cl-admin/${encodeURIComponent(userUuid)}/eligibility`,
		{
			cache: "no-store",
			method: "GET",
		}
	);
	if (!result) {
		throw new Error("Failed to load CL Admin assignment eligibility");
	}
	return result;
};

export const revokeClAdminRole = async (
	userUuid: string
): Promise<ApiMessageResponse> => {
	const result = await requestJson<ApiMessageResponse | null>(
		`/api/v1/role-assignments/cl-admin/${encodeURIComponent(userUuid)}`,
		{ method: "DELETE" }
	);
	if (!result) {
		throw new Error("Failed to revoke CL Admin");
	}
	return result;
};

export const getWorkspaceRoleAssignments = async (
	workspaceUuid: string
): Promise<Array<RoleAssignmentRead>> =>
	(await requestJson<Array<RoleAssignmentRead> | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/role-assignments`,
		{
			cache: "no-store",
			method: "GET",
		}
	)) ?? [];

export const searchWorkspaceRoleAssignmentCandidates = async (
	workspaceUuid: string,
	query: string
): Promise<Array<RoleAssignmentCandidateRead>> =>
	(await requestJson<Array<RoleAssignmentCandidateRead> | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/role-assignment-candidates?q=${encodeURIComponent(query)}`,
		{ method: "GET" }
	)) ?? [];

export const assignWorkspaceRole = async (
	workspaceUuid: string,
	payload: PartnerRoleAssignmentWrite
): Promise<RoleAssignmentRead> => {
	const result = await requestJson<RoleAssignmentRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/role-assignments`,
		{
			body: JSON.stringify(payload),
			method: "POST",
		}
	);
	if (!result) {
		throw new Error("Failed to assign workspace role");
	}
	return result;
};

export const getWorkspaceRoleAssignment = async (
	workspaceUuid: string,
	assignmentUuid: string
): Promise<RoleAssignmentRead> => {
	const result = await requestJson<RoleAssignmentRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/access/assignments/${encodeURIComponent(assignmentUuid)}`,
		{ cache: "no-store", method: "GET" },
		{ redirectOnForbidden: false }
	);
	if (!result) {
		throw new Error("Failed to load workspace role assignment");
	}
	return result;
};

export const replaceWorkspaceRoleAssignment = async (
	workspaceUuid: string,
	assignmentUuid: string,
	role: PartnerRole
): Promise<RoleAssignmentRead> => {
	const result = await requestJson<RoleAssignmentRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/access/assignments/${encodeURIComponent(assignmentUuid)}`,
		{
			body: JSON.stringify({ role }),
			method: "PATCH",
		},
		{ redirectOnForbidden: false }
	);
	if (!result) {
		throw new Error("Failed to replace workspace role assignment");
	}
	return result;
};

export const revokeWorkspaceRoleAssignment = async (
	workspaceUuid: string,
	assignmentUuid: string
): Promise<ApiMessageResponse> => {
	const result = await requestJson<ApiMessageResponse | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/access/assignments/${encodeURIComponent(assignmentUuid)}`,
		{ method: "DELETE" },
		{ redirectOnForbidden: false }
	);
	if (!result) {
		throw new Error("Failed to revoke workspace role assignment");
	}
	return result;
};

export const replaceWorkspaceRole = async (
	workspaceUuid: string,
	userUuid: string,
	role: PartnerRole
): Promise<RoleAssignmentRead> => {
	const result = await requestJson<RoleAssignmentRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/role-assignments/${encodeURIComponent(userUuid)}`,
		{
			body: JSON.stringify({ role }),
			method: "PATCH",
		}
	);
	if (!result) {
		throw new Error("Failed to replace workspace role");
	}
	return result;
};

export const revokeWorkspaceRole = async (
	workspaceUuid: string,
	userUuid: string
): Promise<ApiMessageResponse> => {
	const result = await requestJson<ApiMessageResponse | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/role-assignments/${encodeURIComponent(userUuid)}`,
		{ method: "DELETE" }
	);
	if (!result) {
		throw new Error("Failed to revoke workspace role");
	}
	return result;
};
