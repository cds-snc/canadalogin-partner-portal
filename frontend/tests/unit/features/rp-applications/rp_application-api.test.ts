import { afterEach, describe, expect, it, vi } from "vitest";
import {
	assignAccessibleRPApplicationDepartment,
	createAccessibleRPApplicationRotatedClientSecret,
	deleteAccessibleRPApplicationRotatedClientSecret,
	deleteRPApplication,
	getAccessibleRPApplication,
	getAccessibleRPApplicationClientCredentials,
	getAccessibleRPApplicationDepartment,
	getAccessibleRPApplicationRotatedClientSecrets,
	getAccessibleRPApplications,
	getRPApplicationAdoptionCandidatePreview,
	getRPApplicationAdoptionCandidates,
	getRPApplication,
	getRPApplicationUsageAuditTrail,
	getRPApplicationUsageAuditTrailSearchAfter,
	getRPApplicationUsageSummary,
	linkRPApplicationToWorkspace,
	rotateAccessibleRPApplicationClientSecret,
	updateRPApplication,
} from "@/fetch/rp-applications";

describe("rp_application-api", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("lists local RP adoption candidates without a provider-specific request", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					items: [
						{
							ibmApplicationId: "ibm-app-1",
							metadataCompleteness: "incomplete",
							missingFieldNames: ["redirectUris"],
							name: "Benefits Portal",
							rpApplicationUuid: "rp-application-1",
							updatedAt: null,
						},
					],
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await getRPApplicationAdoptionCandidates();

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/rp-applications/workspace-adoption-candidates",
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
		expect(response.items[0]?.ibmApplicationId).toBe("ibm-app-1");
	});

	it("loads one safe adoption preview", async () => {
		const applicationUuid = "rp-application-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					candidate: {
						ibmApplicationId: "ibm-app-1",
						metadataCompleteness: "incomplete",
						missingFieldNames: ["redirectUris"],
						name: "Benefits Portal",
						rpApplicationUuid: applicationUuid,
						updatedAt: null,
					},
					canadaLoginEnvironment: null,
					conflictingFieldNames: [],
					fields: [],
					fillableFieldNames: ["redirectUris"],
					preservedLocalFieldNames: [],
				}),
			ok: true,
			status: 200,
		} as Response);

		const response =
			await getRPApplicationAdoptionCandidatePreview(applicationUuid);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/rp-applications/workspace-adoption-candidates/${applicationUuid}`,
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
		expect(response.candidate.name).toBe("Benefits Portal");
	});

	it("links a retained RP to one workspace through the portal API only", async () => {
		const applicationUuid = "rp-application-1";
		const workspaceUuid = "workspace-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					applicationInformationUuid: null,
					canadaLoginEnvironment: "production",
					conflictingFieldNames: [],
					departmentUuid: "department-1",
					filledFieldNames: ["redirectUris"],
					ibmApplicationId: "ibm-app-1",
					idempotentReplay: false,
					name: "Benefits Portal",
					preservedLocalFieldNames: ["displayName"],
					rpApplicationUuid: applicationUuid,
					workspaceUuid,
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await linkRPApplicationToWorkspace(applicationUuid, {
			canadaLoginEnvironment: "production",
			workspaceUuid,
		});

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/rp-applications/${applicationUuid}/workspace-link`,
			expect.objectContaining({
				body: JSON.stringify({
					canadaLoginEnvironment: "production",
					workspaceUuid,
				}),
				credentials: "include",
				method: "PUT",
			})
		);
		expect(response.workspaceUuid).toBe(workspaceUuid);
	});

	it("updates an RP application through the backend API", async () => {
		const workspaceUuid = "workspace-uuid-1";
		const applicationUuid = "application-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					applicationInformationId: 14,
					canadaLoginEnvironment: "staging",
					createdAt: "2026-04-02T00:00:00Z",
					createdBy: 1,
					dnrAppName: "[DEPT] - Portal",
					ibmSvApplicationId: "ibm-app-1",
					id: 1,
					isDeleted: false,
					status: "active",
					uuid: applicationUuid,
					workspaceId: 10,
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await updateRPApplication(workspaceUuid, applicationUuid, {
			requestedScopes: ["openid", "profile", "email"],
			serviceNameEn: "Portal Updated",
		});

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/applications/${applicationUuid}`,
			expect.objectContaining({
				body: JSON.stringify({
					requestedScopes: ["openid", "profile", "email"],
					serviceNameEn: "Portal Updated",
				}),
				credentials: "include",
				method: "PATCH",
			})
		);
		expect(response).toMatchObject({
			applicationInformationId: 14,
			canadaLoginEnvironment: "staging",
			ibmSvApplicationId: "ibm-app-1",
			dnrAppName: "[DEPT] - Portal",
			uuid: applicationUuid,
		});
	});

	it("gets an accessible RP application through the backend API", async () => {
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

		const response = await getAccessibleRPApplication(applicationUuid);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/rp-applications/accessible/${applicationUuid}`,
			expect.objectContaining({
				credentials: "include",
				method: "GET",
			})
		);
		expect(response.uuid).toBe(applicationUuid);
	});

	it("lists accessible RP applications through the backend API", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve([
					{
						dnrAppName: "Benefits Portal",
						role: "rp_admin",
						uuid: "application-uuid-1",
						workspaceUuid: "workspace-uuid-1",
					},
				]),
			ok: true,
			status: 200,
		} as Response);

		const response = await getAccessibleRPApplications();

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/rp-applications/accessible",
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
		expect(response).toHaveLength(1);
	});

	it("gets a workspace-scoped RP application through the backend API", async () => {
		const workspaceUuid = "workspace-uuid-1";
		const applicationUuid = "application-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					createdAt: "2026-04-02T00:00:00Z",
					createdBy: 1,
					dnrAppName: "Benefits Portal",
					ibmSvApplicationId: "ibm-app-1",
					id: 1,
					isDeleted: false,
					status: "active",
					uuid: applicationUuid,
					workspaceId: 10,
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
			dnrAppName: "Benefits Portal",
			ibmSvApplicationId: "ibm-app-1",
			uuid: applicationUuid,
		});
	});

	it("gets an accessible RP application department through the backend API", async () => {
		const applicationUuid = "application-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					departmentId: null,
					dnrAppName: "Benefits Portal",
					id: 9,
					uuid: applicationUuid,
				}),
			ok: true,
			status: 200,
		} as Response);

		await getAccessibleRPApplicationDepartment(applicationUuid);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/rp-applications/accessible/${applicationUuid}/department`,
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
	});

	it("assigns an accessible RP application department through the backend API", async () => {
		const applicationUuid = "application-uuid-1";
		const departmentUuid = "department-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					departmentId: 3,
					dnrAppName: "Benefits Portal",
					id: 9,
					uuid: applicationUuid,
				}),
			ok: true,
			status: 200,
		} as Response);

		await assignAccessibleRPApplicationDepartment(applicationUuid, {
			departmentUuid,
		});

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/rp-applications/accessible/${applicationUuid}/department`,
			expect.objectContaining({
				body: JSON.stringify({ departmentUuid }),
				credentials: "include",
				method: "PATCH",
			})
		);
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

	it("gets accessible RP application client credentials through the backend API", async () => {
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

		const response =
			await getAccessibleRPApplicationClientCredentials(applicationUuid);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/rp-applications/accessible/${applicationUuid}/client`,
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
		expect(response.clientId).toBe("client-id-123");
	});

	it("lists accessible rotated client secrets through the backend API", async () => {
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

		const response =
			await getAccessibleRPApplicationRotatedClientSecrets(applicationUuid);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/rp-applications/accessible/${applicationUuid}/client/rotated-secrets`,
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
		expect(response[0]?.secretId).toBe("/rotatedSecrets/0");
		expect(response[0]?.path).toBe("/rotatedSecrets/0");
	});

	it("creates an accessible rotated client secret through the backend API", async () => {
		const applicationUuid = "application-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve([]),
			ok: true,
			status: 200,
		} as Response);

		await createAccessibleRPApplicationRotatedClientSecret(applicationUuid, {
			description: "April rotation",
			rotatedSecretExpiredAt: 1775692800,
		});

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/rp-applications/accessible/${applicationUuid}/client/rotated-secrets`,
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

	it("deletes an accessible rotated client secret through the backend API", async () => {
		const applicationUuid = "application-uuid-1";
		const secretId = "/rotatedSecrets/0";
		const rawSecret = "super-secret-value-that-must-not-be-sent";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve({ message: "Rotated client secret deleted" }),
			ok: true,
			status: 200,
		} as Response);

		const response = await deleteAccessibleRPApplicationRotatedClientSecret(
			applicationUuid,
			secretId
		);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/rp-applications/accessible/${applicationUuid}/client/rotated-secrets`,
			expect.objectContaining({
				body: JSON.stringify({ secretId }),
				credentials: "include",
				method: "DELETE",
			})
		);
		expect(JSON.stringify(fetchMock.mock.calls)).not.toContain(rawSecret);
		expect(response["message"]).toBe("Rotated client secret deleted");
	});

	it("rotates the accessible RP application client secret through the backend API", async () => {
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

		const response =
			await rotateAccessibleRPApplicationClientSecret(applicationUuid);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/rp-applications/accessible/${applicationUuid}/client/rotate-secret`,
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

	it("sends a named rotation payload for accessible client secret rotation", async () => {
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

		await rotateAccessibleRPApplicationClientSecret(applicationUuid, {
			deleteRotatedSecrets: true,
			description: "April rotation",
			rotatedSecretExpiredAt: 1775692800,
		});

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/rp-applications/accessible/${applicationUuid}/client/rotate-secret`,
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
