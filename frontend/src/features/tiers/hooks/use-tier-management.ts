import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createTier as postTier,
	deleteTier as removeTier,
	updateTier as patchTier,
	type TierCreate,
	type TierUpdate,
} from "@/fetch/tiers";
import { refreshActiveListQuery } from "@/lib/refresh-active-list-query";
import { tiersQueryKey, useTiers, type TiersState } from "./use-tiers";

export type TierManagementState = TiersState & {
	createTier: (payload: TierCreate) => Promise<void>;
	deleteTier: (tierUuid: string) => Promise<void>;
	isCreating: boolean;
	isDeleting: boolean;
	isUpdating: boolean;
	updateTier: (tierUuid: string, payload: TierUpdate) => Promise<void>;
};

export const useTierManagement = (
	page = 1,
	itemsPerPage = 10
): TierManagementState => {
	const queryClient = useQueryClient();
	const query = useTiers(page, itemsPerPage);

	const refreshTiers = async (): Promise<void> => {
		await refreshActiveListQuery(queryClient, {
			exactQueryKey: tiersQueryKey(page, itemsPerPage),
			invalidationKeys: [["user-tier"]],
			refetchActiveQuery: query.refetch,
		});
	};

	const createMutation = useMutation({
		mutationFn: postTier,
		onSuccess: refreshTiers,
	});

	const updateMutation = useMutation({
		mutationFn: ({
			payload,
			tierUuid,
		}: {
			payload: TierUpdate;
			tierUuid: string;
		}) => patchTier(tierUuid, payload),
		onSuccess: refreshTiers,
	});

	const deleteMutation = useMutation({
		mutationFn: removeTier,
		onSuccess: refreshTiers,
	});

	return {
		...query,
		createTier: async (payload: TierCreate): Promise<void> => {
			await createMutation.mutateAsync(payload);
		},
		deleteTier: async (tierUuid: string): Promise<void> => {
			await deleteMutation.mutateAsync(tierUuid);
		},
		isCreating: createMutation.isPending,
		isDeleting: deleteMutation.isPending,
		isUpdating: updateMutation.isPending,
		updateTier: async (
			tierUuid: string,
			payload: TierUpdate
		): Promise<void> => {
			await updateMutation.mutateAsync({ payload, tierUuid });
		},
	};
};
