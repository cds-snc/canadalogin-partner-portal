import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PartnerRole } from "@/features/auth/authorization";
import {
	getWorkspaceRoleAssignment,
	replaceWorkspaceRoleAssignment,
	revokeWorkspaceRoleAssignment,
	type RoleAssignmentRead,
} from "@/fetch/role-assignments";
import type { ApiMessageResponse } from "@/fetch/api-types";
import { workspaceRoleAssignmentsQueryKey } from "./use-workspace-role-assignments";

export type WorkspaceRoleAssignmentState = {
	assignment: RoleAssignmentRead | null;
	error: Error | null;
	isLoading: boolean;
	isReplacing: boolean;
	isRevoking: boolean;
	replace: (role: PartnerRole) => Promise<RoleAssignmentRead>;
	revoke: () => Promise<ApiMessageResponse>;
};

export const workspaceRoleAssignmentQueryKey = (
	workspaceUuid: string,
	assignmentUuid: string
) => ["workspace-role-assignment", workspaceUuid, assignmentUuid] as const;

export const useWorkspaceRoleAssignment = (
	workspaceUuid: string,
	assignmentUuid: string
): WorkspaceRoleAssignmentState => {
	const queryClient = useQueryClient();
	const queryKey = workspaceRoleAssignmentQueryKey(
		workspaceUuid,
		assignmentUuid
	);
	const query = useQuery<RoleAssignmentRead, Error>({
		enabled: workspaceUuid.length > 0 && assignmentUuid.length > 0,
		queryFn: () => getWorkspaceRoleAssignment(workspaceUuid, assignmentUuid),
		queryKey,
	});
	const refresh = async (): Promise<void> => {
		await Promise.all([
			queryClient.invalidateQueries({ queryKey }),
			queryClient.invalidateQueries({
				queryKey: workspaceRoleAssignmentsQueryKey(workspaceUuid),
			}),
			queryClient.invalidateQueries({ queryKey: ["users"] }),
		]);
	};
	const replaceMutation = useMutation({
		mutationFn: (role: PartnerRole) =>
			replaceWorkspaceRoleAssignment(workspaceUuid, assignmentUuid, role),
		onSuccess: refresh,
	});
	const revokeMutation = useMutation({
		mutationFn: () =>
			revokeWorkspaceRoleAssignment(workspaceUuid, assignmentUuid),
		onSuccess: refresh,
	});

	return {
		assignment: query.data ?? null,
		error: query.error ?? replaceMutation.error ?? revokeMutation.error ?? null,
		isLoading: query.isLoading,
		isReplacing: replaceMutation.isPending,
		isRevoking: revokeMutation.isPending,
		replace: (role: PartnerRole): Promise<RoleAssignmentRead> =>
			replaceMutation.mutateAsync(role),
		revoke: (): Promise<ApiMessageResponse> => revokeMutation.mutateAsync(),
	};
};
