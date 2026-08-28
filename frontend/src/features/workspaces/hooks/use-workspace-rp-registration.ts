import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createApplicationRPConfigurationRegistrationDraft,
	createWorkspaceRPApplicationRegistrationDraft,
	getApplicationRPConfigurationRegistrationDraft,
	getWorkspaceRPApplicationRegistrationDraft,
	completeApplicationRPConfigurationRegistration,
	completeWorkspaceRPApplicationRegistration,
	updateApplicationRPConfigurationRegistrationDraft,
	updateWorkspaceRPApplicationRegistrationDraft,
	type ApplicationRPConfigurationRegistrationDraftCreate,
	type WorkspaceRPApplicationRegistrationDraftCreate,
	type WorkspaceRPApplicationRegistrationDraftPatch,
	type WorkspaceRPApplicationRegistrationDraftRead,
	type WorkspaceRPApplicationRegistrationCompletionRead,
} from "@/fetch/rp-applications";
import {
	workspaceRPApplicationQueryKey,
	workspaceRPApplicationsQueryKey,
} from "./use-workspace-rp-applications";
import { applicationRPConfigurationsQueryKey } from "./use-application-rp-configurations";

export const workspaceRPRegistrationDraftQueryKey = (
	workspaceUuid: string,
	rpApplicationUuid: string,
	applicationInformationUuid = ""
) =>
	[
		...workspaceRPApplicationQueryKey(workspaceUuid, rpApplicationUuid),
		"registration-draft",
		...(applicationInformationUuid ? [applicationInformationUuid] : []),
	] as const;

export type WorkspaceRPRegistrationDraftState = {
	draft: WorkspaceRPApplicationRegistrationDraftRead | null;
	error: Error | null;
	isLoading: boolean;
	refetch: () => Promise<WorkspaceRPApplicationRegistrationDraftRead | null>;
};

export type WorkspaceRPRegistrationActions = {
	createApplicationDraft: (
		workspaceUuid: string,
		applicationInformationUuid: string,
		payload: ApplicationRPConfigurationRegistrationDraftCreate,
		registrationCreationKey: string
	) => Promise<WorkspaceRPApplicationRegistrationDraftRead>;
	createDraft: (
		workspaceUuid: string,
		payload: WorkspaceRPApplicationRegistrationDraftCreate,
		registrationCreationKey: string
	) => Promise<WorkspaceRPApplicationRegistrationDraftRead>;
	isCreating: boolean;
	isSaving: boolean;
	isCompleting: boolean;
	saveDraft: (
		workspaceUuid: string,
		rpApplicationUuid: string,
		payload: WorkspaceRPApplicationRegistrationDraftPatch,
		applicationInformationUuid?: string
	) => Promise<WorkspaceRPApplicationRegistrationDraftRead>;
	complete: (
		workspaceUuid: string,
		rpApplicationUuid: string,
		expectedDraftVersion: number,
		applicationInformationUuid?: string
	) => Promise<WorkspaceRPApplicationRegistrationCompletionRead>;
};

