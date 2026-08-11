import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createApplicationInformation as postApplicationInformation,
	deleteApplicationInformation as removeApplicationInformation,
	updateApplicationInformation as patchApplicationInformation,
	type ApplicationInformationCreate,
	type ApplicationInformationRead,
	type ApplicationInformationUpdate,
} from "@/fetch/workspaces";
import { applicationInformationContactsQueryKey } from "./use-application-information-contacts";
import { applicationInformationReviewQueryKey } from "./use-application-information-review";
import {
	workspaceApplicationInformationListQueryKey,
	workspaceApplicationInformationQueryKey,
} from "./use-workspace-application-information";

export type ApplicationInformationManagementState = {
	createApplicationInformation: (
		workspaceUuid: string,
		payload: ApplicationInformationCreate
	) => Promise<ApplicationInformationRead>;
	deleteApplicationInformation: (
		workspaceUuid: string,
		applicationInformationUuid: string
	) => Promise<void>;
	isCreating: boolean;
	isDeleting: boolean;
	isUpdating: boolean;
	updateApplicationInformation: (
		workspaceUuid: string,
		applicationInformationUuid: string,
		payload: ApplicationInformationUpdate
	) => Promise<ApplicationInformationRead>;
};

export const useApplicationInformationManagement = (): ApplicationInformationManagementState => {
	const queryClient = useQueryClient();

	const refreshApplicationInformation = async (
		workspaceUuid: string,
		applicationInformationUuid?: string
	): Promise<void> => {
		await queryClient.invalidateQueries({
			queryKey: workspaceApplicationInformationListQueryKey(workspaceUuid),
		});

		if (applicationInformationUuid) {
			await queryClient.invalidateQueries({
				queryKey: workspaceApplicationInformationQueryKey(
					workspaceUuid,
					applicationInformationUuid
				),
			});
			await queryClient.invalidateQueries({
				queryKey: applicationInformationContactsQueryKey(
					workspaceUuid,
					applicationInformationUuid
				),
			});
			await queryClient.invalidateQueries({
				queryKey: applicationInformationReviewQueryKey(
					workspaceUuid,
					applicationInformationUuid
				),
			});
		}
	};

	const createMutation = useMutation({
		mutationFn: ({
			payload,
			workspaceUuid,
		}: {
			payload: ApplicationInformationCreate;
			workspaceUuid: string;
		}) => postApplicationInformation(workspaceUuid, payload),
		onSuccess: async (applicationInformation, variables) => {
			await refreshApplicationInformation(
				variables.workspaceUuid,
				applicationInformation.uuid
			);
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({
			applicationInformationUuid,
			payload,
			workspaceUuid,
		}: {
			applicationInformationUuid: string;
			payload: ApplicationInformationUpdate;
			workspaceUuid: string;
		}) =>
			patchApplicationInformation(
				workspaceUuid,
				applicationInformationUuid,
				payload
			),
		onSuccess: async (applicationInformation, variables) => {
			await refreshApplicationInformation(
				variables.workspaceUuid,
				applicationInformation.uuid
			);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: ({
			applicationInformationUuid,
			workspaceUuid,
		}: {
			applicationInformationUuid: string;
			workspaceUuid: string;
		}) =>
			removeApplicationInformation(
				workspaceUuid,
				applicationInformationUuid
			),
		onSuccess: async (_result, variables) => {
			await queryClient.invalidateQueries({
				queryKey: workspaceApplicationInformationListQueryKey(
					variables.workspaceUuid
				),
			});
			queryClient.removeQueries({
				queryKey: workspaceApplicationInformationQueryKey(
					variables.workspaceUuid,
					variables.applicationInformationUuid
				),
			});
			queryClient.removeQueries({
				queryKey: applicationInformationContactsQueryKey(
					variables.workspaceUuid,
					variables.applicationInformationUuid
				),
			});
			queryClient.removeQueries({
				queryKey: applicationInformationReviewQueryKey(
					variables.workspaceUuid,
					variables.applicationInformationUuid
				),
			});
		},
	});

	return {
		createApplicationInformation: (
			workspaceUuid: string,
			payload: ApplicationInformationCreate
		): Promise<ApplicationInformationRead> =>
			createMutation.mutateAsync({ payload, workspaceUuid }),
		deleteApplicationInformation: async (
			workspaceUuid: string,
			applicationInformationUuid: string
		): Promise<void> => {
			await deleteMutation.mutateAsync({
				applicationInformationUuid,
				workspaceUuid,
			});
		},
		isCreating: createMutation.isPending,
		isDeleting: deleteMutation.isPending,
		isUpdating: updateMutation.isPending,
		updateApplicationInformation: (
			workspaceUuid: string,
			applicationInformationUuid: string,
			payload: ApplicationInformationUpdate
		): Promise<ApplicationInformationRead> =>
			updateMutation.mutateAsync({
				applicationInformationUuid,
				payload,
				workspaceUuid,
			}),
	};
};