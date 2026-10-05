import { requestJson } from "@/fetch";

export type ApplicationEnvironmentApplicationRead = {
	nameEn: string;
	nameFr: string | null;
	uuid: string;
};

export type ApplicationEnvironmentRead = {
	config?: Partial<ApplicationEnvironmentCreate> | null;
	createdAt: string;
	partnerLabel: string;
	statusCode: string;
	tenantCode: string;
	updatedAt: string | null;
	uuid: string;
};

export type ApplicationEnvironmentCreate = {
	applicationUrlEn: string;
	applicationUrlFr: string;
	canDecryptMessages: boolean;
	canEncryptRequests: boolean;
	canSignMessages: boolean;
	clientAuthMethod?:
		"private_key_jwt" | "client_secret_basic" | "client_secret_post";
	clientType: "public" | "confidential";
	copyExisting: boolean;
	decryptionContentAlgorithms: Array<"A128GCM" | "A192GCM" | "A256GCM">;
	decryptionKeyAlgorithms: Array<"RSA-OAEP" | "RSA-OAEP-256">;
	decryptionMessages: Array<
		"token_endpoint_response" | "id_token" | "userinfo"
	>;
	encryptionContentAlgorithms: Array<"A128GCM" | "A192GCM" | "A256GCM">;
	encryptionKeyAlgorithms: Array<"RSA-OAEP" | "RSA-OAEP-256">;
	environmentName: string;
	jwksUri?: string;
	logoutMethod?: "front_channel" | "back_channel";
	pkceSupported: boolean;
	postLogoutRedirectUris: Array<string>;
	redirectUris: Array<string>;
	sectorIdentifierUrl?: string;
	sharesIdentifier: boolean;
	signOutRequestUrl?: string;
	signingMessages: Array<"request_object" | "token_endpoint">;
	signingSignatureAlgorithms: Array<
		| "RS256"
		| "RS384"
		| "RS512"
		| "PS256"
		| "PS384"
		| "PS512"
		| "ES256"
		| "ES384"
		| "ES512"
	>;
	singleSignOut: boolean;
	sourceEnvironmentUuid?: string;
	tenantCode: "test" | "staging";
	verificationMessages: Array<"id_token" | "userinfo">;
	verificationSignatureAlgorithms: Array<
		| "RS256"
		| "RS384"
		| "RS512"
		| "PS256"
		| "PS384"
		| "PS512"
		| "ES256"
		| "ES384"
		| "ES512"
	>;
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

export const createApplicationEnvironment = async (
	applicationUuid: string,
	payload: ApplicationEnvironmentCreate
): Promise<ApplicationEnvironmentRead | null> =>
	requestJson<ApplicationEnvironmentRead>(
		`/api/v1/applications/${encodeURIComponent(applicationUuid)}/environments`,
		{
			body: JSON.stringify(payload),
			method: "POST",
		}
	);