export const useWorkspaceRPRegistrationDraft = (
	workspaceUuid: string,
	rpApplicationUuid: string,
	applicationInformationUuid = ""
): WorkspaceRPRegistrationDraftState => {
	const query = useQuery<WorkspaceRPApplicationRegistrationDraftRead, Error>({
		enabled: Boolean(workspaceUuid && rpApplicationUuid),
		queryFn: () =>
			applicationInformationUuid
				? getApplicationRPConfigurationRegistrationDraft(
						workspaceUuid,
						applicationInformationUuid,
						rpApplicationUuid
					)
				: getWorkspaceRPApplicationRegistrationDraft(
						workspaceUuid,
						rpApplicationUuid
					),
		queryKey: workspaceRPRegistrationDraftQueryKey(
			workspaceUuid,
			rpApplicationUuid,
			applicationInformationUuid
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
		const createApplicationMutation = useMutation({
			mutationFn: ({
				applicationInformationUuid,
				payload,
				registrationCreationKey,
				workspaceUuid,
			}: {
				applicationInformationUuid: string;
				payload: ApplicationRPConfigurationRegistrationDraftCreate;
				registrationCreationKey: string;
				workspaceUuid: string;
			}) =>
				createApplicationRPConfigurationRegistrationDraft(
					workspaceUuid,
					applicationInformationUuid,
					payload,
					registrationCreationKey
				),
			onSuccess: async (draft) => {
				queryClient.setQueryData(
					workspaceRPRegistrationDraftQueryKey(
						draft.workspaceUuid,
						draft.rpApplicationUuid,
						draft.applicationInformationUuid
					),
					draft
				);
				await queryClient.invalidateQueries({
					exact: true,
					queryKey: applicationRPConfigurationsQueryKey(
						draft.workspaceUuid,
						draft.applicationInformationUuid
					),
				});
			},
		});
		const saveMutation = useMutation({
			mutationFn: ({
				applicationInformationUuid,
				payload,
				rpApplicationUuid,
				workspaceUuid,
			}: {
				applicationInformationUuid: string;
				payload: WorkspaceRPApplicationRegistrationDraftPatch;
				rpApplicationUuid: string;
				workspaceUuid: string;
			}) =>
				applicationInformationUuid
					? updateApplicationRPConfigurationRegistrationDraft(
							workspaceUuid,
							applicationInformationUuid,
							rpApplicationUuid,
							payload
						)
					: updateWorkspaceRPApplicationRegistrationDraft(
							workspaceUuid,
							rpApplicationUuid,
							payload
						),
			onSuccess: (draft, variables) => {
				queryClient.setQueryData(
					workspaceRPRegistrationDraftQueryKey(
						draft.workspaceUuid,
						draft.rpApplicationUuid,
						variables.applicationInformationUuid
					),
					draft
				);
			},
		});
		const completeMutation = useMutation({
			mutationFn: ({
				applicationInformationUuid,
				expectedDraftVersion,
				rpApplicationUuid,
				workspaceUuid,
			}: {
				applicationInformationUuid: string;
				expectedDraftVersion: number;
				rpApplicationUuid: string;
				workspaceUuid: string;
			}) =>
				applicationInformationUuid
					? completeApplicationRPConfigurationRegistration(
							workspaceUuid,
							applicationInformationUuid,
							rpApplicationUuid,
							expectedDraftVersion
						)
					: completeWorkspaceRPApplicationRegistration(
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
			createApplicationDraft: (
				workspaceUuid: string,
				applicationInformationUuid: string,
				payload: ApplicationRPConfigurationRegistrationDraftCreate,
				registrationCreationKey: string
			): Promise<WorkspaceRPApplicationRegistrationDraftRead> =>
				createApplicationMutation.mutateAsync({
					applicationInformationUuid,
					payload,
					registrationCreationKey,
					workspaceUuid,
				}),
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
			isCreating:
				createMutation.isPending || createApplicationMutation.isPending,
			isSaving: saveMutation.isPending,
			isCompleting: completeMutation.isPending,
			saveDraft: (
				workspaceUuid: string,
				rpApplicationUuid: string,
				payload: WorkspaceRPApplicationRegistrationDraftPatch,
				applicationInformationUuid = ""
			): Promise<WorkspaceRPApplicationRegistrationDraftRead> =>
				saveMutation.mutateAsync({
					applicationInformationUuid,
					payload,
					rpApplicationUuid,
					workspaceUuid,
				}),
			complete: (
				workspaceUuid: string,
				rpApplicationUuid: string,
				expectedDraftVersion: number,
				applicationInformationUuid = ""
			): Promise<WorkspaceRPApplicationRegistrationCompletionRead> =>
				completeMutation.mutateAsync({
					applicationInformationUuid,
					expectedDraftVersion,
					rpApplicationUuid,
					workspaceUuid,
				}),
		};
	};
