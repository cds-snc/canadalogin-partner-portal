import { useQuery } from "@tanstack/react-query";
import {
	getApplicationRPConfigurationUsageSummary,
	getWorkspaceRPApplicationConfiguration,
	getRPApplications,
	getRPApplicationUsageSummary,
	type RPApplicationSummaryRead,
	type RPApplicationUsageSummaryRead,
	type WorkspaceRPApplicationConfigurationRead,
} from "@/fetch/rp-applications";

export const workspaceRPApplicationsQueryKey = (workspaceUuid: string) =>
	["workspace-rp-applications", workspaceUuid] as const;

export const workspaceRPApplicationQueryKey = (
	workspaceUuid: string,
	rpApplicationUuid: string
) =>
	[
		...workspaceRPApplicationsQueryKey(workspaceUuid),
		rpApplicationUuid,
	] as const;

export const workspaceRPApplicationConfigurationQueryKey = (
	workspaceUuid: string,
	rpApplicationUuid: string
) =>
	[
		...workspaceRPApplicationQueryKey(workspaceUuid, rpApplicationUuid),
		"configuration",
	] as const;

export const workspaceRPApplicationUsageSummaryQueryKey = (
	workspaceUuid: string,
	rpApplicationUuid: string,
	selectedDate: string
) =>
	[
		...workspaceRPApplicationQueryKey(workspaceUuid, rpApplicationUuid),
		"usage-summary",
		selectedDate,
	] as const;

export type WorkspaceRPApplicationsState = {
	applications: Array<RPApplicationSummaryRead>;
	error: Error | null;
	isLoading: boolean;
	refetch: () => Promise<unknown>;
};

export type WorkspaceRPApplicationConfigurationState = {
	configuration: WorkspaceRPApplicationConfigurationRead | null;
	error: Error | null;
	isLoading: boolean;
	refetch: () => Promise<unknown>;
};

export type WorkspaceRPApplicationUsageSummaryState = {
	error: Error | null;
	isLoading: boolean;
	refetch: () => Promise<unknown>;
	summary: RPApplicationUsageSummaryRead | null;
};

export const useWorkspaceRPApplications = (
	workspaceUuid: string
): WorkspaceRPApplicationsState => {
	const query = useQuery<Array<RPApplicationSummaryRead>, Error>({
		enabled: workspaceUuid.length > 0,
		queryFn: () => getRPApplications(workspaceUuid),
		queryKey: workspaceRPApplicationsQueryKey(workspaceUuid),
	});

	return {
		applications: query.data ?? [],
		error: query.error ?? null,
		isLoading: query.isLoading,
		refetch: () => query.refetch(),
	};
};

export const useWorkspaceRPApplicationConfiguration = (
	workspaceUuid: string,
	rpApplicationUuid: string
): WorkspaceRPApplicationConfigurationState => {
	const query = useQuery<WorkspaceRPApplicationConfigurationRead, Error>({
		enabled: workspaceUuid.length > 0 && rpApplicationUuid.length > 0,
		queryFn: () =>
			getWorkspaceRPApplicationConfiguration(workspaceUuid, rpApplicationUuid),
		queryKey: workspaceRPApplicationConfigurationQueryKey(
			workspaceUuid,
			rpApplicationUuid
		),
	});

	return {
		configuration: query.data ?? null,
		error: query.error ?? null,
		isLoading: query.isLoading,
		refetch: () => query.refetch(),
	};
};

export const useWorkspaceRPApplicationUsageSummary = (
	workspaceUuid: string,
	rpApplicationUuid: string,
	selectedDate: string,
	applicationInformationUuid = ""
): WorkspaceRPApplicationUsageSummaryState => {
	const isApplicationScoped = applicationInformationUuid.length > 0;
	const query = useQuery<RPApplicationUsageSummaryRead, Error>({
		enabled:
			workspaceUuid.length > 0 &&
			rpApplicationUuid.length > 0 &&
			selectedDate.length > 0,
		queryFn: () =>
			isApplicationScoped
				? getApplicationRPConfigurationUsageSummary(
						workspaceUuid,
						applicationInformationUuid,
						rpApplicationUuid,
						selectedDate
					)
				: getRPApplicationUsageSummary(
						workspaceUuid,
						rpApplicationUuid,
						selectedDate
					),
		queryKey: isApplicationScoped
			? [
					...workspaceRPApplicationUsageSummaryQueryKey(
						workspaceUuid,
						rpApplicationUuid,
						selectedDate
					),
					applicationInformationUuid,
				]
			: workspaceRPApplicationUsageSummaryQueryKey(
					workspaceUuid,
					rpApplicationUuid,
					selectedDate
				),
	});

	return {
		error: query.error ?? null,
		isLoading: query.isLoading,
		refetch: () => query.refetch(),
		summary: query.data ?? null,
	};
};
