import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	acceptRPApplicationDeveloperInvitation,
	getCurrentUserRPApplication,
	getCurrentUserRPApplications,
	getWorkspaces,
} from "../../../../src/fetch/workspaces";

const fetchMock = vi.fn();

beforeEach(() => {
	fetchMock.mockReset();
	globalThis.fetch = fetchMock as typeof fetch;
});

describe("workspaces api", () => {
	it("loads workspaces", async () => {
		fetchMock.mockResolvedValueOnce(new Response(JSON.stringify([{ uuid: "1", name: "Demo", slug: "demo", departmentId: 1, description: null }]), { status: 200 }));
		await expect(getWorkspaces()).resolves.toHaveLength(1);
	});

	it("accepts invitations", async () => {
		fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ id: 1, uuid: "2", workspaceId: 3, rpApplicationId: 4, invitedEmail: "dev@example.com", role: "developer", status: "accepted" }), { status: 200 }));
		await expect(acceptRPApplicationDeveloperInvitation("token")).resolves.toMatchObject({ status: "accepted" });
	});

	it("loads current-user rp applications", async () => {
		fetchMock.mockResolvedValueOnce(new Response(JSON.stringify([{ id: 1, uuid: "2", name: "App", status: "active", workspaceName: "WS", workspaceUuid: "3" }]), { status: 200 }));
		await expect(getCurrentUserRPApplications()).resolves.toHaveLength(1);
	});

	it("loads a current-user rp application", async () => {
		fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ id: 1, uuid: "2", name: "App", status: "active", workspaceName: "WS", workspaceUuid: "3" }), { status: 200 }));
		await expect(getCurrentUserRPApplication("2")).resolves.toMatchObject({ name: "App" });
	});
});