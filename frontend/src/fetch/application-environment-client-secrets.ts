import { requestJson } from "@/fetch";

export type ApplicationEnvironmentClientCredentialsRead = {
	clientId: string;
	clientSecret: string | null;
	clientSecretId: string | null;
};

export type ApplicationEnvironmentRotatedClientSecretRead = {
	description: string | null;
	expiredAt: number | null;
	rotatedAt: number | null;
	value: string | null;
	secretId: string | null;
};

export type ApplicationEnvironmentClientSecretRotateRequest = {
	description: string;
	rotatedSecretExpiredAt: number;
};

const getEnvironmentClientPath = (
	applicationUuid: string,
	environmentUuid: string
): string =>
	`/api/v1/applications/${encodeURIComponent(applicationUuid)}/environments/${encodeURIComponent(environmentUuid)}/client`;

export const getApplicationEnvironmentClientCredentials = async (
	applicationUuid: string,
	environmentUuid: string
): Promise<ApplicationEnvironmentClientCredentialsRead> => {
	const result =
		await requestJson<ApplicationEnvironmentClientCredentialsRead | null>(
			getEnvironmentClientPath(applicationUuid, environmentUuid),
			{
				cache: "no-store",
				method: "GET",
			}
		);
	if (!result) {
		throw new Error("Failed to load application environment credentials");
	}
	return result;
};

export const getApplicationEnvironmentRotatedClientSecrets = async (
	applicationUuid: string,
	environmentUuid: string
): Promise<Array<ApplicationEnvironmentRotatedClientSecretRead>> => {
	const result =
		await requestJson<Array<ApplicationEnvironmentRotatedClientSecretRead> | null>(
			`${getEnvironmentClientPath(applicationUuid, environmentUuid)}/rotated-secrets`,
			{
				cache: "no-store",
				method: "GET",
			}
		);
	if (!result) {
		throw new Error("Failed to load rotated application environment secrets");
	}
	return result;
};

export const rotateApplicationEnvironmentClientSecret = async (
	applicationUuid: string,
	environmentUuid: string,
	payload: ApplicationEnvironmentClientSecretRotateRequest
): Promise<ApplicationEnvironmentClientCredentialsRead> => {
	const result =
		await requestJson<ApplicationEnvironmentClientCredentialsRead | null>(
			`${getEnvironmentClientPath(applicationUuid, environmentUuid)}/rotate-secret`,
			{
				body: JSON.stringify(payload),
				method: "POST",
			}
		);
	if (!result) {
		throw new Error("Failed to rotate application environment secret");
	}
	return result;
};

export const deleteApplicationEnvironmentRotatedClientSecret = async (
	applicationUuid: string,
	environmentUuid: string,
	value: string
): Promise<{ message: string }> => {
	const result = await requestJson<{ message: string } | null>(
		`${getEnvironmentClientPath(applicationUuid, environmentUuid)}/rotated-secrets/${encodeURIComponent(value)}`,
		{ method: "DELETE" }
	);
	if (!result) {
		throw new Error("Failed to expire rotated application environment secret");
	}
	return result;
};
