import { requestJson } from "@/fetch";

export type DepartmentRead = {
	abbreviation: string | null;
	abbreviationFr: string | null;
	name: string;
	gcOrgId: number | null;
	leadDepartmentName: string | null;
	leadDepartmentNameFr: string | null;
	nameFr: string | null;
	createdAt: string;
	uuid: string;
};

export type DepartmentsListResponse = {
	data: Array<DepartmentRead>;
	has_more: boolean;
	items_per_page: number;
	page: number;
	total_count: number;
};

export const getDepartments = async (
	page = 1,
	itemsPerPage = 10
): Promise<DepartmentsListResponse> => {
	const searchParameters = new URLSearchParams();
	searchParameters.set("items_per_page", String(itemsPerPage));
	searchParameters.set("page", String(page));

	return (await requestJson<DepartmentsListResponse>(
		`/api/v1/departments?${searchParameters.toString()}`,
		{
			cache: "no-store",
			method: "GET",
		}
	)) as DepartmentsListResponse;
};

export const getDepartment = async (
	departmentUuid: string
): Promise<DepartmentRead | null> =>
	requestJson<DepartmentRead>(
		`/api/v1/department/${encodeURIComponent(departmentUuid)}`,
		{
			cache: "no-store",
			method: "GET",
		}
	);

export const getDepartmentById = async (
	departmentId: number
): Promise<DepartmentRead | null> =>
	requestJson<DepartmentRead>(`/api/v1/departments/by-id/${departmentId}`, {
		cache: "no-store",
		method: "GET",
	});
