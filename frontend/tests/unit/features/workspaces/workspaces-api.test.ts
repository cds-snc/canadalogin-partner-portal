import { afterEach, describe, expect, it, vi } from "vitest";
import {
	addWorkspaceMember,
	createWorkspace,
	deleteWorkspace,
	getCurrentUserWorkspaces,
	getWorkspaceMembers,
	getWorkspace,
	getWorkspaces,
	removeWorkspaceMember,
	searchUsers,
	updateWorkspaceMember,
	updateWorkspace,
} from "@/fetch/workspaces";

describe("workspaces-api", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("lists workspaces through the backend API", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve([
					{
						createdAt: "2026-07-30T12:00:00Z",
						createdBy: 42,
						departmentId: 7,
						description: "Primary workspace",
						id: 9,
						isDeleted: false,
						name: "Benefits Workspace",
						slug: "benefits-workspace",
						updatedAt: null,
						uuid: "workspace-uuid-1",
					},
				]),
			ok: true,
			status: 200,
		} as Response);

		const response = await getWorkspaces();

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/workspaces",
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
		expect(response[0]).toMatchObject({
			departmentId: 7,
			name: "Benefits Workspace",
			uuid: "workspace-uuid-1",
		});
	});

	it("lists current-user workspaces through the backend API", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve([
					{
						createdAt: "2026-07-30T12:00:00Z",
						createdBy: 42,
						departmentId: 7,
						description: "Primary workspace",
						id: 9,
						isDeleted: false,
						name: "Benefits Workspace",
						slug: "benefits-workspace",
						updatedAt: null,
						uuid: "workspace-uuid-1",
					},
				]),
			ok: true,
			status: 200,
		} as Response);

		const response = await getCurrentUserWorkspaces();

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/workspaces/mine",
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
		expect(response[0]?.uuid).toBe("workspace-uuid-1");
	});

	it("gets a workspace through the backend API", async () => {
		const workspaceUuid = "workspace-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					createdAt: "2026-07-30T12:00:00Z",
					createdBy: 42,
					departmentId: 7,
					description: "Primary workspace",
					id: 9,
					isDeleted: false,
					name: "Benefits Workspace",
					slug: "benefits-workspace",
					updatedAt: null,
					uuid: workspaceUuid,
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await getWorkspace(workspaceUuid);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/workspaces/${workspaceUuid}`,
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
		expect(response.slug).toBe("benefits-workspace");
	});

	it("creates a workspace through the backend API", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					createdAt: "2026-07-30T12:00:00Z",
					createdBy: 42,
					departmentId: 7,
					description: "Primary workspace",
					id: 9,
					isDeleted: false,
					name: "Benefits Workspace",
					slug: "benefits-workspace",
					updatedAt: null,
					uuid: "workspace-uuid-1",
				}),
			ok: true,
			status: 201,
		} as Response);

		const response = await createWorkspace({
			departmentUuid: "department-uuid-1",
			description: "Primary workspace",
			name: "Benefits Workspace",
			slug: "benefits-workspace",
		});

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/workspaces",
			expect.objectContaining({
				body: JSON.stringify({
					departmentUuid: "department-uuid-1",
					description: "Primary workspace",
					name: "Benefits Workspace",
					slug: "benefits-workspace",
				}),
				credentials: "include",
				method: "POST",
			})
		);
		expect(response.uuid).toBe("workspace-uuid-1");
	});

	it("updates a workspace through the backend API", async () => {
		const workspaceUuid = "workspace-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					createdAt: "2026-07-30T12:00:00Z",
					createdBy: 42,
					departmentId: 7,
					description: "Updated description",
					id: 9,
					isDeleted: false,
					name: "Renamed Workspace",
					slug: "renamed-workspace",
					updatedAt: "2026-07-30T12:15:00Z",
					uuid: workspaceUuid,
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await updateWorkspace(workspaceUuid, {
			description: "Updated description",
			name: "Renamed Workspace",
			slug: "renamed-workspace",
		});

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/workspaces/${workspaceUuid}`,
			expect.objectContaining({
				body: JSON.stringify({
					description: "Updated description",
					name: "Renamed Workspace",
					slug: "renamed-workspace",
				}),
				credentials: "include",
				method: "PATCH",
			})
		);
		expect(response.name).toBe("Renamed Workspace");
	});

	it("deletes a workspace through the backend API", async () => {
		const workspaceUuid = "workspace-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve({ message: "Workspace deleted" }),
			ok: true,
			status: 200,
		} as Response);

		const response = await deleteWorkspace(workspaceUuid);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/workspaces/${workspaceUuid}`,
			expect.objectContaining({
				credentials: "include",
				method: "DELETE",
			})
		);
		expect(response["message"]).toBe("Workspace deleted");
	});

	it("lists workspace members through the backend API", async () => {
		const workspaceUuid = "workspace-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve([
					{
						createdAt: "2026-07-30T14:00:00Z",
						deletedAt: null,
						id: 12,
						isDeleted: false,
						role: "workspace_member",
						userEmail: "member@example.gc.ca",
						userId: 99,
						userName: "Member User",
						userUuid: "user-uuid-1",
						uuid: "membership-uuid-1",
						workspaceId: 9,
					},
				]),
			ok: true,
			status: 200,
		} as Response);

		const response = await getWorkspaceMembers(workspaceUuid);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/members`,
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
		expect(response[0]?.userEmail).toBe("member@example.gc.ca");
	});

	it("adds a workspace member through the backend API", async () => {
		const workspaceUuid = "workspace-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					createdAt: "2026-07-30T14:00:00Z",
					deletedAt: null,
					id: 12,
					isDeleted: false,
					role: "workspace_member",
					userEmail: "member@example.gc.ca",
					userId: 99,
					userName: "Member User",
					userUuid: "user-uuid-1",
					uuid: "membership-uuid-1",
					workspaceId: 9,
				}),
			ok: true,
			status: 201,
		} as Response);

		const response = await addWorkspaceMember(workspaceUuid, {
			role: "workspace_member",
			userUuid: "user-uuid-1",
		});

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/members`,
			expect.objectContaining({
				body: JSON.stringify({
					role: "workspace_member",
					userUuid: "user-uuid-1",
				}),
				credentials: "include",
				method: "POST",
			})
		);
		expect(response.role).toBe("workspace_member");
	});

	it("updates a workspace member through the backend API", async () => {
		const workspaceUuid = "workspace-uuid-1";
		const userUuid = "user-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					createdAt: "2026-07-30T14:00:00Z",
					deletedAt: null,
					id: 12,
					isDeleted: false,
					role: "workspace_admin",
					userEmail: "member@example.gc.ca",
					userId: 99,
					userName: "Member User",
					userUuid,
					uuid: "membership-uuid-1",
					workspaceId: 9,
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await updateWorkspaceMember(workspaceUuid, userUuid, {
			role: "workspace_admin",
		});

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/members/${userUuid}`,
			expect.objectContaining({
				body: JSON.stringify({ role: "workspace_admin" }),
				credentials: "include",
				method: "PATCH",
			})
		);
		expect(response.role).toBe("workspace_admin");
	});

	it("removes a workspace member through the backend API", async () => {
		const workspaceUuid = "workspace-uuid-1";
		const userUuid = "user-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve({ message: "Workspace member removed" }),
			ok: true,
			status: 200,
		} as Response);

		const response = await removeWorkspaceMember(workspaceUuid, userUuid);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/members/${userUuid}`,
			expect.objectContaining({
				credentials: "include",
				method: "DELETE",
			})
		);
		expect(response["message"]).toBe("Workspace member removed");
	});
});


	it("searches workspace candidates through the backend API", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve([
					{
						email: "candidate@example.gc.ca",
						name: "Candidate User",
						uuid: "user-uuid-2",
					},
				]),
			ok: true,
			status: 200,
		} as Response);

		const response = await searchUsers("candidate", "workspace-uuid-1");

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/users/search?q=candidate&workspace_uuid=workspace-uuid-1",
			expect.objectContaining({
				credentials: "include",
				method: "GET",
			})
		);
		expect(response[0]?.uuid).toBe("user-uuid-2");
	});
