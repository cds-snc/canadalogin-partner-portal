import { afterEach, describe, expect, it, vi } from "vitest";
import {
	acceptRPApplicationDeveloperInvitation,
	deleteRPApplication,
	getCurrentUserRPApplication,
	getRPApplicationDeveloperInvitations,
	inviteRPApplicationDeveloper,
	getRPApplicationUsageAuditTrail,
	getRPApplicationUsageAuditTrailSearchAfter,
	getRPApplicationUsageSummary,
	getRPApplicationClientCredentials,
	resendRPApplicationDeveloperInvitation,
	revokeRPApplicationDeveloperInvitation,
	rotateRPApplicationClientSecret,
	updateCurrentUserRPApplication,
	updateRPApplication,
} from "@/fetch/workspaces";

describe("workspaces-api", () => {
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

	it("accepts an RP application developer invitation through the backend API", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					accepted_at: "2026-04-22T00:00:00Z",
					created_at: "2026-04-21T00:00:00Z",
					gc_notify_notification_id: "notify-123",
					id: 4,
					invited_email: "developer@example.com",
					rp_application_id: 9,
					role: "developer",
					uuid: "invitation-uuid-1",
					workspace_id: 42,
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await acceptRPApplicationDeveloperInvitation(
			"raw-invite-token"
		);

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/rp-application-developer-invitations/accept",
			expect.objectContaining({
				body: JSON.stringify({ token: "raw-invite-token" }),
				credentials: "include",
				method: "POST",
			})
		);
		expect(response.invited_email).toBe("developer@example.com");
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
					workspaceName: "Health Workspace",
					workspaceUuid: "workspace-uuid-1",
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
		expect(response.workspaceName).toBe("Health Workspace");
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
					workspaceName: "Health Workspace",
					workspaceUuid: "workspace-uuid-1",
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

	it("invites an RP application developer through the backend API", async () => {
		const workspaceUuid = "workspace-uuid-1";
		const applicationUuid = "application-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					created_at: "2026-04-21T00:00:00Z",
					gc_notify_notification_id: "notify-123",
					id: 4,
					invited_email: "developer@example.com",
					rp_application_id: 9,
					role: "developer",
					uuid: "invitation-uuid-1",
					workspace_id: 42,
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await inviteRPApplicationDeveloper(
			workspaceUuid,
			applicationUuid,
			"developer@example.com"
		);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/applications/${applicationUuid}/developers/invite`,
			expect.objectContaining({
				body: JSON.stringify({ email: "developer@example.com" }),
				credentials: "include",
				method: "POST",
			})
		);
		expect(response.invited_email).toBe("developer@example.com");
	});

	it("lists RP application developer invitations through the backend API", async () => {
		const workspaceUuid = "workspace-uuid-1";
		const applicationUuid = "application-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve([
					{
						createdAt: "2026-04-21T00:00:00Z",
						id: 4,
						invitedEmail: "developer@example.com",
						rpApplicationId: 9,
						status: "pending",
						uuid: "invitation-uuid-1",
						workspaceId: 42,
					},
				]),
			ok: true,
			status: 200,
		} as Response);

		const response = await getRPApplicationDeveloperInvitations(
			workspaceUuid,
			applicationUuid
		);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/applications/${applicationUuid}/developer-invitations`,
			expect.objectContaining({
				credentials: "include",
				method: "GET",
			})
		);
		expect(response).toHaveLength(1);
		expect(response[0]?.status).toBe("pending");
	});

	it("revokes an RP application developer invitation through the backend API", async () => {
		const workspaceUuid = "workspace-uuid-1";
		const applicationUuid = "application-uuid-1";
		const invitationUuid = "invitation-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					createdAt: "2026-04-21T00:00:00Z",
					id: 4,
					invitedEmail: "developer@example.com",
					rpApplicationId: 9,
					status: "revoked",
					uuid: invitationUuid,
					workspaceId: 42,
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await revokeRPApplicationDeveloperInvitation(
			workspaceUuid,
			applicationUuid,
			invitationUuid
		);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/applications/${applicationUuid}/developer-invitations/${invitationUuid}`,
			expect.objectContaining({
				credentials: "include",
				method: "DELETE",
			})
		);
		expect(response.status).toBe("revoked");
	});

	it("resends an RP application developer invitation through the backend API", async () => {
		const workspaceUuid = "workspace-uuid-1";
		const applicationUuid = "application-uuid-1";
		const invitationUuid = "invitation-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					createdAt: "2026-04-21T00:00:00Z",
					id: 5,
					invitedEmail: "developer@example.com",
					rpApplicationId: 9,
					status: "pending",
					uuid: "invitation-uuid-2",
					workspaceId: 42,
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await resendRPApplicationDeveloperInvitation(
			workspaceUuid,
			applicationUuid,
			invitationUuid
		);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/applications/${applicationUuid}/developer-invitations/${invitationUuid}/resend`,
			expect.objectContaining({
				credentials: "include",
				method: "POST",
			})
		);
		expect(response.status).toBe("pending");
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

	it("gets RP application client credentials through the backend API", async () => {
		const workspaceUuid = "workspace-uuid-1";
		const applicationUuid = "application-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					client_id: "client-id-123",
					client_secret: "top-secret-value",
					client_secret_id: "secret-1",
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await getRPApplicationClientCredentials(
			workspaceUuid,
			applicationUuid
		);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/applications/${applicationUuid}/client`,
			expect.objectContaining({
				credentials: "include",
				method: "GET",
			})
		);
		expect(response.client_id).toBe("client-id-123");
	});

	it("rotates an RP application client secret through the backend API", async () => {
		const workspaceUuid = "workspace-uuid-1";
		const applicationUuid = "application-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					client_id: "client-id-123",
					client_secret: "rotated-secret-value",
					client_secret_id: "secret-2",
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await rotateRPApplicationClientSecret(
			workspaceUuid,
			applicationUuid
		);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/applications/${applicationUuid}/client/rotate-secret`,
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
		expect(response.client_secret).toBe("rotated-secret-value");
	});

	it("sends a named rotation payload for RP application client secret rotation", async () => {
		const workspaceUuid = "workspace-uuid-1";
		const applicationUuid = "application-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					client_id: "client-id-123",
					client_secret: "rotated-secret-value",
					client_secret_id: "secret-2",
				}),
			ok: true,
			status: 200,
		} as Response);

		await rotateRPApplicationClientSecret(workspaceUuid, applicationUuid, {
			deleteRotatedSecrets: true,
			description: "April rotation",
			rotatedSecretExpiredAt: 1775692800,
		});

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/applications/${applicationUuid}/client/rotate-secret`,
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
