import { requestJson } from "@/fetch";

export type ApplicationEnvironmentApplicationRead = {
	nameEn: string;
	nameFr: string | null;
	uuid: string;
};

export type ApplicationEnvironmentRead = {
	createdAt: string;
	partnerLabel: string;
	statusCode: string;
	tenantCode: string;
	updatedAt: string | null;
	uuid: string;
};

export type ApplicationEnvironmentListRead = {
	application: ApplicationEnvironmentApplicationRead;
	data: Array<ApplicationEnvironmentRead>;
	hasMore: boolean;
	itemsPerPage: number;
	page: number;
	totalCount: number;
};

type ApplicationEnvironmentListOptions = {
	itemsPerPage: number;
	page: number;
};

export const getApplicationEnvironments = async (
	applicationUuid: string,
	{ itemsPerPage, page }: ApplicationEnvironmentListOptions
): Promise<ApplicationEnvironmentListRead> => {
	const searchParameters = new URLSearchParams();
	searchParameters.set("items_per_page", String(itemsPerPage));
	searchParameters.set("page", String(page));
	const result = await requestJson<ApplicationEnvironmentListRead | null>(
		`/api/v1/applications/${encodeURIComponent(applicationUuid)}/environments?${searchParameters.toString()}`,
		{
			cache: "no-store",
			method: "GET",
		}
	);
	if (!result) {
		throw new Error("Failed to load application environments");
	}
	return result;
};