import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	deleteApplicationEnvironmentRotatedClientSecret,
	getApplicationEnvironmentClientCredentials,
	getApplicationEnvironmentRotatedClientSecrets,
	rotateApplicationEnvironmentClientSecret,
	type ApplicationEnvironmentClientCredentialsRead,
	type ApplicationEnvironmentClientSecretRotateRequest,
	type ApplicationEnvironmentRotatedClientSecretRead,
} from "@/fetch/application-environment-client-secrets";

type ApplicationEnvironmentCredentials = {
	credentials: ApplicationEnvironmentClientCredentialsRead | null;
	deleteRotatedSecret: (value: string) => Promise<{ message: string }>;
	getClientCredentials: () => Promise<ApplicationEnvironmentClientCredentialsRead>;
	isDeletingRotatedSecret: boolean;
	isLoadingClientCredentials: boolean;
	isLoadingRotatedSecrets: boolean;
	isRotatingSecret: boolean;
	rotatedSecrets: Array<ApplicationEnvironmentRotatedClientSecretRead>;
	rotateSecret: (
		payload: ApplicationEnvironmentClientSecretRotateRequest
	) => Promise<ApplicationEnvironmentClientCredentialsRead>;
};

export const useApplicationEnvironmentCredentials = (
	applicationUuid: string,
	environmentUuid: string,
	enabled: boolean
): ApplicationEnvironmentCredentials => {
	const queryClient = useQueryClient();
	const queryKey = [
		"application-environment-rotated-client-secrets",
		applicationUuid,
		environmentUuid,
	];
	const rotatedSecretsQuery = useQuery({
		enabled:
			enabled &&
			applicationUuid.trim().length > 0 &&
			environmentUuid.trim().length > 0,
		queryFn: () =>
			getApplicationEnvironmentRotatedClientSecrets(
				applicationUuid,
				environmentUuid
			),
		queryKey,
	});
	const credentialsMutation = useMutation({
		mutationFn: () =>
			getApplicationEnvironmentClientCredentials(
				applicationUuid,
				environmentUuid
			),
	});
	const rotateMutation = useMutation({
		mutationFn: (payload: ApplicationEnvironmentClientSecretRotateRequest) =>
			rotateApplicationEnvironmentClientSecret(
				applicationUuid,
				environmentUuid,
				payload
			),
		onSuccess: async () => {
			credentialsMutation.reset();
			await queryClient.invalidateQueries({ queryKey });
		},
	});
	const deleteMutation = useMutation({
		mutationFn: (value: string) =>
			deleteApplicationEnvironmentRotatedClientSecret(
				applicationUuid,
				environmentUuid,
				value
			),
		onSuccess: async () => queryClient.invalidateQueries({ queryKey }),
	});

	return {
		credentials: credentialsMutation.data ?? null,
		deleteRotatedSecret: (value) => deleteMutation.mutateAsync(value),
		getClientCredentials: () => credentialsMutation.mutateAsync(),
		isDeletingRotatedSecret: deleteMutation.isPending,
		isLoadingClientCredentials: credentialsMutation.isPending,
		isLoadingRotatedSecrets: rotatedSecretsQuery.isPending,
		isRotatingSecret: rotateMutation.isPending,
		rotatedSecrets: rotatedSecretsQuery.data ?? [],
		rotateSecret: (payload) => rotateMutation.mutateAsync(payload),
	};
};
