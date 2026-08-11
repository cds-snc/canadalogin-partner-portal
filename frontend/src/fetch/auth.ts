import { buildApiUrl, getApiBaseUrl } from "./base-url";
import { UnauthorizedRequestError } from "./errors";
import { requestJson } from "./request-json";

export type UserRead = {
	acceptedTermsAt?: string | null;
	termsVersion?: string | null;
	authProvider: string | null;
	authSubject: string | null;
	departmentAbbreviation?: string | null;
	departmentUuid?: string | null;
	email: string;
	hasPartnerAccessGrant?: boolean;
	isSuperuser?: boolean;
	name: string;
	profileImageUrl: string | null;
	roleUuids: Array<string> | null;
	tierUuid: string | null;
	uuid: string;
};

export const getCurrentUser = async (): Promise<UserRead | null> => {
	try {
		return await requestJson<UserRead>(
			"/api/v1/user/me/",
			{
				cache: "no-store",
				method: "GET",
			},
			{ redirectOnUnauthorized: false }
		);
	} catch (error: unknown) {
		if (error instanceof UnauthorizedRequestError) {
			return null;
		}

		throw error;
	}
};

export const getOidcLoginUrl = (
	language?: string,
	redirect?: string
): string => {
	const url = buildApiUrl("/api/v1/auth/oidc/login");
	const searchParameters = new URLSearchParams();
	if (language === "en" || language === "fr") {
		searchParameters.set("ui_locales", language);
	}
	if (typeof redirect === "string" && redirect.startsWith("/")) {
		searchParameters.set("redirect", redirect);
	}
	const query = searchParameters.toString();
	return query.length > 0 ? `${url}?${query}` : url;
};

export const getBackendOrigin = (): string => getApiBaseUrl();
