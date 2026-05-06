import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createUser as postUser,
	deleteUser as removeUser,
	getUsers,
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

export const useUserManagement = (
	page = 1,
	itemsPerPage = 10
): UserManagementState => {
	const queryClient = useQueryClient();
	const query = useQuery<UsersListResponse, Error>({
		queryFn: () => getUsers(page, itemsPerPage),
		queryKey: ["users", page, itemsPerPage],
	});

	const refreshUsers = async (): Promise<void> => {
		await refreshActiveListQuery(queryClient, {
			exactQueryKey: usersQueryKey(page, itemsPerPage),
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
		page,
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
