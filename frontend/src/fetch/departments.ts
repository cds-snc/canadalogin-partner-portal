import { requestJson } from "@/fetch";
import type { ApiMessageResponse } from "./api-types";

export type DepartmentCreate = {
	abbreviation?: string | null;
	abbreviationFr?: string | null;
	gcOrgId?: number | null;
	leadDepartmentName?: string | null;
	leadDepartmentNameFr?: string | null;
	name: string;
	nameFr?: string | null;
};

export type DepartmentUpdate = {
	abbreviation?: string | null;
	abbreviationFr?: string | null;
	gcOrgId?: number | null;
	leadDepartmentName?: string | null;
	leadDepartmentNameFr?: string | null;
	name?: string;
	nameFr?: string | null;
};

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

export const createDepartment = async (
	payload: DepartmentCreate
): Promise<DepartmentRead | null> =>
	requestJson<DepartmentRead>("/api/v1/department", {
		body: JSON.stringify(payload),
		method: "POST",
	});

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

export const updateDepartment = async (
	departmentUuid: string,
	payload: DepartmentUpdate
): Promise<ApiMessageResponse | null> =>
	requestJson<ApiMessageResponse>(
		`/api/v1/department/${encodeURIComponent(departmentUuid)}`,
		{
			body: JSON.stringify(payload),
			method: "PATCH",
		}
	);

export const deleteDepartment = async (
	departmentUuid: string
): Promise<ApiMessageResponse | null> =>
	requestJson<ApiMessageResponse>(
		`/api/v1/department/${encodeURIComponent(departmentUuid)}`,
		{
			method: "DELETE",
		}
	);

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
