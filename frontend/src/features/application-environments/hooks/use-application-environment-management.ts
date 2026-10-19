import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createApplicationEnvironment,
	type ApplicationEnvironmentAuthenticationMethodUpdate,
	type ApplicationEnvironmentClientTypeUpdate,
	type ApplicationEnvironmentCreate,
	type ApplicationEnvironmentDecryptionUpdate,
	type ApplicationEnvironmentEncryptionUpdate,
	type ApplicationEnvironmentNameUpdate,
	type ApplicationEnvironmentPostLogoutRedirectUrisUpdate,
	type ApplicationEnvironmentRead,
	type ApplicationEnvironmentRedirectUrisUpdate,
	type ApplicationEnvironmentSectorIdentifierUpdate,
	type ApplicationEnvironmentSigningUpdate,
	type ApplicationEnvironmentSingleSignOutUpdate,
	type ApplicationEnvironmentUrlUpdate,
	type ApplicationEnvironmentVerificationUpdate,
	updateApplicationEnvironmentName,
	updateApplicationEnvironmentClientType,
	updateApplicationEnvironmentAuthenticationMethod,
	updateApplicationEnvironmentDecryption,
	updateApplicationEnvironmentEncryption,
	updateApplicationEnvironmentPostLogoutRedirectUris,
	updateApplicationEnvironmentRedirectUris,
	updateApplicationEnvironmentSectorIdentifier,
	updateApplicationEnvironmentSigning,
	updateApplicationEnvironmentSingleSignOut,
	updateApplicationEnvironmentUrl,
	updateApplicationEnvironmentVerification,
} from "@/fetch/application-environments";

type UpdateEnvironmentNameInput = ApplicationEnvironmentNameUpdate & {
	environmentUuid: string;
};

type UpdateEnvironmentUrlInput = ApplicationEnvironmentUrlUpdate & {
	environmentUuid: string;
};

type UpdateEnvironmentRedirectUrisInput =
	ApplicationEnvironmentRedirectUrisUpdate & {
		environmentUuid: string;
	};

type UpdateEnvironmentPostLogoutRedirectUrisInput =
	ApplicationEnvironmentPostLogoutRedirectUrisUpdate & {
		environmentUuid: string;
	};

type UpdateEnvironmentSingleSignOutInput =
	ApplicationEnvironmentSingleSignOutUpdate & {
		environmentUuid: string;
	};

type UpdateEnvironmentClientTypeInput =
	ApplicationEnvironmentClientTypeUpdate & {
		environmentUuid: string;
	};

type UpdateEnvironmentAuthenticationMethodInput =
	ApplicationEnvironmentAuthenticationMethodUpdate & {
		environmentUuid: string;
	};

type UpdateEnvironmentSectorIdentifierInput =
	ApplicationEnvironmentSectorIdentifierUpdate & {
		environmentUuid: string;
	};

type UpdateEnvironmentVerificationInput =
	ApplicationEnvironmentVerificationUpdate & {
		environmentUuid: string;
	};

type UpdateEnvironmentSigningInput = ApplicationEnvironmentSigningUpdate & {
	environmentUuid: string;
};

type UpdateEnvironmentEncryptionInput =
	ApplicationEnvironmentEncryptionUpdate & {
		environmentUuid: string;
	};

type UpdateEnvironmentDecryptionInput =
	ApplicationEnvironmentDecryptionUpdate & {
		environmentUuid: string;
	};

