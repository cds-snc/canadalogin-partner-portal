import { useQuery } from "@tanstack/react-query";
import { getUsers, searchUsers, type UsersListResponse } from "@/fetch/users";
import { usersQueryKey } from "./use-users";

export type UserManagementState = {
	error: Error | null;
	isLoading: boolean;
	itemsPerPage: number;
	page: number;
	response: UsersListResponse | null;
	users: UsersListResponse["data"];
};

/* eslint-disable camelcase -- FastCRUD's public pagination envelope is snake_case. */
const buildSearchResponse = (
	data: UsersListResponse["data"]
): UsersListResponse => ({
	data,
	has_more: false,
	items_per_page: 20,
	page: 1,
	total_count: data.length,
});
/* eslint-enable camelcase */

export const useUserManagement = (
	page = 1,
	itemsPerPage = 10,
	searchQuery = ""
): UserManagementState => {
	const normalizedSearchQuery = searchQuery.trim();
	const query = useQuery<UsersListResponse, Error>({
		queryFn: async () => {
			if (normalizedSearchQuery.length === 0) {
				return getUsers(page, itemsPerPage);
			}
			if (normalizedSearchQuery.length < 2) {
				return buildSearchResponse([]);
			}

			const data = await searchUsers(normalizedSearchQuery);
			return buildSearchResponse(data);
		},
		queryKey: usersQueryKey(page, itemsPerPage, normalizedSearchQuery),
	});

	return {
		error: query.error ?? null,
		isLoading: query.isLoading,
		itemsPerPage,
		page: normalizedSearchQuery.length >= 2 ? 1 : page,
		response: query.data ?? null,
		users: query.data?.data ?? [],
	};
};
