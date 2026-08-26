import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createApplicationRPConfigurationCopy,
	getApplicationRPConfiguration,
	getApplicationRPConfigurationConfiguration,
	getApplicationRPConfigurations,
	updateApplicationRPConfigurationPartnerEnvironment,
	type ApplicationRPConfigurationCopyCreate,
	type ApplicationRPConfigurationCopyRead,
	type ApplicationRPConfigurationPartnerEnvironmentRead,
	type ApplicationRPConfigurationPartnerEnvironmentUpdate,
	type ApplicationRPConfigurationRead,
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

export type ApplicationRPConfigurationCopyActions = {
	copyConfiguration: (
		workspaceUuid: string,
		applicationInformationUuid: string,
		sourceRpConfigurationUuid: string,
		payload: ApplicationRPConfigurationCopyCreate,
		copyCreationKey: string
	) => Promise<ApplicationRPConfigurationCopyRead>;
	isCopying: boolean;
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
	applicationInformationUuid: string,
	enabled = true
): ApplicationRPConfigurationsState => {
	const query = useQuery<Array<ApplicationRPConfigurationSummaryRead>, Error>({
		enabled:
			enabled &&
			workspaceUuid.length > 0 &&
			applicationInformationUuid.length > 0,
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

export const useApplicationRPConfigurationCopyActions =
	(): ApplicationRPConfigurationCopyActions => {
		const queryClient = useQueryClient();
		const mutation = useMutation({
			mutationFn: ({
				applicationInformationUuid,
				copyCreationKey,
				payload,
				sourceRpConfigurationUuid,
				workspaceUuid,
			}: {
				applicationInformationUuid: string;
				copyCreationKey: string;
				payload: ApplicationRPConfigurationCopyCreate;
				sourceRpConfigurationUuid: string;
				workspaceUuid: string;
			}) =>
				createApplicationRPConfigurationCopy(
					workspaceUuid,
					applicationInformationUuid,
					sourceRpConfigurationUuid,
					payload,
					copyCreationKey
				),
			onSuccess: async (copied) => {
				await queryClient.invalidateQueries({
					exact: true,
					queryKey: applicationRPConfigurationsQueryKey(
						copied.workspaceUuid,
						copied.applicationInformationUuid
					),
				});
			},
		});

		return {
			copyConfiguration: (
				workspaceUuid,
				applicationInformationUuid,
				sourceRpConfigurationUuid,
				payload,
				copyCreationKey
			): Promise<ApplicationRPConfigurationCopyRead> =>
				mutation.mutateAsync({
					applicationInformationUuid,
					copyCreationKey,
					payload,
					sourceRpConfigurationUuid,
					workspaceUuid,
				}),
			isCopying: mutation.isPending,
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
