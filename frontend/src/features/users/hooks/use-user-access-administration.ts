import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { currentUserQueryKey } from "@/features/auth/session-queries";
import type { PartnerRole } from "@/features/auth/authorization";
import {
	assignClAdminRole,
	assignWorkspaceRole,
	replaceWorkspaceRole,
	revokeClAdminRole,
	revokeWorkspaceRole,
} from "@/fetch/role-assignments";
import { revokeWorkspaceDeveloperInvitation } from "@/fetch/rp-application-developer-invitations";
import {
	getUserAccessAdministration,
	type UserAccessAdministrationRead,
} from "@/fetch/users";

export const userAccessAdministrationQueryKey = (userUuid: string) =>
	["user-access-administration", userUuid] as const;

export type UserAccessAdministrationState = {
	access: UserAccessAdministrationRead | null;
	assignGlobal: () => Promise<unknown>;
	assignWorkspace: (
		workspaceUuid: string,
		role: PartnerRole
	) => Promise<unknown>;
	error: Error | null;
	isLoading: boolean;
	isMutating: boolean;
	refetch: () => Promise<unknown>;
	replaceWorkspace: (
		workspaceUuid: string,
		role: PartnerRole
	) => Promise<unknown>;
	revokeGlobal: () => Promise<unknown>;
	revokeInvitation: (
		workspaceUuid: string,
		invitationUuid: string
	) => Promise<unknown>;
	revokeWorkspace: (workspaceUuid: string) => Promise<unknown>;
};

export const useUserAccessAdministration = (
	userUuid: string
): UserAccessAdministrationState => {
	const queryClient = useQueryClient();
	const query = useQuery<UserAccessAdministrationRead, Error>({
		enabled: userUuid.length > 0,
		queryFn: () => getUserAccessAdministration(userUuid),
		queryKey: userAccessAdministrationQueryKey(userUuid),
	});
	const refresh = async (workspaceUuid?: string): Promise<void> => {
		await Promise.all([
			queryClient.invalidateQueries({
				queryKey: userAccessAdministrationQueryKey(userUuid),
			}),
			queryClient.invalidateQueries({ queryKey: ["users"] }),
			queryClient.invalidateQueries({ queryKey: ["cl-admin-assignments"] }),
			queryClient.invalidateQueries({ queryKey: currentUserQueryKey }),
			...(workspaceUuid
				? [
						queryClient.invalidateQueries({
							queryKey: ["workspace-role-assignments", workspaceUuid],
						}),
						queryClient.invalidateQueries({
							queryKey: ["workspace-access-invitations", workspaceUuid],
						}),
					]
				: []),
		]);
	};
	const assignGlobalMutation = useMutation({
		mutationFn: () => assignClAdminRole(userUuid),
		onSuccess: () => refresh(),
	});
	const revokeGlobalMutation = useMutation({
		mutationFn: () => revokeClAdminRole(userUuid),
		onSuccess: () => refresh(),
	});
	const assignWorkspaceMutation = useMutation({
		mutationFn: ({
			role,
			workspaceUuid,
		}: {
			role: PartnerRole;
			workspaceUuid: string;
		}) => assignWorkspaceRole(workspaceUuid, { role, userUuid }),
		onSuccess: (_, variables) => refresh(variables.workspaceUuid),
	});
	const replaceWorkspaceMutation = useMutation({
		mutationFn: ({
			role,
			workspaceUuid,
		}: {
			role: PartnerRole;
			workspaceUuid: string;
		}) => replaceWorkspaceRole(workspaceUuid, userUuid, role),
		onSuccess: (_, variables) => refresh(variables.workspaceUuid),
	});
	const revokeWorkspaceMutation = useMutation({
		mutationFn: (workspaceUuid: string) =>
			revokeWorkspaceRole(workspaceUuid, userUuid),
		onSuccess: (_, workspaceUuid) => refresh(workspaceUuid),
	});
	const revokeInvitationMutation = useMutation({
		mutationFn: ({
			invitationUuid,
			workspaceUuid,
		}: {
			invitationUuid: string;
			workspaceUuid: string;
		}) => revokeWorkspaceDeveloperInvitation(workspaceUuid, invitationUuid),
		onSuccess: (_, variables) => refresh(variables.workspaceUuid),
	});

	return {
		access: query.data ?? null,
		assignGlobal: (): Promise<unknown> => assignGlobalMutation.mutateAsync(),
		assignWorkspace: (
			workspaceUuid: string,
			role: PartnerRole
		): Promise<unknown> =>
			assignWorkspaceMutation.mutateAsync({ role, workspaceUuid }),
		error:
			query.error ??
			assignGlobalMutation.error ??
			revokeGlobalMutation.error ??
			assignWorkspaceMutation.error ??
			replaceWorkspaceMutation.error ??
			revokeWorkspaceMutation.error ??
			revokeInvitationMutation.error ??
			null,
		isLoading: query.isLoading,
		isMutating:
			assignGlobalMutation.isPending ||
			revokeGlobalMutation.isPending ||
			assignWorkspaceMutation.isPending ||
			replaceWorkspaceMutation.isPending ||
			revokeWorkspaceMutation.isPending ||
			revokeInvitationMutation.isPending,
		refetch: (): Promise<unknown> => query.refetch(),
		replaceWorkspace: (
			workspaceUuid: string,
			role: PartnerRole
		): Promise<unknown> =>
			replaceWorkspaceMutation.mutateAsync({ role, workspaceUuid }),
		revokeGlobal: (): Promise<unknown> => revokeGlobalMutation.mutateAsync(),
		revokeInvitation: (
			workspaceUuid: string,
			invitationUuid: string
		): Promise<unknown> =>
			revokeInvitationMutation.mutateAsync({
				invitationUuid,
				workspaceUuid,
			}),
		revokeWorkspace: (workspaceUuid: string): Promise<unknown> =>
			revokeWorkspaceMutation.mutateAsync(workspaceUuid),
	};
};
