import { useQuery } from "@tanstack/react-query";
import { getUsers, type UsersListResponse } from "@/fetch/users";

export const usersQueryKey = (page: number, itemsPerPage: number) =>
	["users", page, itemsPerPage] as const;

export type UsersState = {
	error: Error | null;
	isLoading: boolean;
	itemsPerPage: number;
	page: number;
	refetch: () => Promise<unknown>;
	response: UsersListResponse | null;
	users: UsersListResponse["data"];
};

export const useUsers = (page = 1, itemsPerPage = 10): UsersState => {
	const query = useQuery<UsersListResponse, Error>({
		queryFn: () => getUsers(page, itemsPerPage),
		queryKey: usersQueryKey(page, itemsPerPage),
	});

	return {
		error: query.error ?? null,
		isLoading: query.isLoading,
		itemsPerPage,
		page,
		refetch: () => query.refetch(),
		response: query.data ?? null,
		users: query.data?.data ?? [],
	};
};
