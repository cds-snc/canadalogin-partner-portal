import { useQuery } from "@tanstack/react-query";
import { getWorkspace, type WorkspaceRead } from "@/fetch/workspaces";

export const workspaceQueryKey = (workspaceUuid: string) =>
	["workspace", workspaceUuid] as const;

export type WorkspaceState = {
	error: Error | null;
	isLoading: boolean;
	refetch: () => Promise<unknown>;
	workspace: WorkspaceRead | null;
};

export const useWorkspace = (workspaceUuid: string): WorkspaceState => {
	const query = useQuery<WorkspaceRead, Error>({
		enabled: workspaceUuid.length > 0,
		queryFn: () => getWorkspace(workspaceUuid),
		queryKey: workspaceQueryKey(workspaceUuid),
	});

	return {
		error: query.error ?? null,
		isLoading: query.isLoading,
		refetch: () => query.refetch(),
		workspace: query.data ?? null,
	};
};