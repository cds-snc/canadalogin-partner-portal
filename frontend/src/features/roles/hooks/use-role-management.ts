import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createRole as postRole,
	deleteRole as removeRole,
	updateRole as patchRole,
	type RoleCreate,
	type RoleUpdate,
} from "@/fetch/roles";
import { refreshActiveListQuery } from "@/lib/refresh-active-list-query";
import { rolesQueryKey, useRoles, type RolesState } from "./use-roles";

export type RoleManagementState = RolesState & {
	createRole: (payload: RoleCreate) => Promise<void>;
	deleteRole: (roleUuid: string) => Promise<void>;
	isCreating: boolean;
	isDeleting: boolean;
	isUpdating: boolean;
	updateRole: (roleUuid: string, payload: RoleUpdate) => Promise<void>;
};

export const useRoleManagement = (
	page = 1,
	itemsPerPage = 10
): RoleManagementState => {
	const queryClient = useQueryClient();
	const query = useRoles(page, itemsPerPage);

	const refreshRoles = async (): Promise<void> => {
		await refreshActiveListQuery(queryClient, {
			exactQueryKey: rolesQueryKey(page, itemsPerPage),
			invalidationKeys: [["user-role"]],
			refetchActiveQuery: query.refetch,
		});
	};

	const createMutation = useMutation({
		mutationFn: postRole,
		onSuccess: refreshRoles,
	});

	const updateMutation = useMutation({
		mutationFn: ({
			payload,
			roleUuid,
		}: {
			payload: RoleUpdate;
			roleUuid: string;
		}) => patchRole(roleUuid, payload),
		onSuccess: refreshRoles,
	});

	const deleteMutation = useMutation({
		mutationFn: removeRole,
		onSuccess: refreshRoles,
	});

	return {
		...query,
		createRole: async (payload: RoleCreate): Promise<void> => {
			await createMutation.mutateAsync(payload);
		},
		deleteRole: async (roleUuid: string): Promise<void> => {
			await deleteMutation.mutateAsync(roleUuid);
		},
		isCreating: createMutation.isPending,
		isDeleting: deleteMutation.isPending,
		isUpdating: updateMutation.isPending,
		updateRole: async (
			roleUuid: string,
			payload: RoleUpdate
		): Promise<void> => {
			await updateMutation.mutateAsync({ payload, roleUuid });
		},
	};
};
