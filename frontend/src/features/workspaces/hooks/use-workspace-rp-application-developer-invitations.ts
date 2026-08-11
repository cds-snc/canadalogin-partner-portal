import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createWorkspaceRPApplicationDeveloperInvitation,
	getWorkspaceRPApplicationDeveloperInvitations,
	revokeWorkspaceRPApplicationDeveloperInvitation,
	type RPApplicationDeveloperInvitationCreate,
	type RPApplicationDeveloperInvitationRead,
	type RPApplicationDeveloperInvitationWriteResponse,
} from "@/fetch/rp-application-developer-invitations";

export const workspaceRPApplicationDeveloperInvitationsQueryKey = (
	workspaceUuid: string,
	rpApplicationUuid: string
) =>
	[
		"workspace-rp-application-developer-invitations",
		workspaceUuid,
		rpApplicationUuid,
	] as const;

export type WorkspaceRPApplicationDeveloperInvitationsState = {
	createInvitation: (
		payload: RPApplicationDeveloperInvitationCreate
	) => Promise<RPApplicationDeveloperInvitationWriteResponse>;
	error: Error | null;
	invitations: Array<RPApplicationDeveloperInvitationRead>;
	isCreating: boolean;
	isLoading: boolean;
	isRevoking: boolean;
	refetch: () => Promise<unknown>;
	revokeInvitation: (
		invitationUuid: string
	) => Promise<RPApplicationDeveloperInvitationRead>;
};

export const useWorkspaceRPApplicationDeveloperInvitations = (
	workspaceUuid: string,
	rpApplicationUuid: string
): WorkspaceRPApplicationDeveloperInvitationsState => {
	const queryClient = useQueryClient();
	const queryKey = workspaceRPApplicationDeveloperInvitationsQueryKey(
		workspaceUuid,
		rpApplicationUuid
	);
	const query = useQuery<Array<RPApplicationDeveloperInvitationRead>, Error>({
		enabled: workspaceUuid.length > 0 && rpApplicationUuid.length > 0,
		queryFn: () =>
			getWorkspaceRPApplicationDeveloperInvitations(
				workspaceUuid,
				rpApplicationUuid
			),
		queryKey,
	});

	const refreshInvitations = async (): Promise<void> => {
		await queryClient.invalidateQueries({ queryKey });
	};

	const createMutation = useMutation({
		mutationFn: (payload: RPApplicationDeveloperInvitationCreate) =>
			createWorkspaceRPApplicationDeveloperInvitation(
				workspaceUuid,
				rpApplicationUuid,
				payload
			),
		onSuccess: refreshInvitations,
	});

	const revokeMutation = useMutation({
		mutationFn: (invitationUuid: string) =>
			revokeWorkspaceRPApplicationDeveloperInvitation(
				workspaceUuid,
				rpApplicationUuid,
				invitationUuid
			),
		onSuccess: refreshInvitations,
	});

	return {
		createInvitation: (
			payload: RPApplicationDeveloperInvitationCreate
		): Promise<RPApplicationDeveloperInvitationWriteResponse> =>
			createMutation.mutateAsync(payload),
		error:
			createMutation.error ?? revokeMutation.error ?? query.error ?? null,
		invitations: query.data ?? [],
		isCreating: createMutation.isPending,
		isLoading: query.isLoading,
		isRevoking: revokeMutation.isPending,
		refetch: () => query.refetch(),
		revokeInvitation: (
			invitationUuid: string
		): Promise<RPApplicationDeveloperInvitationRead> =>
			revokeMutation.mutateAsync(invitationUuid),
	};
};