import { afterEach, describe, expect, it, vi } from "vitest";
import {
	createRPApplication,
	createCurrentUserRPApplicationRotatedClientSecret,
	deleteCurrentUserRPApplicationRotatedClientSecret,
	deleteRPApplication,
	getCurrentUserRPOAuthSetup,
	getCurrentUserRPApplication,
	getCurrentUserRPApplicationClientCredentials,
	getCurrentUserRPApplicationRotatedClientSecrets,
	getRPApplication,
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
					application_information_id: 14,
					canada_login_environment: "staging",
					created_at: "2026-04-02T00:00:00Z",
					created_by: 1,
					dnr_app_name: "[DEPT] - Portal",
					ibm_sv_application_id: "ibm-app-1",
					id: 1,
					is_deleted: false,
					status: "active",
					uuid: applicationUuid,
					workspace_id: 10,
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await updateRPApplication(workspaceUuid, applicationUuid, {
			requested_scopes: ["openid", "profile", "email"],
			service_name_en: "Portal Updated",
		});

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/applications/${applicationUuid}`,
			expect.objectContaining({
				body: JSON.stringify({
					requested_scopes: ["openid", "profile", "email"],
					service_name_en: "Portal Updated",
				}),
				credentials: "include",
				method: "PATCH",
			})
		);
		expect(response).toMatchObject({
			application_information_id: 14,
			canada_login_environment: "staging",
			ibm_sv_application_id: "ibm-app-1",
			dnr_app_name: "[DEPT] - Portal",
			uuid: applicationUuid,
		});
	});

	it("creates an RP application through the backend API", async () => {
		const workspaceUuid = "workspace-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					application_information_id: 14,
					canada_login_environment: "staging",
					created_at: "2026-04-02T00:00:00Z",
					created_by: 1,
					dnr_app_name: "Benefits Portal",
					id: 1,
					is_deleted: false,
					status: null,
					uuid: "application-uuid-1",
					workspace_id: 10,
				}),
			ok: true,
			status: 201,
		} as Response);

		const payload = {
			application_environment_url_en: "https://benefits.canada.ca",
			application_environment_url_fr: "https://prestations.canada.ca",
			application_information_uuid: "application-information-uuid-1",
			canada_login_environment: "staging" as const,
			client_auth_method: "private_key_jwt" as const,
			client_type: "confidential" as const,
			jwks_uri: "https://benefits.canada.ca/.well-known/jwks.json",
			logout_mode: "front_channel" as const,
			logout_uri: "https://benefits.canada.ca/logout",
			message_decryption_content_algorithms: ["A256GCM" as const],
			message_decryption_key_management_algorithms: [
				"RSA-OAEP-256" as const,
			],
			message_decryption_supported: true,
			message_decryption_targets: ["id_token" as const],
			migration_sector_identifier_url:
				"https://benefits.canada.ca/sector.json",
				pkce_algorithms: ["S256" as const],
				pkce_supported: true,
				post_logout_redirect_uris: [
					"https://benefits.canada.ca/logout-complete",
				],
				private_key_distribution_method: "jwks_uri" as const,
				redirect_uris: ["https://benefits.canada.ca/callback"],
				request_encryption_roadmap: false,
				request_encryption_supported: false,
				request_signing_revisit_on: "2027-03",
				request_signing_roadmap: true,
				request_signing_supported: false,
				requested_scopes: ["openid" as const, "profile" as const, "email" as const],
				sector_identifier: "https://benefits.canada.ca",
				service_name_en: "Benefits Portal",
				service_name_fr: "Portail des prestations",
				shares_pairwise_identifiers: false,
				signature_validation_algorithms: ["RS256" as const],
				signature_validation_supported: true,
				signature_validation_targets: ["id_token" as const, "userinfo" as const],
				supports_authorization_code_flow: true,
		};

		const response = await createRPApplication(workspaceUuid, payload);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/applications`,
			expect.objectContaining({
				body: JSON.stringify(payload),
				credentials: "include",
				method: "POST",
			})
		);
		expect(response).toMatchObject({
			dnr_app_name: "Benefits Portal",
			uuid: "application-uuid-1",
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

	it("gets a workspace-scoped RP application through the backend API", async () => {
		const workspaceUuid = "workspace-uuid-1";
		const applicationUuid = "application-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					created_at: "2026-04-02T00:00:00Z",
					created_by: 1,
					dnr_app_name: "Benefits Portal",
					ibm_sv_application_id: "ibm-app-1",
					id: 1,
					is_deleted: false,
					status: "active",
					uuid: applicationUuid,
					workspace_id: 10,
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await getRPApplication(workspaceUuid, applicationUuid);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/applications/${applicationUuid}`,
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
		expect(response).toMatchObject({
			dnr_app_name: "Benefits Portal",
			ibm_sv_application_id: "ibm-app-1",
			uuid: applicationUuid,
		});
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
			request_signing_supported: false,
			service_name_en: "Renamed App",
		});

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/rp-applications/mine/${applicationUuid}`,
			expect.objectContaining({
				body: JSON.stringify({
					request_signing_supported: false,
					service_name_en: "Renamed App",
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
					canadaLoginEnvironment: "production",
					discoveryEndpoint:
						"https://cds-gcsignin-dev.verify.ibm.com/oauth2/.well-known/openid-configuration",
					logoutRedirectUris: [
						"https://benefits.example.gc.ca/logout-complete",
					],
					logoutUri: "https://benefits.example.gc.ca/backchannel-logout",
					onboardingState: "under_review",
					pkceEnabled: true,
					promotionStatus: "review_tracked",
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
		expect(response.onboardingState).toBe("under_review");
		expect(response.promotionStatus).toBe("review_tracked");
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
				`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/applications/${applicationUuid}/audit-events?selected_date=1775692800000&size=25`,
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
				`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/applications/${applicationUuid}/audit-events/search-after?selected_date=1775692800000&search_after=%221744200000000%22%2C+%22event-2%22&size=25`,
				expect.objectContaining({
					credentials: "include",
					method: "GET",
				})
			);
		});
});
