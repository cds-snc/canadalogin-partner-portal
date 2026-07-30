import { useQuery } from "@tanstack/react-query";
import {
	getCurrentUserWorkspaces,
	type WorkspaceRead,
} from "@/fetch/workspaces";

export const workspacesQueryKey = ["workspaces", "mine"] as const;

export type WorkspacesState = {
	error: Error | null;
	isLoading: boolean;
	refetch: () => Promise<unknown>;
	workspaces: Array<WorkspaceRead>;
};

export const useWorkspaces = (): WorkspacesState => {
	const query = useQuery<Array<WorkspaceRead>, Error>({
		queryFn: getCurrentUserWorkspaces,
		queryKey: workspacesQueryKey,
	});

	return {
		error: query.error ?? null,
		isLoading: query.isLoading,
		refetch: () => query.refetch(),
		workspaces: query.data ?? [],
	};
};