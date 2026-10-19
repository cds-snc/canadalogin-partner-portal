import { afterEach, describe, expect, it, vi } from "vitest";
import {
	getApplicationEnvironment,
	getApplicationEnvironments,
	updateApplicationEnvironmentAuthenticationMethod,
	updateApplicationEnvironmentDecryption,
	updateApplicationEnvironmentEncryption,
	updateApplicationEnvironmentName,
	updateApplicationEnvironmentClientType,
	updateApplicationEnvironmentPostLogoutRedirectUris,
	updateApplicationEnvironmentRedirectUris,
	updateApplicationEnvironmentSectorIdentifier,
	updateApplicationEnvironmentSigning,
	updateApplicationEnvironmentUrl,
	updateApplicationEnvironmentVerification,
	type ApplicationEnvironmentSigningUpdate,
	type ApplicationEnvironmentEncryptionUpdate,
	type ApplicationEnvironmentDecryptionUpdate,
	type ApplicationEnvironmentVerificationUpdate,
} from "@/fetch/application-environments";

describe("application-environments API", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("gets a paginated application environment list", async () => {
		const applicationUuid = "application-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					application: {
						nameEn: "Benefits portal",
						nameFr: null,
						uuid: applicationUuid,
					},
					data: [],
					hasMore: false,
					itemsPerPage: 10,
					page: 2,
					totalCount: 0,
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await getApplicationEnvironments(applicationUuid, {
			itemsPerPage: 10,
			page: 2,
		});

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/applications/${applicationUuid}/environments?items_per_page=10&page=2`,
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
		expect(response.page).toBe(2);
		expect(response.application.nameEn).toBe("Benefits portal");
	});

	it("gets an application environment by UUID", async () => {
		const applicationUuid = "application-uuid-1";
		const environmentUuid = "environment-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					createdAt: "2026-09-17T00:00:00Z",
					partnerLabel: "Test environment",
					statusCode: "draft",
					tenantCode: "test",
					updatedAt: null,
					uuid: environmentUuid,
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await getApplicationEnvironment(
			applicationUuid,
			environmentUuid
		);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/applications/${applicationUuid}/environments/${environmentUuid}`,
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
		expect(response.uuid).toBe(environmentUuid);
	});

	it("updates an application environment name", async () => {
		const applicationUuid = "application-uuid-1";
		const environmentUuid = "environment-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					partnerLabel: "TEST-portal-renamed",
					uuid: environmentUuid,
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await updateApplicationEnvironmentName(
			applicationUuid,
			environmentUuid,
			{ environmentName: "portal-renamed" }
		);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/applications/${applicationUuid}/environments/${environmentUuid}`,
			expect.objectContaining({
				body: JSON.stringify({ environmentName: "portal-renamed" }),
				credentials: "include",
				method: "PATCH",
			})
		);
		expect(response.partnerLabel).toBe("TEST-portal-renamed");
	});

	it.each([
		["English", { applicationUrlEn: "https://example.com/new-en" }],
		["French", { applicationUrlFr: "https://example.com/new-fr" }],
	] as const)(
		"updates the %s application environment URL",
		async (_, payload) => {
			const applicationUuid = "application-uuid-1";
			const environmentUuid = "environment-uuid-1";
			const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
				headers: new Headers({ "content-type": "application/json" }),
				json: () => Promise.resolve({ uuid: environmentUuid }),
				ok: true,
				status: 200,
			} as Response);

			await updateApplicationEnvironmentUrl(
				applicationUuid,
				environmentUuid,
				payload
			);

			expect(fetchMock).toHaveBeenCalledWith(
				`http://localhost:8000/api/v1/applications/${applicationUuid}/environments/${environmentUuid}`,
				expect.objectContaining({
					body: JSON.stringify(payload),
					credentials: "include",
					method: "PATCH",
				})
			);
		}
	);

	it("updates application environment redirect URIs", async () => {
		const applicationUuid = "application-uuid-1";
		const environmentUuid = "environment-uuid-1";
		const payload = {
			redirectUris: [
				"https://example.com/callback",
				"https://example.com/alternate-callback",
			],
		};
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve({ uuid: environmentUuid }),
			ok: true,
			status: 200,
		} as Response);

		await updateApplicationEnvironmentRedirectUris(
			applicationUuid,
			environmentUuid,
			payload
		);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/applications/${applicationUuid}/environments/${environmentUuid}`,
			expect.objectContaining({
				body: JSON.stringify(payload),
				credentials: "include",
				method: "PATCH",
			})
		);
	});

	it("updates application environment post-logout redirect URIs", async () => {
		const applicationUuid = "application-uuid-1";
		const environmentUuid = "environment-uuid-1";
		const payload = {
			postLogoutRedirectUris: [
				"https://example.com/logout",
				"https://example.com/alternate-logout",
			],
		};
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve({ uuid: environmentUuid }),
			ok: true,
			status: 200,
		} as Response);

		await updateApplicationEnvironmentPostLogoutRedirectUris(
			applicationUuid,
			environmentUuid,
			payload
		);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/applications/${applicationUuid}/environments/${environmentUuid}`,
			expect.objectContaining({
				body: JSON.stringify(payload),
				credentials: "include",
				method: "PATCH",
			})
		);
	});

	it("updates application environment client type and PKCE atomically", async () => {
		const applicationUuid = "application-uuid-1";
		const environmentUuid = "environment-uuid-1";
		const payload = { clientType: "public", pkceSupported: true } as const;
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve({ uuid: environmentUuid }),
			ok: true,
			status: 200,
		} as Response);

		await updateApplicationEnvironmentClientType(
			applicationUuid,
			environmentUuid,
			payload
		);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/applications/${applicationUuid}/environments/${environmentUuid}`,
			expect.objectContaining({
				body: JSON.stringify(payload),
				credentials: "include",
				method: "PATCH",
			})
		);
	});

	it("updates application environment authentication method and JWKS atomically", async () => {
		const applicationUuid = "application-uuid-1";
		const environmentUuid = "environment-uuid-1";
		const payload = {
			clientAuthMethod: "client_secret_post",
			jwksUri: null,
		} as const;
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve({ uuid: environmentUuid }),
			ok: true,
			status: 200,
		} as Response);

		await updateApplicationEnvironmentAuthenticationMethod(
			applicationUuid,
			environmentUuid,
			payload
		);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/applications/${applicationUuid}/environments/${environmentUuid}`,
			expect.objectContaining({
				body: JSON.stringify(payload),
				credentials: "include",
				method: "PATCH",
			})
		);
	});

	it("updates application environment sector identifier atomically", async () => {
		const applicationUuid = "application-uuid-1";
		const environmentUuid = "environment-uuid-1";
		const payload = {
			sectorIdentifierUrl: "https://example.com/sector",
			sharesIdentifier: true,
		} as const;
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve({ uuid: environmentUuid }),
			ok: true,
			status: 200,
		} as Response);

		await updateApplicationEnvironmentSectorIdentifier(
			applicationUuid,
			environmentUuid,
			payload
		);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/applications/${applicationUuid}/environments/${environmentUuid}`,
			expect.objectContaining({
				body: JSON.stringify(payload),
				credentials: "include",
				method: "PATCH",
			})
		);
	});

	it("updates application environment message verification atomically", async () => {
		const applicationUuid = "application-uuid-1";
		const environmentUuid = "environment-uuid-1";
		const payload: ApplicationEnvironmentVerificationUpdate = {
			verificationMessages: ["id_token", "userinfo"],
			verificationSignatureAlgorithms: ["RS256", "PS256"],
		};
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve({ uuid: environmentUuid }),
			ok: true,
			status: 200,
		} as Response);

		await updateApplicationEnvironmentVerification(
			applicationUuid,
			environmentUuid,
			payload
		);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/applications/${applicationUuid}/environments/${environmentUuid}`,
			expect.objectContaining({
				body: JSON.stringify(payload),
				credentials: "include",
				method: "PATCH",
			})
		);
	});

	it.each([
		[
			"enabled",
			{
				canSignMessages: true,
				signingMessages: ["request_object", "token_endpoint"],
				signingSignatureAlgorithms: ["RS256", "PS256"],
			} satisfies ApplicationEnvironmentSigningUpdate,
		],
		[
			"disabled and cleared",
			{
				canSignMessages: false,
				signingMessages: [],
				signingSignatureAlgorithms: [],
			} satisfies ApplicationEnvironmentSigningUpdate,
		],
	] as const)(
		"updates application environment message signing when %s",
		async (_, payload) => {
			const applicationUuid = "application-uuid-1";
			const environmentUuid = "environment-uuid-1";
			const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
				headers: new Headers({ "content-type": "application/json" }),
				json: () => Promise.resolve({ uuid: environmentUuid }),
				ok: true,
				status: 200,
			} as Response);

			await updateApplicationEnvironmentSigning(
				applicationUuid,
				environmentUuid,
				payload
			);

			expect(fetchMock).toHaveBeenCalledWith(
				`http://localhost:8000/api/v1/applications/${applicationUuid}/environments/${environmentUuid}`,
				expect.objectContaining({
					body: JSON.stringify(payload),
					credentials: "include",
					method: "PATCH",
				})
			);
		}
	);

	it.each([
		[
			"enabled",
			{
				canEncryptRequests: true,
				encryptionKeyAlgorithms: ["RSA-OAEP", "RSA-OAEP-256"],
				encryptionContentAlgorithms: ["A128GCM", "A256GCM"],
			} satisfies ApplicationEnvironmentEncryptionUpdate,
		],
		[
			"disabled and cleared",
			{
				canEncryptRequests: false,
				encryptionKeyAlgorithms: [],
				encryptionContentAlgorithms: [],
			} satisfies ApplicationEnvironmentEncryptionUpdate,
		],
	] as const)(
		"updates application environment request encryption when %s",
		async (_, payload) => {
			const applicationUuid = "application-uuid-1";
			const environmentUuid = "environment-uuid-1";
			const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
				headers: new Headers({ "content-type": "application/json" }),
				json: () => Promise.resolve({ uuid: environmentUuid }),
				ok: true,
				status: 200,
			} as Response);

			await updateApplicationEnvironmentEncryption(
				applicationUuid,
				environmentUuid,
				payload
			);

			expect(fetchMock).toHaveBeenCalledWith(
				`http://localhost:8000/api/v1/applications/${applicationUuid}/environments/${environmentUuid}`,
				expect.objectContaining({
					body: JSON.stringify(payload),
					credentials: "include",
					method: "PATCH",
				})
		);
		}
	);

	it.each([
		[
			"enabled",
			{
				canDecryptMessages: true,
				decryptionMessages: ["id_token", "userinfo"],
				decryptionKeyAlgorithms: ["RSA-OAEP"],
				decryptionContentAlgorithms: ["A256GCM"],
			} satisfies ApplicationEnvironmentDecryptionUpdate,
		],
		[
			"disabled and cleared",
			{
				canDecryptMessages: false,
				decryptionMessages: [],
				decryptionKeyAlgorithms: [],
				decryptionContentAlgorithms: [],
			} satisfies ApplicationEnvironmentDecryptionUpdate,
		],
	] as const)(
		"updates application environment message decryption when %s",
		async (_, payload) => {
			const applicationUuid = "application-uuid-1";
			const environmentUuid = "environment-uuid-1";
			const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
				headers: new Headers({ "content-type": "application/json" }),
				json: () => Promise.resolve({ uuid: environmentUuid }),
				ok: true,
				status: 200,
			} as Response);

			await updateApplicationEnvironmentDecryption(
				applicationUuid,
				environmentUuid,
				payload
			);

			expect(fetchMock).toHaveBeenCalledWith(
				`http://localhost:8000/api/v1/applications/${applicationUuid}/environments/${environmentUuid}`,
				expect.objectContaining({
					body: JSON.stringify(payload),
					credentials: "include",
					method: "PATCH",
				})
			);
		}
	);
});
