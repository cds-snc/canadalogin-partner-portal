import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createUser as postUser,
	deleteUser as removeUser,
	getUsers,
	searchUsers,
	updateUser as patchUser,
	type UserCreate,
	type UserUpdate,
	type UsersListResponse,
} from "@/fetch/users";
import { refreshActiveListQuery } from "@/lib/refresh-active-list-query";
import { usersQueryKey } from "./use-users";

export type UserManagementState = {
	createUser: (payload: UserCreate) => Promise<void>;
	deleteUser: (userUuid: string) => Promise<void>;
	error: Error | null;
	isCreating: boolean;
	isDeleting: boolean;
	isLoading: boolean;
	isUpdating: boolean;
	itemsPerPage: number;
	page: number;
	response: UsersListResponse | null;
	updateUser: (userUuid: string, payload: UserUpdate) => Promise<void>;
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
	const queryClient = useQueryClient();
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

	const refreshUsers = async (): Promise<void> => {
		await refreshActiveListQuery(queryClient, {
			exactQueryKey: usersQueryKey(page, itemsPerPage, normalizedSearchQuery),
			refetchActiveQuery: () => query.refetch(),
		});
	};

	const createMutation = useMutation({
		mutationFn: postUser,
		onSuccess: refreshUsers,
	});

	const updateMutation = useMutation({
		mutationFn: ({
			payload,
			userUuid,
		}: {
			payload: UserUpdate;
			userUuid: string;
		}) => patchUser(userUuid, payload),
		onSuccess: refreshUsers,
	});

	const deleteMutation = useMutation({
		mutationFn: removeUser,
		onSuccess: refreshUsers,
	});

	return {
		createUser: async (payload: UserCreate): Promise<void> => {
			await createMutation.mutateAsync(payload);
		},
		deleteUser: async (userUuid: string): Promise<void> => {
			await deleteMutation.mutateAsync(userUuid);
		},
		error: query.error ?? null,
		isCreating: createMutation.isPending,
		isDeleting: deleteMutation.isPending,
		isLoading: query.isLoading,
		isUpdating: updateMutation.isPending,
		itemsPerPage,
		page: normalizedSearchQuery.length >= 2 ? 1 : page,
		response: query.data ?? null,
		updateUser: async (
			userUuid: string,
			payload: UserUpdate
		): Promise<void> => {
			await updateMutation.mutateAsync({ payload, userUuid });
		},
		users: query.data?.data ?? [],
	};
};
