import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	getWorkspaceDeveloperInvitation,
	reissueWorkspaceDeveloperInvitation,
	revokeWorkspaceDeveloperInvitation,
	type RPApplicationDeveloperInvitationRead,
	type RPApplicationDeveloperInvitationReissue,
	type RPApplicationDeveloperInvitationWriteResponse,
} from "@/fetch/rp-application-developer-invitations";
import { workspaceAccessInvitationsQueryKey } from "./use-workspace-access-invitations";

export type WorkspaceAccessInvitationState = {
	error: Error | null;
	invitation: RPApplicationDeveloperInvitationRead | null;
	isLoading: boolean;
	isReissuing: boolean;
	isRevoking: boolean;
	reissueInvitation: (
		payload: RPApplicationDeveloperInvitationReissue
	) => Promise<RPApplicationDeveloperInvitationWriteResponse>;
	revokeInvitation: () => Promise<RPApplicationDeveloperInvitationRead>;
};

export const workspaceAccessInvitationQueryKey = (
	workspaceUuid: string,
	invitationUuid: string
) => ["workspace-access-invitation", workspaceUuid, invitationUuid] as const;

export const useWorkspaceAccessInvitation = (
	workspaceUuid: string,
	invitationUuid: string
): WorkspaceAccessInvitationState => {
	const queryClient = useQueryClient();
	const queryKey = workspaceAccessInvitationQueryKey(
		workspaceUuid,
		invitationUuid
	);
	const query = useQuery({
		enabled: workspaceUuid.length > 0 && invitationUuid.length > 0,
		queryFn: () =>
			getWorkspaceDeveloperInvitation(workspaceUuid, invitationUuid),
		queryKey,
	});
	const refresh = async (): Promise<void> => {
		await Promise.all([
			queryClient.invalidateQueries({ queryKey }),
			queryClient.invalidateQueries({
				queryKey: workspaceAccessInvitationsQueryKey(workspaceUuid),
			}),
			queryClient.invalidateQueries({ queryKey: ["user-pending-invitations"] }),
		]);
	};
	const revokeMutation = useMutation({
		mutationFn: () =>
			revokeWorkspaceDeveloperInvitation(workspaceUuid, invitationUuid),
		onSuccess: refresh,
	});
	const reissueMutation = useMutation({
		mutationFn: (payload: RPApplicationDeveloperInvitationReissue) =>
			reissueWorkspaceDeveloperInvitation(
				workspaceUuid,
				invitationUuid,
				payload
			),
		onSuccess: refresh,
	});

	return {
		error: query.error ?? revokeMutation.error ?? reissueMutation.error ?? null,
		invitation: query.data ?? null,
		isLoading: query.isLoading,
		isReissuing: reissueMutation.isPending,
		isRevoking: revokeMutation.isPending,
		reissueInvitation: (
			payload: RPApplicationDeveloperInvitationReissue
		): Promise<RPApplicationDeveloperInvitationWriteResponse> =>
			reissueMutation.mutateAsync(payload),
		revokeInvitation: (): Promise<RPApplicationDeveloperInvitationRead> =>
			revokeMutation.mutateAsync(),
	};
};
