import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	assignClAdminRole,
	getClAdminRoleAssignments,
	revokeClAdminRole,
	type RoleAssignmentRead,
} from "@/fetch/role-assignments";
import { clAdminAssignmentEligibilityQueryKeyPrefix } from "./use-cl-admin-assignment-eligibility";

export const clAdminAssignmentsQueryKey = ["cl-admin-assignments"] as const;

export type ClAdminAssignmentsState = {
	assign: (userUuid: string) => Promise<RoleAssignmentRead>;
	assignments: Array<RoleAssignmentRead>;
	error: Error | null;
	isAssigning: boolean;
	isRosterAvailable: boolean;
	isLoading: boolean;
	isRevoking: boolean;
	revoke: (userUuid: string) => Promise<void>;
};

export const useClAdminAssignments = (): ClAdminAssignmentsState => {
	const queryClient = useQueryClient();
	const query = useQuery<Array<RoleAssignmentRead>, Error>({
		queryFn: getClAdminRoleAssignments,
		queryKey: clAdminAssignmentsQueryKey,
	});
	const refresh = async (): Promise<void> => {
		await Promise.all([
			queryClient.invalidateQueries({
				queryKey: clAdminAssignmentsQueryKey,
			}),
			queryClient.invalidateQueries({
				queryKey: clAdminAssignmentEligibilityQueryKeyPrefix,
			}),
		]);
	};
	const assignMutation = useMutation({
		mutationFn: assignClAdminRole,
		onSuccess: refresh,
	});
	const revokeMutation = useMutation({
		mutationFn: revokeClAdminRole,
		onSuccess: refresh,
	});

	return {
		assign: (userUuid): Promise<RoleAssignmentRead> =>
			assignMutation.mutateAsync(userUuid),
		assignments: query.data ?? [],
		error: query.error ?? assignMutation.error ?? revokeMutation.error ?? null,
		isAssigning: assignMutation.isPending,
		isRosterAvailable: query.isSuccess,
		isLoading: query.isLoading,
		isRevoking: revokeMutation.isPending,
		revoke: async (userUuid): Promise<void> => {
			await revokeMutation.mutateAsync(userUuid);
		},
	};
};
