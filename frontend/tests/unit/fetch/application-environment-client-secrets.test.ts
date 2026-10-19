import { afterEach, describe, expect, it, vi } from "vitest";
import {
	deleteApplicationEnvironmentRotatedClientSecret,
	getApplicationEnvironmentClientCredentials,
	getApplicationEnvironmentRotatedClientSecrets,
	rotateApplicationEnvironmentClientSecret,
} from "@/fetch/application-environment-client-secrets";

const applicationUuid = "application-uuid-1";
const environmentUuid = "environment-uuid-1";
const clientPath =
	`http://localhost:8000/api/v1/applications/${applicationUuid}` +
	`/environments/${environmentUuid}/client`;

const jsonResponse = (body: unknown): Response =>
	({
		headers: new Headers({ "content-type": "application/json" }),
		json: () => Promise.resolve(body),
		ok: true,
		status: 200,
	}) as Response;

describe("application environment client secrets API", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("gets active credentials without caching", async () => {
		const credentials = {
			clientId: "client-id",
			clientSecret: "active-secret",
			clientSecretId: "secret-id",
		};
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(jsonResponse(credentials));

		await expect(
			getApplicationEnvironmentClientCredentials(applicationUuid, environmentUuid)
		).resolves.toEqual(credentials);
		expect(fetchMock).toHaveBeenCalledWith(
			clientPath,
			expect.objectContaining({ cache: "no-store", method: "GET" })
		);
	});

	it("gets rotated secrets without caching", async () => {
		const rotatedSecrets = [
			{
				description: "annual rotation",
				expiredAt: 1_800_000_000,
				rotatedAt: 1_799_000_000,
				secretId: "rotated-id",
				value: "rotated-secret",
			},
		];
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(jsonResponse(rotatedSecrets));

		await expect(
			getApplicationEnvironmentRotatedClientSecrets(
				applicationUuid,
				environmentUuid
			)
		).resolves.toEqual(rotatedSecrets);
		expect(fetchMock).toHaveBeenCalledWith(
			`${clientPath}/rotated-secrets`,
			expect.objectContaining({ cache: "no-store", method: "GET" })
		);
	});

	it("posts the rotation reason and requested expiry", async () => {
		const payload = {
			description: "annual rotation",
			rotatedSecretExpiredAt: 1_800_000_000,
		};
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(jsonResponse({
				clientId: "client-id",
				clientSecret: "new-secret",
				clientSecretId: "new-secret-id",
			}));

		await rotateApplicationEnvironmentClientSecret(
			applicationUuid,
			environmentUuid,
			payload
		);

		expect(fetchMock).toHaveBeenCalledWith(
			`${clientPath}/rotate-secret`,
			expect.objectContaining({
				body: JSON.stringify(payload),
				method: "POST",
			})
		);
	});

	it("encodes the selected rotated secret in the delete path", async () => {
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(jsonResponse({ message: "Rotated client secret deleted" }));

		await deleteApplicationEnvironmentRotatedClientSecret(
			applicationUuid,
			environmentUuid,
			"secret/with+special=value"
		);

		expect(fetchMock).toHaveBeenCalledWith(
			`${clientPath}/rotated-secrets/secret%2Fwith%2Bspecial%3Dvalue`,
			expect.objectContaining({ method: "DELETE" })
		);
	});
});