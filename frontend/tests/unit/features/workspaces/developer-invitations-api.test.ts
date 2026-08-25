import { afterEach, describe, expect, it, vi } from "vitest";
import {
	acceptRPApplicationDeveloperInvitation,
	createWorkspaceDeveloperInvitation,
	createWorkspaceRPApplicationDeveloperInvitation,
	getWorkspaceDeveloperInvitation,
	getWorkspaceDeveloperInvitations,
	getWorkspaceRPApplicationDeveloperInvitations,
	reissueWorkspaceDeveloperInvitation,
	revokeWorkspaceDeveloperInvitation,
	type RPApplicationAccessGrantRead,
	type RPApplicationDeveloperInvitationRead,
} from "@/fetch/rp-application-developer-invitations";

const invitation = {
	acceptedAt: null,
	createdAt: "2026-08-10T12:00:00Z",
	delegatedByGrantUuid: null,
	invitedEmail: "invitee@example.gc.ca",
	inviteExpiresAt: "2026-08-20T12:00:00Z",
	replacedByInvitationUuid: null,
	revocationReason: null,
	role: "read_only",
	revokedAt: null,
	status: "pending",
	updatedAt: null,
	uuid: "018f6f83-0000-0000-0000-000000000801",
} satisfies RPApplicationDeveloperInvitationRead;

const accessGrant = {
	createdAt: "2026-08-10T12:15:00Z",
	role: "read_only",
	revokedAt: null,
	sourceInvitationUuid: invitation.uuid,
	status: "active",
	updatedAt: null,
	uuid: "018f6f83-0000-0000-0000-000000000901",
} satisfies RPApplicationAccessGrantRead;

describe("developer-invitations-api", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("consumes the minimal camelCase invitation list contract", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve([invitation]),
			ok: true,
			status: 200,
		} as Response);

		const response = await getWorkspaceRPApplicationDeveloperInvitations(
			"018f6f83-0000-0000-0000-000000000201",
			"018f6f83-0000-0000-0000-000000000701"
		);

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/applications/018f6f83-0000-0000-0000-000000000701/developer-invitations",
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
		expect(response).toEqual([invitation]);
		expect(response[0]).not.toHaveProperty("id");
		expect(response[0]).not.toHaveProperty("workspaceId");
		expect(response[0]).not.toHaveProperty("rpApplicationId");
		expect(response[0]).not.toHaveProperty("invitedBy");
	});

	it("lists workspace invitations without requiring an RP application", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve([invitation]),
			ok: true,
			status: 200,
		} as Response);

		const response = await getWorkspaceDeveloperInvitations("workspace/uuid");

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/workspaces/workspace%2Fuuid/invitations",
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
		expect(response).toEqual([invitation]);
	});

	it("loads one workspace invitation by its public UUID", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve(invitation),
			ok: true,
			status: 200,
		} as Response);

		const response = await getWorkspaceDeveloperInvitation(
			"workspace/uuid",
			"invitation/uuid"
		);

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/workspaces/workspace%2Fuuid/invitations/invitation%2Fuuid",
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
		expect(response).toEqual(invitation);
	});

	it("creates a workspace-owned invitation without an IBM or application field", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					...invitation,
					acceptanceUrl: "http://localhost:3000/invitations/example-token",
				}),
			ok: true,
			status: 201,
		} as Response);
		const payload = {
			inviteExpiresAt: "2026-08-20T12:00:00Z",
			invitedEmail: "invitee@example.gc.ca",
			role: "read_only" as const,
		};

		await createWorkspaceDeveloperInvitation("workspace-uuid", payload);

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/workspaces/workspace-uuid/invitations",
			expect.objectContaining({
				body: JSON.stringify(payload),
				credentials: "include",
				method: "POST",
			})
		);
		const body = JSON.parse(
			String(fetchMock.mock.calls[0]?.[1]?.body)
		) as Record<string, unknown>;
		expect(body).not.toHaveProperty("rpApplicationUuid");
		expect(body).not.toHaveProperty("ibmApplicationId");
	});

	it("revokes a workspace-owned invitation", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve({ ...invitation, status: "revoked" }),
			ok: true,
			status: 200,
		} as Response);

		await revokeWorkspaceDeveloperInvitation("workspace-uuid", "invite/uuid");

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/workspaces/workspace-uuid/invitations/invite%2Fuuid/revoke",
			expect.objectContaining({
				credentials: "include",
				method: "POST",
			})
		);
	});

	it("reissues a workspace-owned invitation with only a new expiry", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					...invitation,
					acceptanceUrl: "http://localhost:3000/invitations/new-token",
				}),
			ok: true,
			status: 200,
		} as Response);
		const payload = { inviteExpiresAt: "2026-08-27T12:00:00Z" };

		await reissueWorkspaceDeveloperInvitation(
			"workspace-uuid",
			"invite/uuid",
			payload
		);

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/workspaces/workspace-uuid/invitations/invite%2Fuuid/reissue",
			expect.objectContaining({
				body: JSON.stringify(payload),
				credentials: "include",
				method: "POST",
			})
		);
	});

	it("sends only public invitation fields when creating an invitation", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					...invitation,
					acceptanceUrl: "http://localhost:3000/invitations/example-token",
				}),
			ok: true,
			status: 201,
		} as Response);

		await createWorkspaceRPApplicationDeveloperInvitation(
			"018f6f83-0000-0000-0000-000000000201",
			"018f6f83-0000-0000-0000-000000000701",
			{
				inviteExpiresAt: "2026-08-20T12:00:00Z",
				invitedEmail: "invitee@example.gc.ca",
				role: "read_only",
			}
		);

		const request = fetchMock.mock.calls[0]?.[1];
		const body = JSON.parse(String(request?.body)) as Record<string, unknown>;
		expect(body).toEqual({
			inviteExpiresAt: "2026-08-20T12:00:00Z",
			invitedEmail: "invitee@example.gc.ca",
			role: "read_only",
		});
		expect(body).not.toHaveProperty("gcNotifyNotificationId");
	});

	it("consumes public UUID invitation and grant projections after acceptance", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					accessGrant,
					invitation: {
						...invitation,
						acceptedAt: "2026-08-10T12:15:00Z",
						status: "accepted",
						updatedAt: "2026-08-10T12:15:00Z",
					},
					nextDestination: "/workspaces/018f6f83-0000-0000-0000-000000000201",
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await acceptRPApplicationDeveloperInvitation("token-123");

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/rp-application-developer-invitations/accept",
			expect.objectContaining({
				body: JSON.stringify({ token: "token-123" }),
				credentials: "include",
				method: "POST",
			})
		);
		expect(response.accessGrant.uuid).toBe(accessGrant.uuid);
		expect(response.nextDestination).toBe(
			"/workspaces/018f6f83-0000-0000-0000-000000000201"
		);
		expect(response.accessGrant).not.toHaveProperty("id");
		expect(response.accessGrant).not.toHaveProperty("userId");
		expect(response.accessGrant).not.toHaveProperty("workspaceId");
	});
});
