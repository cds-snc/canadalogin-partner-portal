import { afterEach, describe, expect, it, vi } from "vitest";
import {
	createWorkspace,
	deleteWorkspace,
	getCurrentUserWorkspaces,
	getWorkspace,
	getWorkspaces,
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
});
