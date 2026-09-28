import { requestJson } from "@/fetch";

export type CurrentUserApplicationRead = {
	environmentCount: number;
	nameEn: string;
	nameFr: string | null;
	uuid: string;
};

export type CurrentUserApplicationListRead = {
	data: Array<CurrentUserApplicationRead>;
	hasMore: boolean;
	itemsPerPage: number;
	page: number;
	totalCount: number;
};

type CurrentUserApplicationListOptions = {
	itemsPerPage: number;
	page: number;
};

export const getCurrentUserApplications = async ({
	itemsPerPage,
	page,
}: CurrentUserApplicationListOptions): Promise<CurrentUserApplicationListRead> => {
	const searchParameters = new URLSearchParams();
	searchParameters.set("items_per_page", String(itemsPerPage));
	searchParameters.set("page", String(page));
	const result = await requestJson<CurrentUserApplicationListRead | null>(
		`/api/v1/applications/mine?${searchParameters.toString()}`,
		{
			cache: "no-store",
			method: "GET",
		}
	);
	if (!result) {
		throw new Error("Failed to load applications");
	}
	return result;
};