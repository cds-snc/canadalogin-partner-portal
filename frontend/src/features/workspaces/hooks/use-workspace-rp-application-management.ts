import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createRPApplication as postRPApplication,
	deleteRPApplication as removeRPApplication,
	updateRPApplication as patchRPApplication,
	type RPApplicationCreate,
	type RPApplicationRead,
	type ApiMessageResponse,
	type RPApplicationUpdate,
} from "@/fetch/rp-applications";
import {
	workspaceRPApplicationQueryKey,
	workspaceRPApplicationsQueryKey,
} from "./use-workspace-rp-applications";

export type WorkspaceRPApplicationManagementState = {
	createRPApplication: (
		workspaceUuid: string,
		payload: RPApplicationCreate
	) => Promise<RPApplicationRead>;
	deleteRPApplication: (
		workspaceUuid: string,
		rpApplicationUuid: string
	) => Promise<ApiMessageResponse>;
	isCreating: boolean;
	isDeleting: boolean;
	isUpdating: boolean;
	updateRPApplication: (
		workspaceUuid: string,
		rpApplicationUuid: string,
		payload: RPApplicationUpdate
	) => Promise<RPApplicationRead>;
};

export const useWorkspaceRPApplicationManagement =
	(): WorkspaceRPApplicationManagementState => {
		const queryClient = useQueryClient();

		const refresh = async (
			workspaceUuid: string,
			rpApplicationUuid?: string
		): Promise<void> => {
			await queryClient.invalidateQueries({
				queryKey: workspaceRPApplicationsQueryKey(workspaceUuid),
			});

			if (rpApplicationUuid) {
				await queryClient.invalidateQueries({
					queryKey: workspaceRPApplicationQueryKey(
						workspaceUuid,
						rpApplicationUuid
					),
				});
			}
		};

		const createMutation = useMutation({
			mutationFn: ({
				payload,
				workspaceUuid,
			}: {
				payload: RPApplicationCreate;
				workspaceUuid: string;
			}) => postRPApplication(workspaceUuid, payload),
			onSuccess: async (application, variables) => {
				await refresh(variables.workspaceUuid, application.uuid);
			},
		});

		const updateMutation = useMutation({
			mutationFn: ({
				payload,
				rpApplicationUuid,
				workspaceUuid,
			}: {
				payload: RPApplicationUpdate;
				rpApplicationUuid: string;
				workspaceUuid: string;
			}) => patchRPApplication(workspaceUuid, rpApplicationUuid, payload),
			onSuccess: async (application, variables) => {
				await refresh(variables.workspaceUuid, application.uuid);
			},
		});

		const deleteMutation = useMutation({
			mutationFn: ({
				rpApplicationUuid,
				workspaceUuid,
			}: {
				rpApplicationUuid: string;
				workspaceUuid: string;
			}) => removeRPApplication(workspaceUuid, rpApplicationUuid),
			onSuccess: async (_response, variables) => {
				await refresh(variables.workspaceUuid, variables.rpApplicationUuid);
			},
		});

		return {
			createRPApplication: (
				workspaceUuid: string,
				payload: RPApplicationCreate
			): Promise<RPApplicationRead> =>
				createMutation.mutateAsync({ payload, workspaceUuid }),
			deleteRPApplication: (
				workspaceUuid: string,
				rpApplicationUuid: string
			): Promise<ApiMessageResponse> =>
				deleteMutation.mutateAsync({ rpApplicationUuid, workspaceUuid }),
			isCreating: createMutation.isPending,
			isDeleting: deleteMutation.isPending,
			isUpdating: updateMutation.isPending,
			updateRPApplication: (
				workspaceUuid: string,
				rpApplicationUuid: string,
				payload: RPApplicationUpdate
			): Promise<RPApplicationRead> =>
				updateMutation.mutateAsync({
					payload,
					rpApplicationUuid,
					workspaceUuid,
				}),
		};
	};