type ApplicationEnvironmentManagement = {
	createEnvironment: (
		payload: ApplicationEnvironmentCreate
	) => Promise<ApplicationEnvironmentRead | null>;
	error: Error | null;
	isCreating: boolean;
	isUpdatingPostLogoutRedirectUris: boolean;
	isUpdatingName: boolean;
	isUpdatingRedirectUris: boolean;
	isUpdatingSingleSignOut: boolean;
	isUpdatingClientType: boolean;
	isUpdatingAuthenticationMethod: boolean;
	isUpdatingSectorIdentifier: boolean;
	isUpdatingSigning: boolean;
	isUpdatingEncryption: boolean;
	isUpdatingDecryption: boolean;
	isUpdatingVerification: boolean;
	isUpdatingUrl: boolean;
	updateEnvironmentName: (
		input: UpdateEnvironmentNameInput
	) => Promise<ApplicationEnvironmentRead>;
	updateEnvironmentPostLogoutRedirectUris: (
		input: UpdateEnvironmentPostLogoutRedirectUrisInput
	) => Promise<ApplicationEnvironmentRead>;
	updateEnvironmentRedirectUris: (
		input: UpdateEnvironmentRedirectUrisInput
	) => Promise<ApplicationEnvironmentRead>;
	updateEnvironmentSingleSignOut: (
		input: UpdateEnvironmentSingleSignOutInput
	) => Promise<ApplicationEnvironmentRead>;
	updateEnvironmentClientType: (
		input: UpdateEnvironmentClientTypeInput
	) => Promise<ApplicationEnvironmentRead>;
	updateEnvironmentAuthenticationMethod: (
		input: UpdateEnvironmentAuthenticationMethodInput
	) => Promise<ApplicationEnvironmentRead>;
	updateEnvironmentSectorIdentifier: (
		input: UpdateEnvironmentSectorIdentifierInput
	) => Promise<ApplicationEnvironmentRead>;
	updateEnvironmentSigning: (
		input: UpdateEnvironmentSigningInput
	) => Promise<ApplicationEnvironmentRead>;
	updateEnvironmentEncryption: (
		input: UpdateEnvironmentEncryptionInput
	) => Promise<ApplicationEnvironmentRead>;
	updateEnvironmentDecryption: (
		input: UpdateEnvironmentDecryptionInput
	) => Promise<ApplicationEnvironmentRead>;
	updateEnvironmentVerification: (
		input: UpdateEnvironmentVerificationInput
	) => Promise<ApplicationEnvironmentRead>;
	updateEnvironmentUrl: (
		input: UpdateEnvironmentUrlInput
	) => Promise<ApplicationEnvironmentRead>;
	postLogoutRedirectUrisUpdateError: Error | null;
	redirectUrisUpdateError: Error | null;
	singleSignOutUpdateError: Error | null;
	clientTypeUpdateError: Error | null;
	authenticationMethodUpdateError: Error | null;
	sectorIdentifierUpdateError: Error | null;
	signingUpdateError: Error | null;
	encryptionUpdateError: Error | null;
	decryptionUpdateError: Error | null;
	verificationUpdateError: Error | null;
	updateError: Error | null;
	urlUpdateError: Error | null;
};

