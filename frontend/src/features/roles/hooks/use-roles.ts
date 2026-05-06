import { useQuery } from "@tanstack/react-query";
import { getRoles, type RolesListResponse } from "@/fetch/roles";

export const rolesQueryKey = (page: number, itemsPerPage: number) =>
	["roles", page, itemsPerPage] as const;

export type RolesState = {
	error: Error | null;
	isLoading: boolean;
	itemsPerPage: number;
	page: number;
	refetch: () => Promise<unknown>;
	response: RolesListResponse | null;
	roles: RolesListResponse["data"];
};

export const useRoles = (page = 1, itemsPerPage = 10): RolesState => {
	const query = useQuery<RolesListResponse, Error>({
		queryFn: () => getRoles(page, itemsPerPage),
		queryKey: rolesQueryKey(page, itemsPerPage),
	});

	return {
		error: query.error ?? null,
		isLoading: query.isLoading,
		itemsPerPage,
		page,
		refetch: () => query.refetch(),
		response: query.data ?? null,
		roles: query.data?.data ?? [],
	};
};
