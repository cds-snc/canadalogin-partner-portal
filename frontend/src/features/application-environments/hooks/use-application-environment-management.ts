import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createApplicationEnvironment,
	type ApplicationEnvironmentCreate,
	type ApplicationEnvironmentRead,
} from "@/fetch/application-environments";

type ApplicationEnvironmentManagement = {
	createEnvironment: (
		payload: ApplicationEnvironmentCreate
	) => Promise<ApplicationEnvironmentRead | null>;
	error: Error | null;
	isCreating: boolean;
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

	return {
		createEnvironment: mutation.mutateAsync,
		error: mutation.error,
		isCreating: mutation.isPending,
	};
};
