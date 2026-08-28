import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PartnerRole } from "@/features/auth/authorization";
import { createWorkspaceDeveloperInvitation } from "@/fetch/rp-application-developer-invitations";
import { resolveUserInvitationTarget } from "@/fetch/users";

type InviteUserInput = {
	inviteExpiresAt: string;
	invitedEmail: string;
	role: PartnerRole;
	workspaceUuid: string;
};

export type InviteUserOutcome =
	| { kind: "existing_identity"; userUuid: string }
	| { kind: "ineligible_identity" }
	| { acceptanceUrl: string; kind: "invitation_created" };

export type InviteUserState = {
	error: Error | null;
	invite: (input: InviteUserInput) => Promise<InviteUserOutcome>;
	isInviting: boolean;
};

export const useInviteUser = (): InviteUserState => {
	const queryClient = useQueryClient();
	const mutation = useMutation<InviteUserOutcome, Error, InviteUserInput>({
		mutationFn: async (input) => {
			const resolution = await resolveUserInvitationTarget(input.invitedEmail);
			if (resolution.outcome === "existing_identity" && resolution.userUuid) {
				return {
					kind: "existing_identity",
					userUuid: resolution.userUuid,
				};
			}
			if (resolution.outcome === "ineligible_identity") {
				return { kind: "ineligible_identity" };
			}
			const invitation = await createWorkspaceDeveloperInvitation(
				input.workspaceUuid,
				{
					invitedEmail: input.invitedEmail,
					inviteExpiresAt: input.inviteExpiresAt,
					role: input.role,
				}
			);
			return {
				acceptanceUrl: invitation.acceptanceUrl,
				kind: "invitation_created",
			};
		},
		onSuccess: async (_, input) => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["users"] }),
				queryClient.invalidateQueries({
					queryKey: ["user-pending-invitations"],
				}),
				queryClient.invalidateQueries({
					queryKey: ["workspace-access-invitations", input.workspaceUuid],
				}),
			]);
		},
	});

	return {
		error: mutation.error ?? null,
		invite: (input: InviteUserInput): Promise<InviteUserOutcome> =>
			mutation.mutateAsync(input),
		isInviting: mutation.isPending,
	};
};
