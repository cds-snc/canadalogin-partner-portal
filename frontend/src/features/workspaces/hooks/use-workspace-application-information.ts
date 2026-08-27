import { useQuery } from "@tanstack/react-query";
import {
	getApplicationInformation,
	getApplicationInformationList,
	type ApplicationInformationRead,
} from "@/fetch/workspaces";

export const workspaceApplicationInformationListQueryKey = (
	workspaceUuid: string
) => ["workspace-application-information", workspaceUuid] as const;

export const workspaceApplicationInformationQueryKey = (
	workspaceUuid: string,
	applicationInformationUuid: string
) =>
	[
		...workspaceApplicationInformationListQueryKey(workspaceUuid),
		applicationInformationUuid,
	] as const;

export type WorkspaceApplicationInformationListState = {
	applicationInformationRecords: Array<ApplicationInformationRead>;
	error: Error | null;
	isLoading: boolean;
	refetch: () => Promise<unknown>;
};

export type WorkspaceApplicationInformationState = {
	applicationInformation: ApplicationInformationRead | null;
	error: Error | null;
	isLoading: boolean;
	refetch: () => Promise<unknown>;
};

export const useWorkspaceApplicationInformationList = (
	workspaceUuid: string
): WorkspaceApplicationInformationListState => {
	const query = useQuery<Array<ApplicationInformationRead>, Error>({
		enabled: workspaceUuid.length > 0,
		queryFn: () => getApplicationInformationList(workspaceUuid),
		queryKey: workspaceApplicationInformationListQueryKey(workspaceUuid),
	});

	return {
		applicationInformationRecords: query.data ?? [],
		error: query.error ?? null,
		isLoading: query.isLoading,
		refetch: () => query.refetch(),
	};
};

export const useWorkspaceApplicationInformation = (
	workspaceUuid: string,
	applicationInformationUuid: string
): WorkspaceApplicationInformationState => {
	const query = useQuery<ApplicationInformationRead, Error>({
		enabled: workspaceUuid.length > 0 && applicationInformationUuid.length > 0,
		queryFn: () =>
			getApplicationInformation(workspaceUuid, applicationInformationUuid),
		queryKey: workspaceApplicationInformationQueryKey(
			workspaceUuid,
			applicationInformationUuid
		),
	});

	return {
		applicationInformation: query.data ?? null,
		error: query.error ?? null,
		isLoading: query.isLoading,
		refetch: () => query.refetch(),
	};
};
