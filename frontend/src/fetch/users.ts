import { requestJson } from "@/fetch";
import type { UserRead } from "./auth";
import type { ApiMessageResponse } from "./api-types";

export type UserCreate = {
	email: string;
	name: string;
};

export type UserUpdate = {
	authProvider?: string | null;
	authSubject?: string | null;
	email?: string | null;
	name?: string | null;
	profileImageUrl?: string | null;
};

export type UsersListResponse = {
	data: Array<UserRead>;
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
export const createUser = async (
	payload: UserCreate
): Promise<UserRead | null> =>
	requestJson<UserRead>("/api/v1/user", {
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
