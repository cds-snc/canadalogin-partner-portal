import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PartnerRole } from "@/features/auth/authorization";
import {
	assignWorkspaceRole,
	getWorkspaceRoleAssignments,
	replaceWorkspaceRole,
	revokeWorkspaceRole,
	searchWorkspaceRoleAssignmentCandidates,
	type PartnerRoleAssignmentWrite,
	type RoleAssignmentCandidateRead,
	type RoleAssignmentRead,
} from "@/fetch/role-assignments";

export const workspaceRoleAssignmentsQueryKey = (workspaceUuid: string) =>
	["workspace-role-assignments", workspaceUuid] as const;

export type WorkspaceRoleAssignmentsState = {
	assign: (payload: PartnerRoleAssignmentWrite) => Promise<RoleAssignmentRead>;
	assignments: Array<RoleAssignmentRead>;
	error: Error | null;
	isAssigning: boolean;
	isLoading: boolean;
	isReplacing: boolean;
	isRevoking: boolean;
	isSearching: boolean;
	replace: (userUuid: string, role: PartnerRole) => Promise<RoleAssignmentRead>;
	revoke: (userUuid: string) => Promise<void>;
	searchCandidates: (
		query: string
	) => Promise<Array<RoleAssignmentCandidateRead>>;
};

export const useWorkspaceRoleAssignments = (
	workspaceUuid: string
): WorkspaceRoleAssignmentsState => {
	const queryClient = useQueryClient();
	const query = useQuery<Array<RoleAssignmentRead>, Error>({
		enabled: workspaceUuid.length > 0,
		queryFn: () => getWorkspaceRoleAssignments(workspaceUuid),
		queryKey: workspaceRoleAssignmentsQueryKey(workspaceUuid),
	});
	const refresh = async (): Promise<void> => {
		await queryClient.invalidateQueries({
			queryKey: workspaceRoleAssignmentsQueryKey(workspaceUuid),
		});
	};
	const assignMutation = useMutation({
		mutationFn: (payload: PartnerRoleAssignmentWrite) =>
			assignWorkspaceRole(workspaceUuid, payload),
		onSuccess: refresh,
	});
	const replaceMutation = useMutation({
		mutationFn: ({ role, userUuid }: { role: PartnerRole; userUuid: string }) =>
			replaceWorkspaceRole(workspaceUuid, userUuid, role),
		onSuccess: refresh,
	});
	const revokeMutation = useMutation({
		mutationFn: (userUuid: string) =>
			revokeWorkspaceRole(workspaceUuid, userUuid),
		onSuccess: refresh,
	});
	const searchMutation = useMutation({
		mutationFn: (queryText: string) =>
			searchWorkspaceRoleAssignmentCandidates(workspaceUuid, queryText),
	});

	return {
		assign: (payload): Promise<RoleAssignmentRead> =>
			assignMutation.mutateAsync(payload),
		assignments: query.data ?? [],
		error:
			query.error ??
			assignMutation.error ??
			replaceMutation.error ??
			revokeMutation.error ??
			searchMutation.error ??
			null,
		isAssigning: assignMutation.isPending,
		isLoading: query.isLoading,
		isReplacing: replaceMutation.isPending,
		isRevoking: revokeMutation.isPending,
		isSearching: searchMutation.isPending,
		replace: (userUuid, role): Promise<RoleAssignmentRead> =>
			replaceMutation.mutateAsync({ role, userUuid }),
		revoke: async (userUuid): Promise<void> => {
			await revokeMutation.mutateAsync(userUuid);
		},
		searchCandidates: (
			queryText
		): Promise<Array<RoleAssignmentCandidateRead>> =>
			searchMutation.mutateAsync(queryText),
	};
};
