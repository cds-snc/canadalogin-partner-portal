import { useQuery } from "@tanstack/react-query";
import { getPolicies, type PoliciesListResponse } from "@/fetch/policies";

export const policiesQueryKey = (page: number, itemsPerPage: number) =>
	["policies", page, itemsPerPage] as const;

export type PoliciesState = {
	error: Error | null;
	isLoading: boolean;
	itemsPerPage: number;
	page: number;
	policies: PoliciesListResponse["data"];
	refetch: () => Promise<unknown>;
	response: PoliciesListResponse | null;
};

export const usePolicies = (page = 1, itemsPerPage = 10): PoliciesState => {
	const query = useQuery<PoliciesListResponse, Error>({
		queryFn: () => getPolicies(page, itemsPerPage),
		queryKey: policiesQueryKey(page, itemsPerPage),
	});

	return {
		error: query.error ?? null,
		isLoading: query.isLoading,
		itemsPerPage,
		page,
		policies: query.data?.data ?? [],
		refetch: () => query.refetch(),
		response: query.data ?? null,
	};
};
