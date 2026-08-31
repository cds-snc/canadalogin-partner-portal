import { useQuery } from "@tanstack/react-query";
import { getTiers, type TiersListResponse } from "@/fetch/tiers";

export const tiersQueryKey = (page: number, itemsPerPage: number) =>
	["tiers", page, itemsPerPage] as const;

export type TiersState = {
	error: Error | null;
	isLoading: boolean;
	itemsPerPage: number;
	page: number;
	refetch: () => Promise<unknown>;
	response: TiersListResponse | null;
	tiers: TiersListResponse["data"];
};

export const useTiers = (page = 1, itemsPerPage = 10): TiersState => {
	const query = useQuery<TiersListResponse, Error>({
		queryFn: () => getTiers(page, itemsPerPage),
		queryKey: tiersQueryKey(page, itemsPerPage),
	});

	return {
		error: query.error ?? null,
		isLoading: query.isLoading,
		itemsPerPage,
		page,
		refetch: () => query.refetch(),
		response: query.data ?? null,
		tiers: query.data?.data ?? [],
	};
};
