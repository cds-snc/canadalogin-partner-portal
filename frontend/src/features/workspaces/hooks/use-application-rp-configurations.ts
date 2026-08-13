import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createApplicationRPConfigurationProgression,
	getApplicationRPConfiguration,
	getApplicationRPConfigurationConfiguration,
	getApplicationRPConfigurations,
	updateApplicationRPConfigurationPartnerEnvironment,
	type ApplicationRPConfigurationPartnerEnvironmentRead,
	type ApplicationRPConfigurationPartnerEnvironmentUpdate,
	type ApplicationRPConfigurationRead,
	type ApplicationRPConfigurationProgressionCreate,
	type ApplicationRPConfigurationProgressionRead,
	type ApplicationRPConfigurationSummaryRead,
} from "@/fetch/rp-applications";

export const applicationRPConfigurationsQueryKey = (
	workspaceUuid: string,
	applicationInformationUuid: string
) =>
	[
		"application-rp-configurations",
		workspaceUuid,
		applicationInformationUuid,
	] as const;

export type ApplicationRPConfigurationsState = {
	configurations: Array<ApplicationRPConfigurationSummaryRead>;
	error: Error | null;
	isLoading: boolean;
	refetch: () => Promise<unknown>;
};

export type ApplicationRPConfigurationState = {
	configuration: ApplicationRPConfigurationSummaryRead | null;
	error: Error | null;
	isLoading: boolean;
	refetch: () => Promise<unknown>;
};

export type ApplicationRPConfigurationConfigurationState = {
	configuration: ApplicationRPConfigurationRead | null;
	error: Error | null;
	isLoading: boolean;
	refetch: () => Promise<unknown>;
};

export type ApplicationRPConfigurationProgressionActions = {
	createProgression: (
		workspaceUuid: string,
		applicationInformationUuid: string,
		sourceRpConfigurationUuid: string,
		payload: ApplicationRPConfigurationProgressionCreate,
		progressionCreationKey: string
	) => Promise<ApplicationRPConfigurationProgressionRead>;
	isCreating: boolean;
};

export type ApplicationRPConfigurationPartnerEnvironmentActions = {
	isUpdating: boolean;
	updatePartnerEnvironment: (
		workspaceUuid: string,
		applicationInformationUuid: string,
		rpConfigurationUuid: string,
		payload: ApplicationRPConfigurationPartnerEnvironmentUpdate
	) => Promise<ApplicationRPConfigurationPartnerEnvironmentRead>;
};

export const useApplicationRPConfigurations = (
	workspaceUuid: string,
	applicationInformationUuid: string
): ApplicationRPConfigurationsState => {
	const query = useQuery<Array<ApplicationRPConfigurationSummaryRead>, Error>({
		enabled: workspaceUuid.length > 0 && applicationInformationUuid.length > 0,
		queryFn: () =>
			getApplicationRPConfigurations(workspaceUuid, applicationInformationUuid),
		queryKey: applicationRPConfigurationsQueryKey(
			workspaceUuid,
			applicationInformationUuid
		),
	});

	return {
		configurations: query.data ?? [],
		error: query.error ?? null,
		isLoading: query.isLoading,
		refetch: () => query.refetch(),
	};
};

export const useApplicationRPConfiguration = (
	workspaceUuid: string,
	applicationInformationUuid: string,
	rpConfigurationUuid: string
): ApplicationRPConfigurationState => {
	const query = useQuery<ApplicationRPConfigurationSummaryRead, Error>({
		enabled:
			workspaceUuid.length > 0 &&
			applicationInformationUuid.length > 0 &&
			rpConfigurationUuid.length > 0,
		queryFn: () =>
			getApplicationRPConfiguration(
				workspaceUuid,
				applicationInformationUuid,
				rpConfigurationUuid
			),
		queryKey: [
			...applicationRPConfigurationsQueryKey(
				workspaceUuid,
				applicationInformationUuid
			),
			rpConfigurationUuid,
		],
	});

	return {
		configuration: query.data ?? null,
		error: query.error ?? null,
		isLoading: query.isLoading,
		refetch: () => query.refetch(),
	};
};

