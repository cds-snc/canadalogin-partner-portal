import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	getApplicationRPConfigurationUsageAuditTrail,
	getApplicationRPConfigurationUsageAuditTrailSearchAfter,
	getApplicationRPConfigurationUsageSummary,
	getRPApplication,
	getWorkspaceRPApplicationConfiguration,
	getRPApplications,
	getRPApplicationUsageAuditTrail,
	getRPApplicationUsageAuditTrailSearchAfter,
	getRPApplicationUsageSummary,
	type RPApplicationRead,
	type RPApplicationSummaryRead,
	type RPApplicationUsageAuditTrailRead,
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

export const workspaceRPApplicationAuditTrailQueryKey = (
	workspaceUuid: string,
	rpApplicationUuid: string,
	selectedDate: string,
	size: number
) =>
	[
		...workspaceRPApplicationQueryKey(workspaceUuid, rpApplicationUuid),
		"audit-events",
		selectedDate,
		size,
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

export type WorkspaceRPApplicationState = {
	application: RPApplicationRead | null;
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

export type WorkspaceRPApplicationAuditTrailState = {
	error: Error | null;
	events: Array<RPApplicationUsageAuditTrailRead["events"][number]>;
	isLoading: boolean;
	isLoadingMore: boolean;
	loadMore: () => Promise<void>;
	next: string | null;
	refetch: () => Promise<unknown>;
	total: number | null;
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

export const useWorkspaceRPApplication = (
	workspaceUuid: string,
	rpApplicationUuid: string
): WorkspaceRPApplicationState => {
	const query = useQuery<RPApplicationRead, Error>({
		enabled: workspaceUuid.length > 0 && rpApplicationUuid.length > 0,
		queryFn: () => getRPApplication(workspaceUuid, rpApplicationUuid),
		queryKey: workspaceRPApplicationQueryKey(workspaceUuid, rpApplicationUuid),
	});

	return {
		application: query.data ?? null,
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

export const useWorkspaceRPApplicationAuditTrail = (
	workspaceUuid: string,
	rpApplicationUuid: string,
	selectedDate: string,
	size = 25,
	applicationInformationUuid = ""
): WorkspaceRPApplicationAuditTrailState => {
	const queryClient = useQueryClient();
	const legacyQueryKey = workspaceRPApplicationAuditTrailQueryKey(
		workspaceUuid,
		rpApplicationUuid,
		selectedDate,
		size
	);
	const isApplicationScoped = applicationInformationUuid.length > 0;
	const queryKey = isApplicationScoped
		? [...legacyQueryKey, applicationInformationUuid]
		: legacyQueryKey;
	const query = useQuery<RPApplicationUsageAuditTrailRead, Error>({
		enabled:
			workspaceUuid.length > 0 &&
			rpApplicationUuid.length > 0 &&
			selectedDate.length > 0,
		queryFn: () =>
			isApplicationScoped
				? getApplicationRPConfigurationUsageAuditTrail(
						workspaceUuid,
						applicationInformationUuid,
						rpApplicationUuid,
						{ selectedDate, size }
					)
				: getRPApplicationUsageAuditTrail(workspaceUuid, rpApplicationUuid, {
						selectedDate,
						size,
					}),
		queryKey,
	});
	const loadMoreMutation = useMutation<
		RPApplicationUsageAuditTrailRead,
		Error,
		string
	>({
		mutationFn: (searchAfter: string) =>
			isApplicationScoped
				? getApplicationRPConfigurationUsageAuditTrailSearchAfter(
						workspaceUuid,
						applicationInformationUuid,
						rpApplicationUuid,
						{
							searchAfter,
							selectedDate,
							size,
						}
					)
				: getRPApplicationUsageAuditTrailSearchAfter(
						workspaceUuid,
						rpApplicationUuid,
						{
							searchAfter,
							selectedDate,
							size,
						}
					),
		onSuccess: (nextPage) => {
			queryClient.setQueryData<RPApplicationUsageAuditTrailRead>(
				queryKey,
				(currentPage) => {
					if (!currentPage) {
						return nextPage;
					}

					return {
						events: [...currentPage.events, ...nextPage.events],
						next: nextPage.next,
						total: nextPage.total ?? currentPage.total,
					};
				}
			);
		},
	});

	return {
		error: loadMoreMutation.error ?? query.error ?? null,
		events: query.data?.events ?? [],
		isLoading: query.isLoading,
		isLoadingMore: loadMoreMutation.isPending,
		loadMore: async (): Promise<void> => {
			const searchAfter = query.data?.next;
			if (!searchAfter) {
				return;
			}

			await loadMoreMutation.mutateAsync(searchAfter);
		},
		next: query.data?.next ?? null,
		refetch: () => query.refetch(),
		total: query.data?.total ?? null,
	};
};
