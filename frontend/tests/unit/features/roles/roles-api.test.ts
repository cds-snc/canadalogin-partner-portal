import { afterEach, describe, expect, it, vi } from "vitest";
import { UnauthorizedRequestError } from "@/fetch";
import { createRole, deleteRole, getRoles, updateRole } from "@/fetch/roles";

describe("roles-api", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("requests the backend roles list with pagination parameters", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			json: () => Promise.resolve({
				data: [{ created_at: "2026-03-17T00:00:00Z", name: "admin", uuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b301" }],
				"has_more": false,
				"items_per_page": 10,
				page: 1,
				"total_count": 1,
			}),
			ok: true,
		} as Response);

		const response = await getRoles();

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/roles?items_per_page=10&page=1",
			expect.objectContaining({
				credentials: "include",
				method: "GET",
			}),
		);
		expect(response).toMatchObject({
			data: [{ name: "admin", uuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b301" }],
		});
	});

	it("creates a role through the backend API", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve({
				created_at: "2026-03-17T00:00:00Z",
				description: "Administrator role",
				name: "admin",
				uuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b301",
			}),
			ok: true,
			status: 201,
		} as Response);

		const response = await createRole({
			description: "Administrator role",
			name: "admin",
		});

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/role",
			expect.objectContaining({
				body: JSON.stringify({
					description: "Administrator role",
					name: "admin",
				}),
				credentials: "include",
				method: "POST",
			}),
		);
		expect(response).toMatchObject({
			description: "Administrator role",
			name: "admin",
			uuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b301",
		});
	});

	it("updates a role through the backend API", async () => {
		const roleUuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b301";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve({ message: "Role updated successfully" }),
			ok: true,
			status: 200,
		} as Response);

		const response = await updateRole(roleUuid, {
			description: "Updated administrator role",
			name: "super-admin",
		});

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/role/${roleUuid}`,
			expect.objectContaining({
				body: JSON.stringify({
					description: "Updated administrator role",
					name: "super-admin",
				}),
				credentials: "include",
				method: "PATCH",
			}),
		);
		expect(response).toMatchObject({ message: "Role updated successfully" });
	});

	it("deletes a role through the backend API", async () => {
		const roleUuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b301";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve({ message: "Role deleted successfully" }),
			ok: true,
			status: 200,
		} as Response);

		const response = await deleteRole(roleUuid);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/role/${roleUuid}`,
			expect.objectContaining({
				credentials: "include",
				method: "DELETE",
			}),
		);
		expect(response).toMatchObject({ message: "Role deleted successfully" });
	});

	it("throws an unauthorized error when the backend session has expired", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue({
			ok: false,
			status: 401,
		} as Response);

		await expect(getRoles()).rejects.toBeInstanceOf(UnauthorizedRequestError);
	});
});