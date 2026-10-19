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

export type ApplicationEnvironmentNameUpdate = {
	environmentName: string;
};

export type ApplicationEnvironmentUrlUpdate =
	{ applicationUrlEn: string } | { applicationUrlFr: string };

export type ApplicationEnvironmentRedirectUrisUpdate = {
	redirectUris: Array<string>;
};

export type ApplicationEnvironmentPostLogoutRedirectUrisUpdate = {
	postLogoutRedirectUris: Array<string>;
};

export type ApplicationEnvironmentSingleSignOutUpdate =
	| {
			logoutMethod: "front_channel" | "back_channel";
			signOutRequestUrl: string;
			singleSignOut: true;
	  }
	| {
			singleSignOut: false;
	  };

export type ApplicationEnvironmentClientTypeUpdate =
	| {
			clientType: "public";
			pkceSupported: true;
	  }
	| {
			clientType: "confidential";
			pkceSupported: boolean;
	  };

export type ApplicationEnvironmentAuthenticationMethodUpdate =
	| {
			clientAuthMethod: "private_key_jwt";
			jwksUri: string;
	  }
	| {
			clientAuthMethod: "client_secret_basic" | "client_secret_post";
			jwksUri: null;
	  };

export type ApplicationEnvironmentSectorIdentifierUpdate =
	| {
			sectorIdentifierUrl: string;
			sharesIdentifier: true;
	  }
	| {
			sectorIdentifierUrl: null;
			sharesIdentifier: false;
	  };

