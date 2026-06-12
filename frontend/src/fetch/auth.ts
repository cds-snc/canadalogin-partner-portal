import { buildApiUrl, getApiBaseUrl } from "./base-url";
import { UnauthorizedRequestError } from "./errors";
import { requestJson } from "./request-json";

export type OidcLogoutResponse = {
	endSessionEndpoint: string;
	idTokenHint?: string | null;
	postLogoutRedirectUri?: string | null;
};

export type LogoutResponse = {
	message: string;
	oidcLogout?: OidcLogoutResponse | null;
};

export type UserRead = {
	acceptedTermsAt?: string | null;
	termsVersion?: string | null;
	authProvider: string | null;
	authSubject: string | null;
	departmentAbbreviation?: string | null;
	departmentUuid?: string | null;
	email: string;
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

export const buildOidcLogoutUrl = (oidcLogout: OidcLogoutResponse): string => {
	const logoutUrl = new URL(oidcLogout.endSessionEndpoint);

	if (oidcLogout.idTokenHint) {
		logoutUrl.searchParams.set("id_token_hint", oidcLogout.idTokenHint);
	}

	if (oidcLogout.postLogoutRedirectUri) {
		logoutUrl.searchParams.set(
			"post_logout_redirect_uri",
			oidcLogout.postLogoutRedirectUri
		);
	}

	return logoutUrl.toString();
};

export const logoutCurrentUser = async (): Promise<LogoutResponse | null> => {
	const response = await requestJson<LogoutResponse>("/api/v1/logout", {
		method: "POST",
	});

	return response;
};

export const getOidcLoginUrl = (): string =>
	buildApiUrl("/api/v1/auth/oidc/login");

export const getBackendOrigin = (): string => getApiBaseUrl();
