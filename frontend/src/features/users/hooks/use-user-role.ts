import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	addRoleToUser,
	getUserRoles,
	removeRoleFromUser,
} from "@/fetch/user-roles";

export const userRoleQueryKey = (userUuid: string | null | undefined) =>
	["user-role", userUuid ?? "anonymous"] as const;

export type UserRoleState = {
	addRole: (userUuid: string, roleUuid: string) => Promise<void>;
	error: Error | null;
	isAdding: boolean;
	isLoading: boolean;
	isRemoving: boolean;
	removeRole: (userUuid: string, roleUuid: string) => Promise<void>;
	roles: Awaited<ReturnType<typeof getUserRoles>>;
};

export const useUserRole = (
	userUuid: string | null | undefined
): UserRoleState => {
	const queryClient = useQueryClient();
	const query = useQuery({
		enabled: Boolean(userUuid),
		queryFn: () => getUserRoles(userUuid ?? ""),
		queryKey: userRoleQueryKey(userUuid),
	});

	const addMutation = useMutation({
		mutationFn: ({
			roleUuid,
			userUuid: nextUserUuid,
		}: {
			roleUuid: string;
			userUuid: string;
		}) => addRoleToUser(nextUserUuid, roleUuid),
		onSuccess: async (_data, { userUuid: mutatedUserUuid }) => {
			await queryClient.invalidateQueries({ queryKey: ["users"] });
			await queryClient.invalidateQueries({
				queryKey: userRoleQueryKey(mutatedUserUuid),
			});
		},
	});

	const removeMutation = useMutation({
		mutationFn: ({
			roleUuid,
			userUuid: nextUserUuid,
		}: {
			roleUuid: string;
			userUuid: string;
		}) => removeRoleFromUser(nextUserUuid, roleUuid),
		onSuccess: async (_data, { userUuid: mutatedUserUuid }) => {
			await queryClient.invalidateQueries({ queryKey: ["users"] });
			await queryClient.invalidateQueries({
				queryKey: userRoleQueryKey(mutatedUserUuid),
			});
		},
	});

	return {
		addRole: async (nextUserUuid: string, roleUuid: string): Promise<void> => {
			await addMutation.mutateAsync({ roleUuid, userUuid: nextUserUuid });
		},
		error: query.error ?? null,
		isAdding: addMutation.isPending,
		isLoading: query.isLoading,
		isRemoving: removeMutation.isPending,
		removeRole: async (
			nextUserUuid: string,
			roleUuid: string
		): Promise<void> => {
			await removeMutation.mutateAsync({ roleUuid, userUuid: nextUserUuid });
		},
		roles: query.data ?? [],
	};
};
