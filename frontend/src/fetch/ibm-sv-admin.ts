import { requestJson } from "@/fetch/request-json";

export type ISVUser = {
	id: string;
	userName?: string;
	name?: {
		formatted?: string;
		givenName?: string;
		familyName?: string;
	};
	emails?: Array<{
		value: string;
		type?: string;
		primary?: boolean;
	}>;
	displayName?: string;
};

export const searchISVUsers = async (
	username: string
): Promise<Array<ISVUser>> => {
	const result = await requestJson<Array<ISVUser> | null>(
		`/api/v1/ibm-sv-admin/users/search?username=${encodeURIComponent(username)}`,
		{
			method: "GET",
		}
	);
	return result ?? [];
};

export const listISVUsers = async (): Promise<Array<ISVUser>> => {
	const result = await requestJson<Array<ISVUser> | null>(
		"/api/v1/ibm-sv-admin/users",
		{
			method: "GET",
		}
	);
	return result ?? [];
};
