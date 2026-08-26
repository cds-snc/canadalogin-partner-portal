import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	getApplicationRPConfigurationProductionReview,
	requestApplicationRPConfigurationProductionReview,
	reviewApplicationRPConfigurationProductionRequest,
	type ApplicationRPConfigurationProductionReviewDecision,
	type ApplicationRPConfigurationProductionReviewRead,
	type ApplicationRPConfigurationProductionReviewRequest,
} from "@/fetch/rp-applications";
import { applicationRPConfigurationsQueryKey } from "./use-application-rp-configurations";

export const applicationRPConfigurationProductionReviewQueryKey = (
	workspaceUuid: string,
	applicationInformationUuid: string,
	rpConfigurationUuid: string
): ReadonlyArray<string> =>
	[
		...applicationRPConfigurationsQueryKey(
			workspaceUuid,
			applicationInformationUuid
		),
		rpConfigurationUuid,
		"production-review",
	] as const;

export const useApplicationRPConfigurationProductionReview = (
	workspaceUuid: string,
	applicationInformationUuid: string,
	rpConfigurationUuid: string
): {
	error: Error | null;
	isLoading: boolean;
	productionReview: ApplicationRPConfigurationProductionReviewRead | null;
	refetch: () => Promise<unknown>;
} => {
	const query = useQuery<ApplicationRPConfigurationProductionReviewRead, Error>(
		{
			enabled: Boolean(
				workspaceUuid && applicationInformationUuid && rpConfigurationUuid
			),
			queryFn: () =>
				getApplicationRPConfigurationProductionReview(
					workspaceUuid,
					applicationInformationUuid,
					rpConfigurationUuid
				),
			queryKey: applicationRPConfigurationProductionReviewQueryKey(
				workspaceUuid,
				applicationInformationUuid,
				rpConfigurationUuid
			),
			retry: false,
		}
	);

	return {
		error: query.error ?? null,
		isLoading: query.isLoading,
		productionReview: query.data ?? null,
		refetch: () => query.refetch(),
	};
};

export const useApplicationRPConfigurationProductionReviewActions = (): {
	isRequesting: boolean;
	isReviewing: boolean;
	requestReview: (
		workspaceUuid: string,
		applicationInformationUuid: string,
		rpConfigurationUuid: string,
		payload: ApplicationRPConfigurationProductionReviewRequest
	) => Promise<ApplicationRPConfigurationProductionReviewRead>;
	review: (
		workspaceUuid: string,
		applicationInformationUuid: string,
		rpConfigurationUuid: string,
		payload: ApplicationRPConfigurationProductionReviewDecision
	) => Promise<ApplicationRPConfigurationProductionReviewRead>;
} => {
	const queryClient = useQueryClient();
	const invalidate = async (
		workspaceUuid: string,
		applicationInformationUuid: string,
		rpConfigurationUuid: string
	): Promise<void> => {
		await Promise.all([
			queryClient.invalidateQueries({
				exact: true,
				queryKey: applicationRPConfigurationProductionReviewQueryKey(
					workspaceUuid,
					applicationInformationUuid,
					rpConfigurationUuid
				),
			}),
			queryClient.invalidateQueries({
				exact: true,
				queryKey: applicationRPConfigurationsQueryKey(
					workspaceUuid,
					applicationInformationUuid
				),
			}),
		]);
	};
	const requestMutation = useMutation({
		mutationFn: ({
			applicationInformationUuid,
			payload,
			rpConfigurationUuid,
			workspaceUuid,
		}: {
			applicationInformationUuid: string;
			payload: ApplicationRPConfigurationProductionReviewRequest;
			rpConfigurationUuid: string;
			workspaceUuid: string;
		}) =>
			requestApplicationRPConfigurationProductionReview(
				workspaceUuid,
				applicationInformationUuid,
				rpConfigurationUuid,
				payload
			),
		onSuccess: async (_, variables) =>
			invalidate(
				variables.workspaceUuid,
				variables.applicationInformationUuid,
				variables.rpConfigurationUuid
			),
	});
	const reviewMutation = useMutation({
		mutationFn: ({
			applicationInformationUuid,
			payload,
			rpConfigurationUuid,
			workspaceUuid,
		}: {
			applicationInformationUuid: string;
			payload: ApplicationRPConfigurationProductionReviewDecision;
			rpConfigurationUuid: string;
			workspaceUuid: string;
		}) =>
			reviewApplicationRPConfigurationProductionRequest(
				workspaceUuid,
				applicationInformationUuid,
				rpConfigurationUuid,
				payload
			),
		onSuccess: async (_, variables) =>
			invalidate(
				variables.workspaceUuid,
				variables.applicationInformationUuid,
				variables.rpConfigurationUuid
			),
	});

	return {
		isRequesting: requestMutation.isPending,
		isReviewing: reviewMutation.isPending,
		requestReview: (
			workspaceUuid: string,
			applicationInformationUuid: string,
			rpConfigurationUuid: string,
			payload: ApplicationRPConfigurationProductionReviewRequest
		): Promise<ApplicationRPConfigurationProductionReviewRead> =>
			requestMutation.mutateAsync({
				applicationInformationUuid,
				payload,
				rpConfigurationUuid,
				workspaceUuid,
			}),
		review: (
			workspaceUuid: string,
			applicationInformationUuid: string,
			rpConfigurationUuid: string,
			payload: ApplicationRPConfigurationProductionReviewDecision
		): Promise<ApplicationRPConfigurationProductionReviewRead> =>
			reviewMutation.mutateAsync({
				applicationInformationUuid,
				payload,
				rpConfigurationUuid,
				workspaceUuid,
			}),
	};
};
