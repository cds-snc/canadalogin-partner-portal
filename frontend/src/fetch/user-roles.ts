import { requestJson } from "@/fetch";
import type { ApiMessageResponse } from "./api-types";
import type { RoleRead } from "./roles";

export type UserRoleUpdate = {
	roleUuid: string | null;
};

export const getUserRoles = async (
	userUuid: string
): Promise<Array<RoleRead>> =>
	requestJson<Array<RoleRead>>(`/api/v1/user/${userUuid}/roles`, {
		method: "GET",
	});

export const addRoleToUser = async (
	userUuid: string,
	roleUuid: string
): Promise<ApiMessageResponse | null> =>
	requestJson<ApiMessageResponse>(
		`/api/v1/user/${userUuid}/roles/${roleUuid}`,
		{
			method: "POST",
		}
	);

export const removeRoleFromUser = async (
	userUuid: string,
	roleUuid: string
): Promise<ApiMessageResponse | null> =>
	requestJson<ApiMessageResponse>(
		`/api/v1/user/${userUuid}/roles/${roleUuid}`,
		{
			method: "DELETE",
		}
	);
