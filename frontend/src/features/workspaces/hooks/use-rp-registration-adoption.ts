import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	getRPApplicationAdoptionCandidatePreview,
	getRPApplicationAdoptionCandidates,
	linkRPApplicationToWorkspace,
	type RPApplicationAdoptionCandidateListRead,
	type RPApplicationAdoptionCandidatePreviewRead,
	type RPApplicationWorkspaceAdoptionRead,
	type RPApplicationWorkspaceLinkWrite,
} from "@/fetch/rp-applications";
import { workspacesQueryKey } from "./use-workspaces";
import {
	workspaceRPApplicationQueryKey,
	workspaceRPApplicationsQueryKey,
} from "./use-workspace-rp-applications";

export const rpRegistrationAdoptionCandidatesQueryKey = [
	"rp-registration-adoption",
	"candidates",
] as const;

export const rpRegistrationAdoptionPreviewQueryKey = (
	rpApplicationUuid: string
) => [...rpRegistrationAdoptionCandidatesQueryKey, rpApplicationUuid] as const;

export type RPRegistrationAdoptionCandidatesState = {
	candidates: RPApplicationAdoptionCandidateListRead["items"];
	error: Error | null;
	isLoading: boolean;
	refetch: () => Promise<unknown>;
};

export type RPRegistrationAdoptionPreviewState = {
	error: Error | null;
	isLoading: boolean;
	preview: RPApplicationAdoptionCandidatePreviewRead | null;
	refetch: () => Promise<unknown>;
};

export const useRPRegistrationAdoptionCandidates =
	(): RPRegistrationAdoptionCandidatesState => {
		const query = useQuery<RPApplicationAdoptionCandidateListRead, Error>({
			queryFn: getRPApplicationAdoptionCandidates,
			queryKey: rpRegistrationAdoptionCandidatesQueryKey,
			retry: false,
		});

		return {
			candidates: query.data?.items ?? [],
			error: query.error ?? null,
			isLoading: query.isLoading,
			refetch: async (): Promise<unknown> => query.refetch(),
		};
	};

export const useRPRegistrationAdoptionPreview = (
	rpApplicationUuid: string
): RPRegistrationAdoptionPreviewState => {
	const query = useQuery<RPApplicationAdoptionCandidatePreviewRead, Error>({
		enabled: rpApplicationUuid.length > 0,
		queryFn: () => getRPApplicationAdoptionCandidatePreview(rpApplicationUuid),
		queryKey: rpRegistrationAdoptionPreviewQueryKey(rpApplicationUuid),
		retry: false,
	});

	return {
		error: query.error ?? null,
		isLoading: query.isLoading,
		preview: query.data ?? null,
		refetch: async (): Promise<unknown> => query.refetch(),
	};
};

export type RPRegistrationAdoptionActions = {
	isLinking: boolean;
	linkToWorkspace: (
		rpApplicationUuid: string,
		payload: RPApplicationWorkspaceLinkWrite
	) => Promise<RPApplicationWorkspaceAdoptionRead>;
};

export const useRPRegistrationAdoptionActions =
	(): RPRegistrationAdoptionActions => {
		const queryClient = useQueryClient();
		const mutation = useMutation({
			mutationFn: ({
				payload,
				rpApplicationUuid,
			}: {
				payload: RPApplicationWorkspaceLinkWrite;
				rpApplicationUuid: string;
			}) => linkRPApplicationToWorkspace(rpApplicationUuid, payload),
			onSuccess: async (adopted) => {
				await Promise.all([
					queryClient.invalidateQueries({
						exact: true,
						queryKey: rpRegistrationAdoptionCandidatesQueryKey,
					}),
					queryClient.invalidateQueries({
						exact: true,
						queryKey: rpRegistrationAdoptionPreviewQueryKey(
							adopted.rpApplicationUuid
						),
					}),
					queryClient.invalidateQueries({
						exact: true,
						queryKey: workspacesQueryKey,
					}),
					queryClient.invalidateQueries({
						exact: true,
						queryKey: workspaceRPApplicationsQueryKey(adopted.workspaceUuid),
					}),
					queryClient.invalidateQueries({
						exact: true,
						queryKey: workspaceRPApplicationQueryKey(
							adopted.workspaceUuid,
							adopted.rpApplicationUuid
						),
					}),
				]);
			},
		});

		return {
			isLinking: mutation.isPending,
			linkToWorkspace: (
				rpApplicationUuid: string,
				payload: RPApplicationWorkspaceLinkWrite
			): Promise<RPApplicationWorkspaceAdoptionRead> =>
				mutation.mutateAsync({ payload, rpApplicationUuid }),
		};
	};
