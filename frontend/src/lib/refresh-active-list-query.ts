import type { QueryClient, QueryKey } from "@tanstack/react-query";

type RefreshActiveListQueryOptions = {
	exactQueryKey: QueryKey;
	invalidationKeys?: Array<QueryKey>;
	refetchActiveQuery: () => Promise<unknown>;
};

export const refreshActiveListQuery = async (
	queryClient: QueryClient,
	{
		exactQueryKey,
		invalidationKeys = [],
		refetchActiveQuery,
	}: RefreshActiveListQueryOptions
): Promise<void> => {
	await queryClient.invalidateQueries({
		exact: true,
		queryKey: exactQueryKey,
		refetchType: "none",
	});

	if (invalidationKeys.length > 0) {
		await Promise.all(
			invalidationKeys.map((queryKey) =>
				queryClient.invalidateQueries({ queryKey, refetchType: "none" })
			)
		);
	}

	await refetchActiveQuery();
};
