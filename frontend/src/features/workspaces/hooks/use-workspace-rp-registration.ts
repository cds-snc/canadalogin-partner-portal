import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createWorkspaceRPApplicationRegistrationDraft,
	getWorkspaceRPApplicationRegistrationDraft,
	submitWorkspaceRPApplicationRegistration,
	updateWorkspaceRPApplicationRegistrationDraft,
	type WorkspaceRPApplicationRegistrationDraftCreate,
	type WorkspaceRPApplicationRegistrationDraftPatch,
	type WorkspaceRPApplicationRegistrationDraftRead,
	type WorkspaceRPApplicationRegistrationSubmissionRead,
} from "@/fetch/rp-applications";
import {
	workspaceRPApplicationQueryKey,
	workspaceRPApplicationsQueryKey,
} from "./use-workspace-rp-applications";

export const workspaceRPRegistrationDraftQueryKey = (
	workspaceUuid: string,
	rpApplicationUuid: string
) =>
	[
		...workspaceRPApplicationQueryKey(workspaceUuid, rpApplicationUuid),
		"registration-draft",
	] as const;

export type WorkspaceRPRegistrationDraftState = {
	draft: WorkspaceRPApplicationRegistrationDraftRead | null;
	error: Error | null;
	isLoading: boolean;
	refetch: () => Promise<WorkspaceRPApplicationRegistrationDraftRead | null>;
};

export type WorkspaceRPRegistrationActions = {
	createDraft: (
		workspaceUuid: string,
		payload: WorkspaceRPApplicationRegistrationDraftCreate,
		registrationCreationKey: string
	) => Promise<WorkspaceRPApplicationRegistrationDraftRead>;
	isCreating: boolean;
	isSaving: boolean;
	isSubmitting: boolean;
	saveDraft: (
		workspaceUuid: string,
		rpApplicationUuid: string,
		payload: WorkspaceRPApplicationRegistrationDraftPatch
	) => Promise<WorkspaceRPApplicationRegistrationDraftRead>;
	submit: (
		workspaceUuid: string,
		rpApplicationUuid: string,
		expectedDraftVersion: number
	) => Promise<WorkspaceRPApplicationRegistrationSubmissionRead>;
};

export const useWorkspaceRPRegistrationDraft = (
	workspaceUuid: string,
	rpApplicationUuid: string
): WorkspaceRPRegistrationDraftState => {
	const query = useQuery<WorkspaceRPApplicationRegistrationDraftRead, Error>({
		enabled: Boolean(workspaceUuid && rpApplicationUuid),
		queryFn: () =>
			getWorkspaceRPApplicationRegistrationDraft(
				workspaceUuid,
				rpApplicationUuid
			),
		queryKey: workspaceRPRegistrationDraftQueryKey(
			workspaceUuid,
			rpApplicationUuid
		),
		retry: false,
	});

	return {
		draft: query.data ?? null,
		error: query.error ?? null,
		isLoading: query.isLoading,
		refetch:
			async (): Promise<WorkspaceRPApplicationRegistrationDraftRead | null> => {
				const result = await query.refetch();
				return result.error ? null : (result.data ?? null);
			},
	};
};

export const useWorkspaceRPRegistrationActions =
	(): WorkspaceRPRegistrationActions => {
		const queryClient = useQueryClient();
		const createMutation = useMutation({
			mutationFn: ({
				payload,
				registrationCreationKey,
				workspaceUuid,
			}: {
				payload: WorkspaceRPApplicationRegistrationDraftCreate;
				registrationCreationKey: string;
				workspaceUuid: string;
			}) =>
				createWorkspaceRPApplicationRegistrationDraft(
					workspaceUuid,
					payload,
					registrationCreationKey
				),
			onSuccess: async (draft) => {
				queryClient.setQueryData(
					workspaceRPRegistrationDraftQueryKey(
						draft.workspaceUuid,
						draft.rpApplicationUuid
					),
					draft
				);
				await queryClient.invalidateQueries({
					exact: true,
					queryKey: workspaceRPApplicationsQueryKey(draft.workspaceUuid),
				});
			},
		});
		const saveMutation = useMutation({
			mutationFn: ({
				payload,
				rpApplicationUuid,
				workspaceUuid,
			}: {
				payload: WorkspaceRPApplicationRegistrationDraftPatch;
				rpApplicationUuid: string;
				workspaceUuid: string;
			}) =>
				updateWorkspaceRPApplicationRegistrationDraft(
					workspaceUuid,
					rpApplicationUuid,
					payload
				),
			onSuccess: (draft) => {
				queryClient.setQueryData(
					workspaceRPRegistrationDraftQueryKey(
						draft.workspaceUuid,
						draft.rpApplicationUuid
					),
					draft
				);
			},
		});
		const submitMutation = useMutation({
			mutationFn: ({
				expectedDraftVersion,
				rpApplicationUuid,
				workspaceUuid,
			}: {
				expectedDraftVersion: number;
				rpApplicationUuid: string;
				workspaceUuid: string;
			}) =>
				submitWorkspaceRPApplicationRegistration(
					workspaceUuid,
					rpApplicationUuid,
					expectedDraftVersion
				),
			onSuccess: async (application, variables) => {
				await Promise.all([
					queryClient.invalidateQueries({
						exact: true,
						queryKey: workspaceRPApplicationsQueryKey(variables.workspaceUuid),
					}),
					queryClient.invalidateQueries({
						exact: true,
						queryKey: workspaceRPApplicationQueryKey(
							variables.workspaceUuid,
							variables.rpApplicationUuid
						),
					}),
				]);
				void application;
			},
		});

		return {
			createDraft: (
				workspaceUuid: string,
				payload: WorkspaceRPApplicationRegistrationDraftCreate,
				registrationCreationKey: string
			): Promise<WorkspaceRPApplicationRegistrationDraftRead> =>
				createMutation.mutateAsync({
					payload,
					registrationCreationKey,
					workspaceUuid,
				}),
			isCreating: createMutation.isPending,
			isSaving: saveMutation.isPending,
			isSubmitting: submitMutation.isPending,
			saveDraft: (
				workspaceUuid: string,
				rpApplicationUuid: string,
				payload: WorkspaceRPApplicationRegistrationDraftPatch
			): Promise<WorkspaceRPApplicationRegistrationDraftRead> =>
				saveMutation.mutateAsync({
					payload,
					rpApplicationUuid,
					workspaceUuid,
				}),
			submit: (
				workspaceUuid: string,
				rpApplicationUuid: string,
				expectedDraftVersion: number
			): Promise<WorkspaceRPApplicationRegistrationSubmissionRead> =>
				submitMutation.mutateAsync({
					expectedDraftVersion,
					rpApplicationUuid,
					workspaceUuid,
				}),
		};
	};
