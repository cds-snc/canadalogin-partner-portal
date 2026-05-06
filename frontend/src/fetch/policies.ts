import { requestJson } from "@/fetch";
import type { ApiMessageResponse } from "./api-types";

export type PolicyRead = {
	action: string;
	resource: string;
	subject: string;
	uuid: string;
};

export type PolicyCreate = {
	action: string;
	resource: string;
	subject: string;
};

export type PolicyUpdate = {
	action?: string | null;
	resource?: string | null;
	subject?: string | null;
};

export type PoliciesListResponse = {
	data: Array<PolicyRead>;
	has_more: boolean;
	items_per_page: number;
	page: number;
	total_count: number;
};

export const getPolicies = async (
	page = 1,
	itemsPerPage = 10
): Promise<PoliciesListResponse> => {
	const searchParameters = new URLSearchParams();
	searchParameters.set("items_per_page", String(itemsPerPage));
	searchParameters.set("page", String(page));

	return (await requestJson<PoliciesListResponse>(
		`/api/v1/policies?${searchParameters.toString()}`,
		{
			cache: "no-store",
			method: "GET",
		}
	)) as PoliciesListResponse;
};

export const createPolicy = async (
	payload: PolicyCreate
): Promise<PolicyRead | null> =>
	requestJson<PolicyRead>("/api/v1/policy", {
		body: JSON.stringify(payload),
		method: "POST",
	});

export const updatePolicy = async (
	policyUuid: string,
	payload: PolicyUpdate
): Promise<ApiMessageResponse | null> =>
	requestJson<ApiMessageResponse>(`/api/v1/policy/${policyUuid}`, {
		body: JSON.stringify(payload),
		method: "PATCH",
	});

export const deletePolicy = async (
	policyUuid: string
): Promise<ApiMessageResponse | null> =>
	requestJson<ApiMessageResponse>(`/api/v1/policy/${policyUuid}`, {
		method: "DELETE",
	});
