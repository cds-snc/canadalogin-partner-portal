import { requestJson } from "@/fetch";

export type HealthCheck = {
	status: string;
	environment: string;
	version: string;
	timestamp: string;
};

export type ReadyCheck = {
	status: string;
	environment: string;
	version: string;
	app: string;
	database: string;
	redis: string;
	timestamp: string;
};

const createSystemRequest = async <ResponseType>(
	path: string
): Promise<ResponseType> =>
	(await requestJson<ResponseType>(path, {
		credentials: "omit",
		method: "GET",
	})) as ResponseType;

export const getHealthCheck = async (): Promise<HealthCheck> =>
	createSystemRequest<HealthCheck>("/api/v1/health");

export const getReadyCheck = async (): Promise<ReadyCheck> =>
	createSystemRequest<ReadyCheck>("/api/v1/ready");
