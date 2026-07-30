import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	addWorkspaceMember,
	getWorkspaceMembers,
	removeWorkspaceMember,
	searchUsers,
	updateWorkspaceMember,
	type UserRead,
	type WorkspaceMemberCreate,
	type WorkspaceMemberRead,
	type WorkspaceMemberUpdate,
} from "@/fetch/workspaces";

export const workspaceMembersQueryKey = (workspaceUuid: string) =>
	["workspace-members", workspaceUuid] as const;

export type WorkspaceMembersState = {
	addMember: (payload: WorkspaceMemberCreate) => Promise<WorkspaceMemberRead>;
	error: Error | null;
	isAdding: boolean;
	isLoading: boolean;
	isRemoving: boolean;
	isSearching: boolean;
	isUpdatingRole: boolean;
	members: Array<WorkspaceMemberRead>;
	refetch: () => Promise<unknown>;
	removeMember: (userUuid: string) => Promise<void>;
	searchCandidates: (query: string) => Promise<Array<UserRead>>;
	updateMemberRole: (
		userUuid: string,
		payload: WorkspaceMemberUpdate
	) => Promise<WorkspaceMemberRead>;
};

export const useWorkspaceMembers = (
	workspaceUuid: string
): WorkspaceMembersState => {
	const queryClient = useQueryClient();
	const query = useQuery<Array<WorkspaceMemberRead>, Error>({
		enabled: workspaceUuid.length > 0,
		queryFn: () => getWorkspaceMembers(workspaceUuid),
		queryKey: workspaceMembersQueryKey(workspaceUuid),
	});

	const refreshMembers = async (): Promise<void> => {
		await queryClient.invalidateQueries({
			queryKey: workspaceMembersQueryKey(workspaceUuid),
		});
	};

	const addMutation = useMutation({
		mutationFn: (payload: WorkspaceMemberCreate) =>
			addWorkspaceMember(workspaceUuid, payload),
		onSuccess: refreshMembers,
	});

	const updateMutation = useMutation({
		mutationFn: ({
			payload,
			userUuid,
		}: {
			payload: WorkspaceMemberUpdate;
			userUuid: string;
		}) => updateWorkspaceMember(workspaceUuid, userUuid, payload),
		onSuccess: refreshMembers,
	});

	const removeMutation = useMutation({
		mutationFn: (userUuid: string) => removeWorkspaceMember(workspaceUuid, userUuid),
		onSuccess: refreshMembers,
	});

	const searchMutation = useMutation({
		mutationFn: (queryText: string) => searchUsers(queryText, workspaceUuid),
	});

	return {
		addMember: (payload: WorkspaceMemberCreate): Promise<WorkspaceMemberRead> =>
			addMutation.mutateAsync(payload),
		error: query.error ?? null,
		isAdding: addMutation.isPending,
		isLoading: query.isLoading,
		isRemoving: removeMutation.isPending,
		isSearching: searchMutation.isPending,
		isUpdatingRole: updateMutation.isPending,
		members: query.data ?? [],
		refetch: () => query.refetch(),
		removeMember: async (userUuid: string): Promise<void> => {
			await removeMutation.mutateAsync(userUuid);
		},
		searchCandidates: (queryText: string): Promise<Array<UserRead>> =>
			searchMutation.mutateAsync(queryText),
		updateMemberRole: (
			userUuid: string,
			payload: WorkspaceMemberUpdate
		): Promise<WorkspaceMemberRead> =>
			updateMutation.mutateAsync({ payload, userUuid }),
	};
};