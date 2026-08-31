import { requestJson } from "@/fetch";
import type { ApiMessageResponse } from "./api-types";

export type RoleRead = {
	created_at: string;
	description?: string | null;
	name: string;
	uuid: string;
};

export type RoleCreate = {
	description?: string | null;
	name: string;
};

export type RoleUpdate = {
	description?: string | null;
	name?: string | null;
};

export type RolesListResponse = {
	data: Array<RoleRead>;
	has_more: boolean;
	items_per_page: number;
	page: number;
	total_count: number;
};

export const getRoles = async (
	page = 1,
	itemsPerPage = 10
): Promise<RolesListResponse> => {
	const searchParameters = new URLSearchParams();
	searchParameters.set("items_per_page", String(itemsPerPage));
	searchParameters.set("page", String(page));

	return (await requestJson<RolesListResponse>(
		`/api/v1/roles?${searchParameters.toString()}`,
		{
			cache: "no-store",
			method: "GET",
		}
	)) as RolesListResponse;
};

export const createRole = async (
	payload: RoleCreate
): Promise<RoleRead | null> =>
	requestJson<RoleRead>("/api/v1/role", {
		body: JSON.stringify(payload),
		method: "POST",
	});

export const updateRole = async (
	roleUuid: string,
	payload: RoleUpdate
): Promise<ApiMessageResponse | null> =>
	requestJson<ApiMessageResponse>(`/api/v1/role/${roleUuid}`, {
		body: JSON.stringify(payload),
		method: "PATCH",
	});

export const deleteRole = async (
	roleUuid: string
): Promise<ApiMessageResponse | null> =>
	requestJson<ApiMessageResponse>(`/api/v1/role/${roleUuid}`, {
		method: "DELETE",
	});
