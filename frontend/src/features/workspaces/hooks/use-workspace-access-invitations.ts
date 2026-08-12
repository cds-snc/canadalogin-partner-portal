import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createWorkspaceDeveloperInvitation,
	getWorkspaceDeveloperInvitations,
	reissueWorkspaceDeveloperInvitation,
	revokeWorkspaceDeveloperInvitation,
	type RPApplicationDeveloperInvitationCreate,
	type RPApplicationDeveloperInvitationRead,
	type RPApplicationDeveloperInvitationReissue,
	type RPApplicationDeveloperInvitationWriteResponse,
} from "@/fetch/rp-application-developer-invitations";

export type WorkspaceAccessInvitation = RPApplicationDeveloperInvitationRead;

export const workspaceAccessInvitationsQueryKey = (workspaceUuid: string) =>
	["workspace-access-invitations", workspaceUuid] as const;

export type WorkspaceAccessInvitationsState = {
	createInvitation: (
		payload: RPApplicationDeveloperInvitationCreate
	) => Promise<RPApplicationDeveloperInvitationWriteResponse>;
	error: Error | null;
	invitations: Array<WorkspaceAccessInvitation>;
	isCreating: boolean;
	isLoading: boolean;
	isReissuing: boolean;
	isRevoking: boolean;
	reissueInvitation: (
		invitationUuid: string,
		payload: RPApplicationDeveloperInvitationReissue
	) => Promise<RPApplicationDeveloperInvitationWriteResponse>;
	refetch: () => Promise<unknown>;
	revokeInvitation: (
		invitationUuid: string
	) => Promise<RPApplicationDeveloperInvitationRead>;
};

export const useWorkspaceAccessInvitations = (
	workspaceUuid: string
): WorkspaceAccessInvitationsState => {
	const queryClient = useQueryClient();
	const query = useQuery<Array<RPApplicationDeveloperInvitationRead>, Error>({
		enabled: workspaceUuid.length > 0,
		queryFn: () => getWorkspaceDeveloperInvitations(workspaceUuid),
		queryKey: workspaceAccessInvitationsQueryKey(workspaceUuid),
	});
	const refresh = async (): Promise<void> => {
		await Promise.all([
			queryClient.invalidateQueries({
				queryKey: ["user-pending-invitations"],
			}),
			queryClient.invalidateQueries({
				queryKey: workspaceAccessInvitationsQueryKey(workspaceUuid),
			}),
			queryClient.invalidateQueries({
				queryKey: [
					"workspace-rp-application-developer-invitations",
					workspaceUuid,
				],
			}),
		]);
	};
	const createMutation = useMutation({
		mutationFn: (payload: RPApplicationDeveloperInvitationCreate) =>
			createWorkspaceDeveloperInvitation(workspaceUuid, payload),
		onSuccess: refresh,
	});
	const revokeMutation = useMutation({
		mutationFn: (invitationUuid: string) =>
			revokeWorkspaceDeveloperInvitation(workspaceUuid, invitationUuid),
		onSuccess: refresh,
	});
	const reissueMutation = useMutation({
		mutationFn: ({
			invitationUuid,
			payload,
		}: {
			invitationUuid: string;
			payload: RPApplicationDeveloperInvitationReissue;
		}) =>
			reissueWorkspaceDeveloperInvitation(
				workspaceUuid,
				invitationUuid,
				payload
			),
		onSuccess: refresh,
	});

	return {
		createInvitation: (payload) => createMutation.mutateAsync(payload),
		error:
			query.error ??
			createMutation.error ??
			reissueMutation.error ??
			revokeMutation.error ??
			null,
		invitations: [...(query.data ?? [])].sort((left, right) =>
			right.createdAt.localeCompare(left.createdAt)
		),
		isCreating: createMutation.isPending,
		isLoading: query.isLoading,
		isReissuing: reissueMutation.isPending,
		isRevoking: revokeMutation.isPending,
		reissueInvitation: (invitationUuid, payload) =>
			reissueMutation.mutateAsync({ invitationUuid, payload }),
		refetch: () => query.refetch(),
		revokeInvitation: (invitationUuid) =>
			revokeMutation.mutateAsync(invitationUuid),
	};
};
