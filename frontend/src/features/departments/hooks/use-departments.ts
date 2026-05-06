import { useQuery } from "@tanstack/react-query";
import {
	getDepartments,
	type DepartmentsListResponse,
} from "@/fetch/departments";

export const departmentsQueryKey = (page: number, itemsPerPage: number) =>
	["departments", page, itemsPerPage] as const;

export type DepartmentsState = {
	departments: DepartmentsListResponse["data"];
	error: Error | null;
	isLoading: boolean;
	itemsPerPage: number;
	page: number;
	refetch: () => Promise<unknown>;
	response: DepartmentsListResponse | null;
};

export const useDepartments = (
	page = 1,
	itemsPerPage = 10
): DepartmentsState => {
	const query = useQuery<DepartmentsListResponse, Error>({
		queryFn: () => getDepartments(page, itemsPerPage),
		queryKey: departmentsQueryKey(page, itemsPerPage),
	});

	return {
		departments: query.data?.data ?? [],
		error: query.error ?? null,
		isLoading: query.isLoading,
		itemsPerPage,
		page,
		refetch: () => query.refetch(),
		response: query.data ?? null,
	};
};
