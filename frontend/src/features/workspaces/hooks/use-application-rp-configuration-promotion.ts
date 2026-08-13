import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	getApplicationRPConfigurationPromotionRequest,
	requestApplicationRPConfigurationProductionReview,
	reviewApplicationRPConfigurationProductionRequest,
	type ApplicationRPConfigurationPromotionRequestRead,
	type ApplicationRPConfigurationPromotionRequestUpsert,
	type ApplicationRPConfigurationPromotionReviewUpdate,
} from "@/fetch/rp-applications";
import { applicationRPConfigurationsQueryKey } from "./use-application-rp-configurations";

export const applicationRPConfigurationPromotionQueryKey = (
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
		"promotion-request",
	] as const;

export const useApplicationRPConfigurationPromotion = (
	workspaceUuid: string,
	applicationInformationUuid: string,
	rpConfigurationUuid: string
): {
	error: Error | null;
	isLoading: boolean;
	promotion: ApplicationRPConfigurationPromotionRequestRead | null;
	refetch: () => Promise<unknown>;
} => {
	const query = useQuery<ApplicationRPConfigurationPromotionRequestRead, Error>(
		{
			enabled: Boolean(
				workspaceUuid && applicationInformationUuid && rpConfigurationUuid
			),
			queryFn: () =>
				getApplicationRPConfigurationPromotionRequest(
					workspaceUuid,
					applicationInformationUuid,
					rpConfigurationUuid
				),
			queryKey: applicationRPConfigurationPromotionQueryKey(
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
		promotion: query.data ?? null,
		refetch: () => query.refetch(),
	};
};

export const useApplicationRPConfigurationPromotionActions = (): {
	isRequesting: boolean;
	isReviewing: boolean;
	requestReview: (
		workspaceUuid: string,
		applicationInformationUuid: string,
		rpConfigurationUuid: string,
		payload: ApplicationRPConfigurationPromotionRequestUpsert
	) => Promise<ApplicationRPConfigurationPromotionRequestRead>;
	review: (
		workspaceUuid: string,
		applicationInformationUuid: string,
		rpConfigurationUuid: string,
		payload: ApplicationRPConfigurationPromotionReviewUpdate
	) => Promise<ApplicationRPConfigurationPromotionRequestRead>;
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
				queryKey: applicationRPConfigurationPromotionQueryKey(
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
			payload: ApplicationRPConfigurationPromotionRequestUpsert;
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
			payload: ApplicationRPConfigurationPromotionReviewUpdate;
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
			payload: ApplicationRPConfigurationPromotionRequestUpsert
		): Promise<ApplicationRPConfigurationPromotionRequestRead> =>
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
			payload: ApplicationRPConfigurationPromotionReviewUpdate
		): Promise<ApplicationRPConfigurationPromotionRequestRead> =>
			reviewMutation.mutateAsync({
				applicationInformationUuid,
				payload,
				rpConfigurationUuid,
				workspaceUuid,
			}),
	};
};
