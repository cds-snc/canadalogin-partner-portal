import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	getUserDepartment,
	updateUserDepartment as patchUserDepartment,
	type UserDepartmentUpdate,
} from "@/fetch/user-departments";

export const userDepartmentQueryKey = (userUuid: string | null | undefined) =>
	["user-department", userUuid ?? "anonymous"] as const;

export type UserDepartmentState = {
	department: Awaited<ReturnType<typeof getUserDepartment>>;
	error: Error | null;
	isLoading: boolean;
	isUpdating: boolean;
	updateUserDepartment: (
		userUuid: string,
		payload: UserDepartmentUpdate
	) => Promise<void>;
};

export const useUserDepartment = (
	userUuid: string | null | undefined
): UserDepartmentState => {
	const queryClient = useQueryClient();
	const query = useQuery({
		enabled: Boolean(userUuid),
		queryFn: () => getUserDepartment(userUuid ?? ""),
		queryKey: userDepartmentQueryKey(userUuid),
	});

	const mutation = useMutation({
		mutationFn: ({
			payload,
			userUuid: nextUserUuid,
		}: {
			payload: UserDepartmentUpdate;
			userUuid: string;
		}) => patchUserDepartment(nextUserUuid, payload),
		onSuccess: async (_response, variables) => {
			// Invalidate per-user department entry
			await queryClient.invalidateQueries({
				queryKey: userDepartmentQueryKey(variables.userUuid),
			});
			// Invalidate all users queries (all pages) so lists refetch and reflect the updated department
			// Invalidate all users queries (all pages) so lists refetch and reflect the updated department
			await queryClient.invalidateQueries({
				predicate: (q) =>
					Array.isArray(q.queryKey) && q.queryKey[0] === "users",
				refetchType: "active",
			});
		},
	});
	return {
		department: query.data ?? null,
		error: query.error ?? null,
		isLoading: query.isLoading,
		isUpdating: mutation.isPending,
		updateUserDepartment: async (
			nextUserUuid: string,
			payload: UserDepartmentUpdate
		): Promise<void> => {
			await mutation.mutateAsync({ payload, userUuid: nextUserUuid });
		},
	};
};
