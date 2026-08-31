import { requestJson } from "@/fetch";
import type { ApiMessageResponse } from "./api-types";

export type TierCreate = {
	name: string;
};

export type TierUpdate = {
	name?: string;
};

export type TierRead = {
	name: string;
	created_at: string;
	uuid: string;
};

export type TiersListResponse = {
	data: Array<TierRead>;
	has_more: boolean;
	items_per_page: number;
	page: number;
	total_count: number;
};

export const createTier = async (
	payload: TierCreate
): Promise<TierRead | null> =>
	requestJson<TierRead>("/api/v1/tier", {
		body: JSON.stringify(payload),
		method: "POST",
	});

export const getTiers = async (
	page = 1,
	itemsPerPage = 10
): Promise<TiersListResponse> => {
	const searchParameters = new URLSearchParams();
	searchParameters.set("items_per_page", String(itemsPerPage));
	searchParameters.set("page", String(page));

	return (await requestJson<TiersListResponse>(
		`/api/v1/tiers?${searchParameters.toString()}`,
		{
			cache: "no-store",
			method: "GET",
		}
	)) as TiersListResponse;
};

export const updateTier = async (
	tierUuid: string,
	payload: TierUpdate
): Promise<ApiMessageResponse | null> =>
	requestJson<ApiMessageResponse>(
		`/api/v1/tier/${encodeURIComponent(tierUuid)}`,
		{
			body: JSON.stringify(payload),
			method: "PATCH",
		}
	);

export const deleteTier = async (
	tierUuid: string
): Promise<ApiMessageResponse | null> =>
	requestJson<ApiMessageResponse>(
		`/api/v1/tier/${encodeURIComponent(tierUuid)}`,
		{
			method: "DELETE",
		}
	);
