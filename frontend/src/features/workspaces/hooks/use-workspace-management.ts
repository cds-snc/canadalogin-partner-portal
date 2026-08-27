import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createWorkspace as postWorkspace,
	deleteWorkspace as removeWorkspace,
	updateWorkspace as patchWorkspace,
	type WorkspaceCreate,
	type WorkspaceRead,
	type WorkspaceUpdate,
} from "@/fetch/workspaces";
import { workspaceQueryKey } from "./use-workspace";
import { workspacesQueryKey } from "./use-workspaces";

export type WorkspaceManagementState = {
	createWorkspace: (payload: WorkspaceCreate) => Promise<WorkspaceRead>;
	deleteWorkspace: (workspaceUuid: string) => Promise<void>;
	isCreating: boolean;
	isDeleting: boolean;
	isUpdating: boolean;
	updateWorkspace: (
		workspaceUuid: string,
		payload: WorkspaceUpdate
	) => Promise<WorkspaceRead>;
};

export const useWorkspaceManagement = (): WorkspaceManagementState => {
	const queryClient = useQueryClient();

	const invalidateWorkspaceQueries = async (
		workspaceUuid?: string
	): Promise<void> => {
		await queryClient.invalidateQueries({ queryKey: workspacesQueryKey });

		if (workspaceUuid) {
			await queryClient.invalidateQueries({
				queryKey: workspaceQueryKey(workspaceUuid),
			});
		}
	};

	const removeWorkspaceQuery = (workspaceUuid: string): void => {
		queryClient.removeQueries({
			queryKey: workspaceQueryKey(workspaceUuid),
		});
	};

	const createMutation = useMutation({
		mutationFn: postWorkspace,
		onSuccess: async (workspace) => {
			await invalidateWorkspaceQueries(workspace.uuid);
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({
			payload,
			workspaceUuid,
		}: {
			payload: WorkspaceUpdate;
			workspaceUuid: string;
		}) => patchWorkspace(workspaceUuid, payload),
		onSuccess: async (workspace) => {
			await invalidateWorkspaceQueries(workspace.uuid);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: removeWorkspace,
		onSuccess: async (_result, workspaceUuid) => {
			await queryClient.invalidateQueries({ queryKey: workspacesQueryKey });
			removeWorkspaceQuery(workspaceUuid);
		},
	});

	return {
		createWorkspace: (payload: WorkspaceCreate): Promise<WorkspaceRead> =>
			createMutation.mutateAsync(payload),
		deleteWorkspace: async (workspaceUuid: string): Promise<void> => {
			await deleteMutation.mutateAsync(workspaceUuid);
		},
		isCreating: createMutation.isPending,
		isDeleting: deleteMutation.isPending,
		isUpdating: updateMutation.isPending,
		updateWorkspace: (
			workspaceUuid: string,
			payload: WorkspaceUpdate
		): Promise<WorkspaceRead> =>
			updateMutation.mutateAsync({ payload, workspaceUuid }),
	};
};
