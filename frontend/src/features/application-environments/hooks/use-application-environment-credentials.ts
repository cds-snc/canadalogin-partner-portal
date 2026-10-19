import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	deleteApplicationEnvironmentRotatedClientSecret,
	getApplicationEnvironmentClientCredentials,
	getApplicationEnvironmentClientSecretPermissions,
	getApplicationEnvironmentRotatedClientSecrets,
	rotateApplicationEnvironmentClientSecret,
	type ApplicationEnvironmentClientCredentialsRead,
	type ApplicationEnvironmentClientSecretPermissionsRead,
	type ApplicationEnvironmentClientSecretRotateRequest,
	type ApplicationEnvironmentRotatedClientSecretRead,
} from "@/fetch/application-environment-client-secrets";

type ApplicationEnvironmentCredentials = {
	credentials: ApplicationEnvironmentClientCredentialsRead | null;
	deleteRotatedSecret: (value: string) => Promise<{ message: string }>;
	getClientCredentials: () => Promise<ApplicationEnvironmentClientCredentialsRead>;
	isDeletingRotatedSecret: boolean;
	isLoadingClientCredentials: boolean;
	isLoadingPermissions: boolean;
	isLoadingRotatedSecrets: boolean;
	isRotatingSecret: boolean;
	permissions: ApplicationEnvironmentClientSecretPermissionsRead | null;
	permissionsError: Error | null;
	rotatedSecrets: Array<ApplicationEnvironmentRotatedClientSecretRead>;
	rotateSecret: (
		payload: ApplicationEnvironmentClientSecretRotateRequest
	) => Promise<ApplicationEnvironmentClientCredentialsRead>;
};

const NON_PRODUCTION_PERMISSIONS: ApplicationEnvironmentClientSecretPermissionsRead = {
	canRevealSecret: true,
	canViewRotatedSecrets: true,
	canRotateSecret: true,
	canExpireRotatedSecrets: true,
};

export const useApplicationEnvironmentCredentials = (
	applicationUuid: string,
	environmentUuid: string,
	enabled: boolean,
	isProduction = false
): ApplicationEnvironmentCredentials => {
	const queryClient = useQueryClient();
	const permissionsQuery = useQuery({
		enabled:
			enabled &&
			isProduction &&
			applicationUuid.trim().length > 0 &&
			environmentUuid.trim().length > 0,
		queryFn: () =>
			getApplicationEnvironmentClientSecretPermissions(
				applicationUuid,
				environmentUuid
			),
		queryKey: [
			"application-environment-client-secret-permissions",
			applicationUuid,
			environmentUuid,
		],
	});
	const queryKey = [
		"application-environment-rotated-client-secrets",
		applicationUuid,
		environmentUuid,
	];
	const rotatedSecretsQuery = useQuery({
		enabled:
			enabled &&
			(!isProduction ||
				permissionsQuery.data?.canViewRotatedSecrets === true) &&
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
		isLoadingPermissions: isProduction && permissionsQuery.isPending,
		isLoadingRotatedSecrets: isProduction
			? permissionsQuery.isPending ||
				(permissionsQuery.data?.canViewRotatedSecrets === true &&
					rotatedSecretsQuery.isPending)
			: rotatedSecretsQuery.isPending,
		isRotatingSecret: rotateMutation.isPending,
		permissions: isProduction
			? (permissionsQuery.data ?? null)
			: NON_PRODUCTION_PERMISSIONS,
		permissionsError: isProduction ? permissionsQuery.error : null,
		rotatedSecrets: rotatedSecretsQuery.data ?? [],
		rotateSecret: (payload) => rotateMutation.mutateAsync(payload),
	};
};
