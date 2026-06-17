import { afterEach, describe, expect, it, vi } from "vitest";
import {
	createCurrentUserRPApplicationRotatedClientSecret,
	deleteCurrentUserRPApplicationRotatedClientSecret,
	deleteRPApplication,
	getCurrentUserRPOAuthSetup,
	getCurrentUserRPApplication,
	getCurrentUserRPApplicationClientCredentials,
	getCurrentUserRPApplicationRotatedClientSecrets,
	getRPApplicationUsageAuditTrail,
	getRPApplicationUsageAuditTrailSearchAfter,
	getRPApplicationUsageSummary,
	rotateCurrentUserRPApplicationClientSecret,
	updateCurrentUserRPApplication,
	updateRPApplication,
} from "@/fetch/rp-applications";

describe("rp_application-api", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("updates an RP application through the backend API", async () => {
		const workspaceUuid = "workspace-uuid-1";
		const applicationUuid = "application-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					created_at: "2026-04-02T00:00:00Z",
					created_by: 1,
					ibm_sv_application_id: "ibm-app-1",
					id: 1,
					is_deleted: false,
					name: "[DEPT] - Portal",
					settings: {
						application_url: "https://portal.example.com",
						description: "Updated description",
						redirect_uris: ["https://portal.example.com/callback"],
					},
					status: "active",
					uuid: applicationUuid,
					workspace_id: 10,
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await updateRPApplication(workspaceUuid, applicationUuid, {
			application_url: "https://portal.example.com",
			description: "Updated description",
			name: "Portal",
			redirect_uris: ["https://portal.example.com/callback"],
		});

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/applications/${applicationUuid}`,
			expect.objectContaining({
				body: JSON.stringify({
					application_url: "https://portal.example.com",
					description: "Updated description",
					name: "Portal",
					redirect_uris: ["https://portal.example.com/callback"],
				}),
				credentials: "include",
				method: "PATCH",
			})
		);
		expect(response).toMatchObject({
			ibm_sv_application_id: "ibm-app-1",
			name: "[DEPT] - Portal",
			uuid: applicationUuid,
		});
	});

	it("gets a current-user RP application through the backend API", async () => {
		const applicationUuid = "application-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					id: 9,
					name: "Benefits Portal",
					settings: { description: "Example app" },
					status: "active",
					uuid: applicationUuid,
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await getCurrentUserRPApplication(applicationUuid);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/rp-applications/mine/${applicationUuid}`,
			expect.objectContaining({
				credentials: "include",
				method: "GET",
			})
		);
		expect(response.uuid).toBe(applicationUuid);
	});

	it("updates a current-user RP application through the backend API", async () => {
		const applicationUuid = "application-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					id: 9,
					name: "[DEPT] - Renamed App",
					settings: { description: "Updated description" },
					status: "active",
					uuid: applicationUuid,
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await updateCurrentUserRPApplication(applicationUuid, {
			description: "Updated description",
			name: "Renamed App",
		});

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/rp-applications/mine/${applicationUuid}`,
			expect.objectContaining({
				body: JSON.stringify({
					description: "Updated description",
					name: "Renamed App",
				}),
				credentials: "include",
				method: "PATCH",
			})
		);
		expect(response.name).toBe("[DEPT] - Renamed App");
	});

	it("gets current-user RP OAuth setup through the backend API", async () => {
		const applicationUuid = "application-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					applicationUrl: "https://benefits.example.gc.ca",
					discoveryEndpoint:
						"https://cds-gcsignin-dev.verify.ibm.com/oauth2/.well-known/openid-configuration",
					logoutRedirectUris: [
						"https://benefits.example.gc.ca/logout-complete",
					],
					logoutUri: "https://benefits.example.gc.ca/backchannel-logout",
					pkceEnabled: true,
					rpApplicationName: "Benefits Portal",
					redirectUris: ["https://benefits.example.gc.ca/callback"],
					status: "active",
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await getCurrentUserRPOAuthSetup(applicationUuid);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/rp-applications/mine/${applicationUuid}/oauth-setup`,
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
		expect(response.rpApplicationName).toBe("Benefits Portal");
	});

	it("deletes an RP application through the backend API", async () => {
		const workspaceUuid = "workspace-uuid-1";
		const applicationUuid = "application-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({ message: "RP application deleted successfully" }),
			ok: true,
			status: 200,
		} as Response);

		const response = await deleteRPApplication(workspaceUuid, applicationUuid);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/applications/${applicationUuid}`,
			expect.objectContaining({
				credentials: "include",
				method: "DELETE",
			})
		);
		expect(response).toMatchObject({
			message: "RP application deleted successfully",
		});
	});

	it("gets current-user RP application client credentials through the backend API", async () => {
		const applicationUuid = "application-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					clientId: "client-id-123",
					clientSecret: "top-secret-value",
					clientSecretId: "secret-1",
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await getCurrentUserRPApplicationClientCredentials(
			applicationUuid
		);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/rp-applications/mine/${applicationUuid}/client`,
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
		expect(response.clientId).toBe("client-id-123");
	});

	it("lists current-user rotated client secrets through the backend API", async () => {
		const applicationUuid = "application-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve([
					{
						description: "April rotation",
						expiredAt: 1775692800,
						path: "/rotatedSecrets/0",
						rotatedAt: 1773100800,
						secretId: "/rotatedSecrets/0",
						value: "{sha512}redacted",
					},
				]),
			ok: true,
			status: 200,
		} as Response);

		const response = await getCurrentUserRPApplicationRotatedClientSecrets(
			applicationUuid
		);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/rp-applications/mine/${applicationUuid}/client/rotated-secrets`,
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
		expect(response[0]?.secretId).toBe("/rotatedSecrets/0");
		expect(response[0]?.path).toBe("/rotatedSecrets/0");
	});

	it("creates a current-user rotated client secret through the backend API", async () => {
		const applicationUuid = "application-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve([]),
			ok: true,
			status: 200,
		} as Response);

		await createCurrentUserRPApplicationRotatedClientSecret(applicationUuid, {
			description: "April rotation",
			rotatedSecretExpiredAt: 1775692800,
		});

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/rp-applications/mine/${applicationUuid}/client/rotated-secrets`,
			expect.objectContaining({
				body: JSON.stringify({
					description: "April rotation",
					rotatedSecretExpiredAt: 1775692800,
				}),
				credentials: "include",
				method: "POST",
			})
		);
	});

	it("deletes a current-user rotated client secret through the backend API", async () => {
		const applicationUuid = "application-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve({ message: "Rotated client secret deleted" }),
			ok: true,
			status: 200,
		} as Response);

		const response = await deleteCurrentUserRPApplicationRotatedClientSecret(
			applicationUuid,
			"{sha512}redacted"
		);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/rp-applications/mine/${applicationUuid}/client/rotated-secrets/%7Bsha512%7Dredacted`,
			expect.objectContaining({
				credentials: "include",
				method: "DELETE",
			})
		);
		expect(response["message"]).toBe("Rotated client secret deleted");
	});

	it("rotates the current-user RP application client secret through the backend API", async () => {
		const applicationUuid = "application-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					clientId: "client-id-123",
					clientSecret: "rotated-secret-value",
					clientSecretId: "secret-2",
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await rotateCurrentUserRPApplicationClientSecret(
			applicationUuid
		);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/rp-applications/mine/${applicationUuid}/client/rotate-secret`,
			expect.objectContaining({
				credentials: "include",
				body: JSON.stringify({
					deleteRotatedSecrets: false,
					description: "",
					rotatedSecretExpiredAt: 0,
				}),
				method: "POST",
			})
		);
		expect(response.clientSecret).toBe("rotated-secret-value");
	});

	it("sends a named rotation payload for current-user client secret rotation", async () => {
		const applicationUuid = "application-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					clientId: "client-id-123",
					clientSecret: "rotated-secret-value",
					clientSecretId: "secret-2",
				}),
			ok: true,
			status: 200,
		} as Response);

		await rotateCurrentUserRPApplicationClientSecret(applicationUuid, {
			deleteRotatedSecrets: true,
			description: "April rotation",
			rotatedSecretExpiredAt: 1775692800,
		});

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/rp-applications/mine/${applicationUuid}/client/rotate-secret`,
			expect.objectContaining({
				body: JSON.stringify({
					deleteRotatedSecrets: true,
					description: "April rotation",
					rotatedSecretExpiredAt: 1775692800,
				}),
				credentials: "include",
				method: "POST",
			})
		);
	});

		it("gets RP application usage summary through the backend API", async () => {
			const workspaceUuid = "workspace-uuid-1";
			const applicationUuid = "application-uuid-1";
			const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
				headers: new Headers({ "content-type": "application/json" }),
				json: () =>
					Promise.resolve({
						failed: 2,
						succeeded: 9,
						total: 11,
					}),
				ok: true,
				status: 200,
			} as Response);

			const response = await getRPApplicationUsageSummary(
				workspaceUuid,
				applicationUuid,
				"2026-04-09"
			);

			expect(fetchMock).toHaveBeenCalledWith(
				`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/applications/${applicationUuid}/usage/summary?selected_date=1775692800000`,
				expect.objectContaining({
					credentials: "include",
					method: "GET",
				})
			);
			expect(response.total).toBe(11);
		});

		it("gets RP application usage audit trail through the backend API", async () => {
			const workspaceUuid = "workspace-uuid-1";
			const applicationUuid = "application-uuid-1";
			const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
				headers: new Headers({ "content-type": "application/json" }),
				json: () =>
					Promise.resolve({
						events: [],
						next: '1744200000000, "event-2"',
						total: 20,
					}),
				ok: true,
				status: 200,
			} as Response);

			await getRPApplicationUsageAuditTrail(workspaceUuid, applicationUuid, {
				selectedDate: "2026-04-09",
				size: 25,
			});

			expect(fetchMock).toHaveBeenCalledWith(
				`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/applications/${applicationUuid}/usage/audit-trail?selected_date=1775692800000&size=25`,
				expect.objectContaining({
					credentials: "include",
					method: "GET",
				})
			);
		});

		it("gets RP application usage audit trail search-after page through the backend API", async () => {
			const workspaceUuid = "workspace-uuid-1";
			const applicationUuid = "application-uuid-1";
			const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
				headers: new Headers({ "content-type": "application/json" }),
				json: () => Promise.resolve({ events: [], next: null, total: 20 }),
				ok: true,
				status: 200,
			} as Response);

			await getRPApplicationUsageAuditTrailSearchAfter(
				workspaceUuid,
				applicationUuid,
				{
					searchAfter: '"1744200000000", "event-2"',
					selectedDate: "2026-04-09",
					size: 25,
				}
			);

			expect(fetchMock).toHaveBeenCalledWith(
				`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/applications/${applicationUuid}/usage/audit-trail/search-after?selected_date=1775692800000&search_after=%221744200000000%22%2C+%22event-2%22&size=25`,
				expect.objectContaining({
					credentials: "include",
					method: "GET",
				})
			);
		});
});
