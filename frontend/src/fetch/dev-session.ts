import type { GlobalRole, PartnerRole } from "@/features/auth/authorization";
import { HttpRequestError } from "./errors";
import { requestJson } from "./request-json";

export type DevSessionPartnerAccess = {
	role: PartnerRole;
	workspaceName: string;
	workspaceUuid: string;
};

export type DevSessionFixture = {
	email: string;
	fixtureId: string;
	globalRole: GlobalRole | null;
	name: string;
	partnerAccess: Array<DevSessionPartnerAccess>;
};

export type DevSessionRead = {
	currentFixtureId: string | null;
	enabled: true;
	fixtures: Array<DevSessionFixture>;
};

const requestOptions = {
	redirectOnForbidden: false,
	redirectOnUnauthorized: false,
} as const;

export const getDevSession = async (): Promise<DevSessionRead | null> => {
	try {
		return await requestJson<DevSessionRead>(
			"/api/v1/dev/session",
			{
				cache: "no-store",
				method: "GET",
			},
			requestOptions
		);
	} catch (error: unknown) {
		if (error instanceof HttpRequestError && error.status === 404) {
			return null;
		}

		throw error;
	}
};

export const selectDevSessionFixture = async (
	fixtureId: string
): Promise<void> => {
	await requestJson<void>(
		"/api/v1/dev/session",
		{
			body: JSON.stringify({ fixtureId }),
			method: "POST",
		},
		requestOptions
	);
};

export const clearDevSession = async (): Promise<void> => {
	await requestJson<void>(
		"/api/v1/dev/session",
		{ method: "DELETE" },
		requestOptions
	);
};