export const useApplicationEnvironmentManagement = (
	applicationUuid: string
): ApplicationEnvironmentManagement => {
	const queryClient = useQueryClient();
	const mutation = useMutation<
		ApplicationEnvironmentRead | null,
		Error,
		ApplicationEnvironmentCreate
	>({
		mutationFn: (payload) =>
			createApplicationEnvironment(applicationUuid, payload),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: ["application-environments", applicationUuid],
			});
		},
	});
	const updateNameMutation = useMutation<
		ApplicationEnvironmentRead,
		Error,
		UpdateEnvironmentNameInput
	>({
		mutationFn: ({ environmentName, environmentUuid }) =>
			updateApplicationEnvironmentName(applicationUuid, environmentUuid, {
				environmentName,
			}),
		onSuccess: async (_, { environmentUuid }) => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: ["application-environments", applicationUuid],
				}),
				queryClient.invalidateQueries({
					queryKey: [
						"application-environment",
						applicationUuid,
						environmentUuid,
					],
				}),
			]);
		},
	});
	const updateUrlMutation = useMutation<
		ApplicationEnvironmentRead,
		Error,
		UpdateEnvironmentUrlInput
	>({
		mutationFn: ({ environmentUuid, ...payload }) =>
			updateApplicationEnvironmentUrl(
				applicationUuid,
				environmentUuid,
				payload
			),
		onSuccess: async (_, { environmentUuid }) => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: ["application-environments", applicationUuid],
				}),
				queryClient.invalidateQueries({
					queryKey: [
						"application-environment",
						applicationUuid,
						environmentUuid,
					],
				}),
			]);
		},
	});
	const updateRedirectUrisMutation = useMutation<
		ApplicationEnvironmentRead,
		Error,
		UpdateEnvironmentRedirectUrisInput
	>({
		mutationFn: ({ environmentUuid, ...payload }) =>
			updateApplicationEnvironmentRedirectUris(
				applicationUuid,
				environmentUuid,
				payload
			),
		onSuccess: async (_, { environmentUuid }) => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: ["application-environments", applicationUuid],
				}),
				queryClient.invalidateQueries({
					queryKey: [
						"application-environment",
						applicationUuid,
						environmentUuid,
					],
				}),
			]);
		},
	});
	const updatePostLogoutRedirectUrisMutation = useMutation<
		ApplicationEnvironmentRead,
		Error,
		UpdateEnvironmentPostLogoutRedirectUrisInput
	>({
		mutationFn: ({ environmentUuid, ...payload }) =>
			updateApplicationEnvironmentPostLogoutRedirectUris(
				applicationUuid,
				environmentUuid,
				payload
			),
		onSuccess: async (_, { environmentUuid }) => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: ["application-environments", applicationUuid],
				}),
				queryClient.invalidateQueries({
					queryKey: [
						"application-environment",
						applicationUuid,
						environmentUuid,
					],
				}),
			]);
		},
	});
	const updateSingleSignOutMutation = useMutation<
		ApplicationEnvironmentRead,
		Error,
		UpdateEnvironmentSingleSignOutInput
	>({
		mutationFn: ({ environmentUuid, ...payload }) =>
			updateApplicationEnvironmentSingleSignOut(
				applicationUuid,
				environmentUuid,
				payload
			),
		onSuccess: async (_, { environmentUuid }) => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: ["application-environments", applicationUuid],
				}),
				queryClient.invalidateQueries({
					queryKey: [
						"application-environment",
						applicationUuid,
						environmentUuid,
					],
				}),
			]);
		},
	});
	const updateClientTypeMutation = useMutation<
		ApplicationEnvironmentRead,
		Error,
		UpdateEnvironmentClientTypeInput
	>({
		mutationFn: ({ environmentUuid, ...payload }) =>
			updateApplicationEnvironmentClientType(
				applicationUuid,
				environmentUuid,
				payload
			),
		onSuccess: async (_, { environmentUuid }) => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: ["application-environments", applicationUuid],
				}),
				queryClient.invalidateQueries({
					queryKey: [
						"application-environment",
						applicationUuid,
						environmentUuid,
					],
				}),
			]);
		},
	});
	const updateAuthenticationMethodMutation = useMutation<
		ApplicationEnvironmentRead,
		Error,
		UpdateEnvironmentAuthenticationMethodInput
	>({
		mutationFn: ({ environmentUuid, ...payload }) =>
			updateApplicationEnvironmentAuthenticationMethod(
				applicationUuid,
				environmentUuid,
				payload
			),
		onSuccess: async (_, { environmentUuid }) => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: ["application-environments", applicationUuid],
				}),
				queryClient.invalidateQueries({
					queryKey: [
						"application-environment",
						applicationUuid,
						environmentUuid,
					],
				}),
			]);
		},
	});
	const updateSectorIdentifierMutation = useMutation<
		ApplicationEnvironmentRead,
		Error,
		UpdateEnvironmentSectorIdentifierInput
	>({
		mutationFn: ({ environmentUuid, ...payload }) =>
			updateApplicationEnvironmentSectorIdentifier(
				applicationUuid,
				environmentUuid,
				payload
			),
		onSuccess: async (_, { environmentUuid }) => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: ["application-environments", applicationUuid],
				}),
				queryClient.invalidateQueries({
					queryKey: [
						"application-environment",
						applicationUuid,
						environmentUuid,
					],
				}),
			]);
		},
	});
	const updateVerificationMutation = useMutation<
		ApplicationEnvironmentRead,
		Error,
		UpdateEnvironmentVerificationInput
	>({
		mutationFn: ({ environmentUuid, ...payload }) =>
			updateApplicationEnvironmentVerification(
				applicationUuid,
				environmentUuid,
				payload
			),
		onSuccess: async (_, { environmentUuid }) => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: ["application-environments", applicationUuid],
				}),
				queryClient.invalidateQueries({
					queryKey: [
						"application-environment",
						applicationUuid,
						environmentUuid,
					],
				}),
			]);
		},
	});
	const updateSigningMutation = useMutation<
		ApplicationEnvironmentRead,
		Error,
		UpdateEnvironmentSigningInput
	>({
		mutationFn: ({ environmentUuid, ...payload }) =>
			updateApplicationEnvironmentSigning(
				applicationUuid,
				environmentUuid,
				payload
			),
		onSuccess: async (_, { environmentUuid }) => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: ["application-environments", applicationUuid],
				}),
				queryClient.invalidateQueries({
					queryKey: [
						"application-environment",
						applicationUuid,
						environmentUuid,
					],
				}),
			]);
		},
	});
	const updateEncryptionMutation = useMutation<
		ApplicationEnvironmentRead,
		Error,
		UpdateEnvironmentEncryptionInput
	>({
		mutationFn: ({ environmentUuid, ...payload }) =>
			updateApplicationEnvironmentEncryption(
				applicationUuid,
				environmentUuid,
				payload
			),
		onSuccess: async (_, { environmentUuid }) => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: ["application-environments", applicationUuid],
				}),
				queryClient.invalidateQueries({
					queryKey: [
						"application-environment",
						applicationUuid,
						environmentUuid,
					],
				}),
			]);
		},
	});
	const updateDecryptionMutation = useMutation<
		ApplicationEnvironmentRead,
		Error,
		UpdateEnvironmentDecryptionInput
	>({
		mutationFn: ({ environmentUuid, ...payload }) =>
			updateApplicationEnvironmentDecryption(
				applicationUuid,
				environmentUuid,
				payload
			),
		onSuccess: async (_, { environmentUuid }) => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: ["application-environments", applicationUuid],
				}),
				queryClient.invalidateQueries({
					queryKey: [
						"application-environment",
						applicationUuid,
						environmentUuid,
					],
				}),
			]);
		},
	});

	return {
		createEnvironment: mutation.mutateAsync,
		error: mutation.error,
		isCreating: mutation.isPending,
		isUpdatingPostLogoutRedirectUris:
			updatePostLogoutRedirectUrisMutation.isPending,
		isUpdatingName: updateNameMutation.isPending,
		isUpdatingRedirectUris: updateRedirectUrisMutation.isPending,
		isUpdatingSingleSignOut: updateSingleSignOutMutation.isPending,
		isUpdatingClientType: updateClientTypeMutation.isPending,
		isUpdatingAuthenticationMethod:
			updateAuthenticationMethodMutation.isPending,
		isUpdatingSectorIdentifier: updateSectorIdentifierMutation.isPending,
		isUpdatingSigning: updateSigningMutation.isPending,
		isUpdatingEncryption: updateEncryptionMutation.isPending,
		isUpdatingDecryption: updateDecryptionMutation.isPending,
		isUpdatingVerification: updateVerificationMutation.isPending,
		isUpdatingUrl: updateUrlMutation.isPending,
		updateEnvironmentName: updateNameMutation.mutateAsync,
		updateEnvironmentPostLogoutRedirectUris:
			updatePostLogoutRedirectUrisMutation.mutateAsync,
		updateEnvironmentRedirectUris: updateRedirectUrisMutation.mutateAsync,
		updateEnvironmentSingleSignOut: updateSingleSignOutMutation.mutateAsync,
		updateEnvironmentClientType: updateClientTypeMutation.mutateAsync,
		updateEnvironmentAuthenticationMethod:
			updateAuthenticationMethodMutation.mutateAsync,
		updateEnvironmentSectorIdentifier:
			updateSectorIdentifierMutation.mutateAsync,
		updateEnvironmentSigning: updateSigningMutation.mutateAsync,
		updateEnvironmentEncryption: updateEncryptionMutation.mutateAsync,
		updateEnvironmentDecryption: updateDecryptionMutation.mutateAsync,
		updateEnvironmentVerification: updateVerificationMutation.mutateAsync,
		updateEnvironmentUrl: updateUrlMutation.mutateAsync,
		postLogoutRedirectUrisUpdateError:
			updatePostLogoutRedirectUrisMutation.error,
		redirectUrisUpdateError: updateRedirectUrisMutation.error,
		singleSignOutUpdateError: updateSingleSignOutMutation.error,
		clientTypeUpdateError: updateClientTypeMutation.error,
		authenticationMethodUpdateError: updateAuthenticationMethodMutation.error,
		sectorIdentifierUpdateError: updateSectorIdentifierMutation.error,
		signingUpdateError: updateSigningMutation.error,
		encryptionUpdateError: updateEncryptionMutation.error,
		decryptionUpdateError: updateDecryptionMutation.error,
		verificationUpdateError: updateVerificationMutation.error,
		updateError: updateNameMutation.error,
		urlUpdateError: updateUrlMutation.error,
	};
};
