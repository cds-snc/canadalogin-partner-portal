import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createDepartment as postDepartment,
	deleteDepartment as removeDepartment,
	updateDepartment as patchDepartment,
	type DepartmentCreate,
	type DepartmentUpdate,
} from "@/fetch/departments";
import { refreshActiveListQuery } from "@/lib/refresh-active-list-query";
import {
	departmentsQueryKey,
	useDepartments,
	type DepartmentsState,
} from "./use-departments";

export type DepartmentManagementState = DepartmentsState & {
	createDepartment: (payload: DepartmentCreate) => Promise<void>;
	deleteDepartment: (departmentUuid: string) => Promise<void>;
	isCreating: boolean;
	isDeleting: boolean;
	isUpdating: boolean;
	updateDepartment: (
		departmentUuid: string,
		payload: DepartmentUpdate
	) => Promise<void>;
};

export const useDepartmentManagement = (
	page = 1,
	itemsPerPage = 10
): DepartmentManagementState => {
	const queryClient = useQueryClient();
	const query = useDepartments(page, itemsPerPage);

	const refreshDepartments = async (): Promise<void> => {
		await refreshActiveListQuery(queryClient, {
			exactQueryKey: departmentsQueryKey(page, itemsPerPage),
			invalidationKeys: [["user-department"]],
			refetchActiveQuery: query.refetch,
		});
	};

	const createMutation = useMutation({
		mutationFn: postDepartment,
		onSuccess: refreshDepartments,
	});

	const updateMutation = useMutation({
		mutationFn: ({
			departmentUuid,
			payload,
		}: {
			departmentUuid: string;
			payload: DepartmentUpdate;
		}) => patchDepartment(departmentUuid, payload),
		onSuccess: refreshDepartments,
	});

	const deleteMutation = useMutation({
		mutationFn: removeDepartment,
		onSuccess: refreshDepartments,
	});

	return {
		...query,
		createDepartment: async (payload: DepartmentCreate): Promise<void> => {
			await createMutation.mutateAsync(payload);
		},
		deleteDepartment: async (departmentUuid: string): Promise<void> => {
			await deleteMutation.mutateAsync(departmentUuid);
		},
		isCreating: createMutation.isPending,
		isDeleting: deleteMutation.isPending,
		isUpdating: updateMutation.isPending,
		updateDepartment: async (
			departmentUuid: string,
			payload: DepartmentUpdate
		): Promise<void> => {
			await updateMutation.mutateAsync({ departmentUuid, payload });
		},
	};
};
