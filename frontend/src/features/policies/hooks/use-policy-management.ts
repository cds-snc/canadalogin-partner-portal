import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createPolicy as postPolicy,
	deletePolicy as removePolicy,
	updatePolicy as patchPolicy,
	type PolicyCreate,
	type PolicyUpdate,
} from "@/fetch/policies";
import { refreshActiveListQuery } from "@/lib/refresh-active-list-query";
import {
	policiesQueryKey,
	usePolicies,
	type PoliciesState,
} from "./use-policies";

export type PolicyManagementState = PoliciesState & {
	createPolicy: (payload: PolicyCreate) => Promise<void>;
	deletePolicy: (policyUuid: string) => Promise<void>;
	isCreating: boolean;
	isDeleting: boolean;
	isUpdating: boolean;
	updatePolicy: (policyUuid: string, payload: PolicyUpdate) => Promise<void>;
};

export const usePolicyManagement = (
	page = 1,
	itemsPerPage = 10
): PolicyManagementState => {
	const queryClient = useQueryClient();
	const query = usePolicies(page, itemsPerPage);

	const refreshPolicies = async (): Promise<void> => {
		await refreshActiveListQuery(queryClient, {
			exactQueryKey: policiesQueryKey(page, itemsPerPage),
			refetchActiveQuery: query.refetch,
		});
	};

	const createMutation = useMutation({
		mutationFn: postPolicy,
		onSuccess: refreshPolicies,
	});

	const updateMutation = useMutation({
		mutationFn: ({
			payload,
			policyUuid,
		}: {
			payload: PolicyUpdate;
			policyUuid: string;
		}) => patchPolicy(policyUuid, payload),
		onSuccess: refreshPolicies,
	});

	const deleteMutation = useMutation({
		mutationFn: removePolicy,
		onSuccess: refreshPolicies,
	});

	return {
		...query,
		createPolicy: async (payload: PolicyCreate): Promise<void> => {
			await createMutation.mutateAsync(payload);
		},
		deletePolicy: async (policyUuid: string): Promise<void> => {
			await deleteMutation.mutateAsync(policyUuid);
		},
		isCreating: createMutation.isPending,
		isDeleting: deleteMutation.isPending,
		isUpdating: updateMutation.isPending,
		updatePolicy: async (
			policyUuid: string,
			payload: PolicyUpdate
		): Promise<void> => {
			await updateMutation.mutateAsync({ payload, policyUuid });
		},
	};
};
