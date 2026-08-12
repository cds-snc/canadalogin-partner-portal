import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	deleteRPApplication as removeRPApplication,
	updateRPApplication as patchRPApplication,
	type RPApplicationRead,
	type ApiMessageResponse,
	type RPApplicationUpdate,
} from "@/fetch/rp-applications";
import {
	workspaceRPApplicationQueryKey,
	workspaceRPApplicationsQueryKey,
} from "./use-workspace-rp-applications";

export type WorkspaceRPApplicationManagementState = {
	deleteRPApplication: (
		workspaceUuid: string,
		rpApplicationUuid: string
	) => Promise<ApiMessageResponse>;
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
			deleteRPApplication: (
				workspaceUuid: string,
				rpApplicationUuid: string
			): Promise<ApiMessageResponse> =>
				deleteMutation.mutateAsync({ rpApplicationUuid, workspaceUuid }),
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
