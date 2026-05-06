import { requestJson } from "@/fetch";
import type { ApiMessageResponse } from "./api-types";
import type { DepartmentRead } from "./departments";

export type UserDepartmentUpdate = {
	departmentAbbreviation: string | null;
};

export const getUserDepartment = async (
	userUuid: string
): Promise<DepartmentRead | null> =>
	requestJson<DepartmentRead>(`/api/v1/user/${userUuid}/department`, {
		method: "GET",
	});

export const updateUserDepartment = async (
	userUuid: string,
	payload: UserDepartmentUpdate
): Promise<ApiMessageResponse | null> =>
	requestJson<ApiMessageResponse>(`/api/v1/user/${userUuid}/department`, {
		body: JSON.stringify(payload),
		method: "PATCH",
	});

// Special API for the currently-authenticated user to set their own department
// This endpoint expects the department UUID as a query parameter: PATCH /api/v1/user/me/department?department_uuid=<uuid>
export const setMyDepartment = async (
	departmentUuid: string
): Promise<ApiMessageResponse | null> =>
	requestJson<ApiMessageResponse>(
		`/api/v1/user/me/department?department_uuid=${encodeURIComponent(departmentUuid)}`,
		{
			method: "PATCH",
		}
	);