export const useApplicationRPConfigurationConfiguration = (
	workspaceUuid: string,
	applicationInformationUuid: string,
	rpConfigurationUuid: string
): ApplicationRPConfigurationConfigurationState => {
	const query = useQuery<ApplicationRPConfigurationRead, Error>({
		enabled:
			workspaceUuid.length > 0 &&
			applicationInformationUuid.length > 0 &&
			rpConfigurationUuid.length > 0,
		queryFn: () =>
			getApplicationRPConfigurationConfiguration(
				workspaceUuid,
				applicationInformationUuid,
				rpConfigurationUuid
			),
		queryKey: [
			...applicationRPConfigurationsQueryKey(
				workspaceUuid,
				applicationInformationUuid
			),
			rpConfigurationUuid,
			"configuration",
		],
	});

	return {
		configuration: query.data ?? null,
		error: query.error ?? null,
		isLoading: query.isLoading,
		refetch: () => query.refetch(),
	};
};

export const useApplicationRPConfigurationProgressionActions =
	(): ApplicationRPConfigurationProgressionActions => {
		const queryClient = useQueryClient();
		const mutation = useMutation({
			mutationFn: ({
				applicationInformationUuid,
				payload,
				progressionCreationKey,
				sourceRpConfigurationUuid,
				workspaceUuid,
			}: {
				applicationInformationUuid: string;
				payload: ApplicationRPConfigurationProgressionCreate;
				progressionCreationKey: string;
				sourceRpConfigurationUuid: string;
				workspaceUuid: string;
			}) =>
				createApplicationRPConfigurationProgression(
					workspaceUuid,
					applicationInformationUuid,
					sourceRpConfigurationUuid,
					payload,
					progressionCreationKey
				),
			onSuccess: async (progression) => {
				await queryClient.invalidateQueries({
					exact: true,
					queryKey: applicationRPConfigurationsQueryKey(
						progression.workspaceUuid,
						progression.applicationInformationUuid
					),
				});
			},
		});

		return {
			createProgression: (
				workspaceUuid,
				applicationInformationUuid,
				sourceRpConfigurationUuid,
				payload,
				progressionCreationKey
			) =>
				mutation.mutateAsync({
					applicationInformationUuid,
					payload,
					progressionCreationKey,
					sourceRpConfigurationUuid,
					workspaceUuid,
				}),
			isCreating: mutation.isPending,
		};
	};

export const useApplicationRPConfigurationPartnerEnvironmentActions =
	(): ApplicationRPConfigurationPartnerEnvironmentActions => {
		const queryClient = useQueryClient();
		const mutation = useMutation({
			mutationFn: ({
				applicationInformationUuid,
				payload,
				rpConfigurationUuid,
				workspaceUuid,
			}: {
				applicationInformationUuid: string;
				payload: ApplicationRPConfigurationPartnerEnvironmentUpdate;
				rpConfigurationUuid: string;
				workspaceUuid: string;
			}) =>
				updateApplicationRPConfigurationPartnerEnvironment(
					workspaceUuid,
					applicationInformationUuid,
					rpConfigurationUuid,
					payload
				),
			onSuccess: async (updated) => {
				const rootKey = applicationRPConfigurationsQueryKey(
					updated.workspaceUuid,
					updated.applicationInformationUuid
				);
				await Promise.all([
					queryClient.invalidateQueries({ exact: true, queryKey: rootKey }),
					queryClient.invalidateQueries({
						exact: true,
						queryKey: [...rootKey, updated.rpConfigurationUuid],
					}),
					queryClient.invalidateQueries({
						exact: true,
						queryKey: [
							...rootKey,
							updated.rpConfigurationUuid,
							"configuration",
						],
					}),
				]);
			},
		});

		return {
			isUpdating: mutation.isPending,
			updatePartnerEnvironment: (
				workspaceUuid,
				applicationInformationUuid,
				rpConfigurationUuid,
				payload
			) =>
				mutation.mutateAsync({
					applicationInformationUuid,
					payload,
					rpConfigurationUuid,
					workspaceUuid,
				}),
		};
	};