export type ApplicationEnvironmentVerificationUpdate = {
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

export type ApplicationEnvironmentSigningUpdate =
	| {
			canSignMessages: true;
			signingMessages: [
				"request_object" | "token_endpoint",
				...Array<"request_object" | "token_endpoint">,
			];
			signingSignatureAlgorithms: [
				| "RS256"
				| "RS384"
				| "RS512"
				| "PS256"
				| "PS384"
				| "PS512"
				| "ES256"
				| "ES384"
				| "ES512",
				...Array<| "RS256"
					| "RS384"
					| "RS512"
					| "PS256"
					| "PS384"
					| "PS512"
					| "ES256"
					| "ES384"
					| "ES512">,
			];
		}
	| {
			canSignMessages: false;
			signingMessages: [];
			signingSignatureAlgorithms: [];
		};

export type ApplicationEnvironmentEncryptionUpdate =
	| {
			canEncryptRequests: true;
			encryptionKeyAlgorithms: [
				"RSA-OAEP" | "RSA-OAEP-256",
				...Array<"RSA-OAEP" | "RSA-OAEP-256">,
			];
			encryptionContentAlgorithms: [
				"A128GCM" | "A192GCM" | "A256GCM",
				...Array<"A128GCM" | "A192GCM" | "A256GCM">,
			];
		}
	| {
			canEncryptRequests: false;
			encryptionKeyAlgorithms: [];
			encryptionContentAlgorithms: [];
		};

export type ApplicationEnvironmentDecryptionUpdate =
	| {
			canDecryptMessages: true;
			decryptionMessages: [
				"token_endpoint_response" | "id_token" | "userinfo",
				...Array<"token_endpoint_response" | "id_token" | "userinfo">,
			];
			decryptionKeyAlgorithms: [
				"RSA-OAEP" | "RSA-OAEP-256",
				...Array<"RSA-OAEP" | "RSA-OAEP-256">,
			];
			decryptionContentAlgorithms: [
				"A128GCM" | "A192GCM" | "A256GCM",
				...Array<"A128GCM" | "A192GCM" | "A256GCM">,
			];
		}
	| {
			canDecryptMessages: false;
			decryptionMessages: [];
			decryptionKeyAlgorithms: [];
			decryptionContentAlgorithms: [];
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

export const getApplicationEnvironment = async (
	applicationUuid: string,
	environmentUuid: string
): Promise<ApplicationEnvironmentRead> => {
	const result = await requestJson<ApplicationEnvironmentRead | null>(
		`/api/v1/applications/${encodeURIComponent(applicationUuid)}/environments/${encodeURIComponent(environmentUuid)}`,
		{
			cache: "no-store",
			method: "GET",
		}
	);
	if (!result) {
		throw new Error("Failed to load application environment");
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

export const updateApplicationEnvironmentName = async (
	applicationUuid: string,
	environmentUuid: string,
	payload: ApplicationEnvironmentNameUpdate
): Promise<ApplicationEnvironmentRead> => {
	const result = await requestJson<ApplicationEnvironmentRead | null>(
		`/api/v1/applications/${encodeURIComponent(applicationUuid)}/environments/${encodeURIComponent(environmentUuid)}`,
		{
			body: JSON.stringify(payload),
			method: "PATCH",
		}
	);
	if (!result) {
		throw new Error("Failed to update application environment name");
	}
	return result;
};

export const updateApplicationEnvironmentUrl = async (
	applicationUuid: string,
	environmentUuid: string,
	payload: ApplicationEnvironmentUrlUpdate
): Promise<ApplicationEnvironmentRead> => {
	const result = await requestJson<ApplicationEnvironmentRead | null>(
		`/api/v1/applications/${encodeURIComponent(applicationUuid)}/environments/${encodeURIComponent(environmentUuid)}`,
		{
			body: JSON.stringify(payload),
			method: "PATCH",
		}
	);
	if (!result) {
		throw new Error("Failed to update application environment URL");
	}
	return result;
};

export const updateApplicationEnvironmentRedirectUris = async (
	applicationUuid: string,
	environmentUuid: string,
	payload: ApplicationEnvironmentRedirectUrisUpdate
): Promise<ApplicationEnvironmentRead> => {
	const result = await requestJson<ApplicationEnvironmentRead | null>(
		`/api/v1/applications/${encodeURIComponent(applicationUuid)}/environments/${encodeURIComponent(environmentUuid)}`,
		{
			body: JSON.stringify(payload),
			method: "PATCH",
		}
	);
	if (!result) {
		throw new Error("Failed to update application environment redirect URIs");
	}
	return result;
};

export const updateApplicationEnvironmentPostLogoutRedirectUris = async (
	applicationUuid: string,
	environmentUuid: string,
	payload: ApplicationEnvironmentPostLogoutRedirectUrisUpdate
): Promise<ApplicationEnvironmentRead> => {
	const result = await requestJson<ApplicationEnvironmentRead | null>(
		`/api/v1/applications/${encodeURIComponent(applicationUuid)}/environments/${encodeURIComponent(environmentUuid)}`,
		{
			body: JSON.stringify(payload),
			method: "PATCH",
		}
	);
	if (!result) {
		throw new Error(
			"Failed to update application environment post-logout redirect URIs"
		);
	}
	return result;
};

export const updateApplicationEnvironmentSingleSignOut = async (
	applicationUuid: string,
	environmentUuid: string,
	payload: ApplicationEnvironmentSingleSignOutUpdate
): Promise<ApplicationEnvironmentRead> => {
	const result = await requestJson<ApplicationEnvironmentRead | null>(
		`/api/v1/applications/${encodeURIComponent(applicationUuid)}/environments/${encodeURIComponent(environmentUuid)}`,
		{
			body: JSON.stringify(payload),
			method: "PATCH",
		}
	);
	if (!result) {
		throw new Error(
			"Failed to update application environment single sign-out settings"
		);
	}
	return result;
};

export const updateApplicationEnvironmentClientType = async (
	applicationUuid: string,
	environmentUuid: string,
	payload: ApplicationEnvironmentClientTypeUpdate
): Promise<ApplicationEnvironmentRead> => {
	const result = await requestJson<ApplicationEnvironmentRead | null>(
		`/api/v1/applications/${encodeURIComponent(applicationUuid)}/environments/${encodeURIComponent(environmentUuid)}`,
		{
			body: JSON.stringify(payload),
			method: "PATCH",
		}
	);
	if (!result) {
		throw new Error("Failed to update application environment client type");
	}
	return result;
};

export const updateApplicationEnvironmentAuthenticationMethod = async (
	applicationUuid: string,
	environmentUuid: string,
	payload: ApplicationEnvironmentAuthenticationMethodUpdate
): Promise<ApplicationEnvironmentRead> => {
	const result = await requestJson<ApplicationEnvironmentRead | null>(
		`/api/v1/applications/${encodeURIComponent(applicationUuid)}/environments/${encodeURIComponent(environmentUuid)}`,
		{
			body: JSON.stringify(payload),
			method: "PATCH",
		}
	);
	if (!result) {
		throw new Error(
			"Failed to update application environment authentication method"
		);
	}
	return result;
};

export const updateApplicationEnvironmentSectorIdentifier = async (
	applicationUuid: string,
	environmentUuid: string,
	payload: ApplicationEnvironmentSectorIdentifierUpdate
): Promise<ApplicationEnvironmentRead> => {
	const result = await requestJson<ApplicationEnvironmentRead | null>(
		`/api/v1/applications/${encodeURIComponent(applicationUuid)}/environments/${encodeURIComponent(environmentUuid)}`,
		{
			body: JSON.stringify(payload),
			method: "PATCH",
		}
	);
	if (!result) {
		throw new Error(
			"Failed to update application environment sector identifier"
		);
	}
	return result;
};

export const updateApplicationEnvironmentVerification = async (
	applicationUuid: string,
	environmentUuid: string,
	payload: ApplicationEnvironmentVerificationUpdate
): Promise<ApplicationEnvironmentRead> => {
	const result = await requestJson<ApplicationEnvironmentRead | null>(
		`/api/v1/applications/${encodeURIComponent(applicationUuid)}/environments/${encodeURIComponent(environmentUuid)}`,
		{
			body: JSON.stringify(payload),
			method: "PATCH",
		}
	);
	if (!result) {
		throw new Error(
			"Failed to update application environment message verification"
		);
	}
	return result;
};

export const updateApplicationEnvironmentSigning = async (
	applicationUuid: string,
	environmentUuid: string,
	payload: ApplicationEnvironmentSigningUpdate
): Promise<ApplicationEnvironmentRead> => {
	const result = await requestJson<ApplicationEnvironmentRead | null>(
		`/api/v1/applications/${encodeURIComponent(applicationUuid)}/environments/${encodeURIComponent(environmentUuid)}`,
		{
			body: JSON.stringify(payload),
			method: "PATCH",
		}
	);
	if (!result) {
		throw new Error("Failed to update application environment message signing");
	}
	return result;
};

export const updateApplicationEnvironmentEncryption = async (
	applicationUuid: string,
	environmentUuid: string,
	payload: ApplicationEnvironmentEncryptionUpdate
): Promise<ApplicationEnvironmentRead> => {
	const result = await requestJson<ApplicationEnvironmentRead | null>(
		`/api/v1/applications/${encodeURIComponent(applicationUuid)}/environments/${encodeURIComponent(environmentUuid)}`,
		{
			body: JSON.stringify(payload),
			method: "PATCH",
		}
	);
	if (!result) {
		throw new Error(
			"Failed to update application environment request encryption"
		);
	}
	return result;
};

export const updateApplicationEnvironmentDecryption = async (
	applicationUuid: string,
	environmentUuid: string,
	payload: ApplicationEnvironmentDecryptionUpdate
): Promise<ApplicationEnvironmentRead> => {
	const result = await requestJson<ApplicationEnvironmentRead | null>(
		`/api/v1/applications/${encodeURIComponent(applicationUuid)}/environments/${encodeURIComponent(environmentUuid)}`,
		{
			body: JSON.stringify(payload),
			method: "PATCH",
		}
	);
	if (!result) {
		throw new Error(
			"Failed to update application environment message decryption"
		);
	}
	return result;
};
