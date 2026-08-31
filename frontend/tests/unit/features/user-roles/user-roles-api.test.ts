import { afterEach, describe, expect, it, vi } from "vitest";
import { UnauthorizedRequestError } from "@/fetch";
import { addRoleToUser, getUserRole, removeRoleFromUser } from "@/fetch/user-roles";

describe("user-roles-api", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("loads the assigned role for a user", async () => {
		const userUuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b102";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			json: () => Promise.resolve({
				created_at: "2026-03-17T00:00:00Z",
				description: "Administrator role",
				name: "admin",
				uuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b301",
			}),
			ok: true,
			status: 200,
		} as Response);

		const response = await getUserRole(userUuid);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/user/${userUuid}/role`,
			expect.objectContaining({
				credentials: "include",
				method: "GET",
			}),
		);
		expect(response).toMatchObject({
			name: "admin",
			uuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b301",
		});
	});

	it("adds a role to a user", async () => {
		const userUuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b102";
		const roleUuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b301";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve({ message: "Role added to user" }),
			ok: true,
			status: 200,
		} as Response);

		const response = await addRoleToUser(userUuid, roleUuid);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/user/${userUuid}/roles/${roleUuid}`,
			expect.objectContaining({
				credentials: "include",
				method: "POST",
			}),
		);
		expect(response).toMatchObject({ message: "Role added to user" });
	});

	it("removes a role from a user", async () => {
		const userUuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b102";
		const roleUuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b301";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve({ message: "Role removed from user" }),
			ok: true,
			status: 200,
		} as Response);

		const response = await removeRoleFromUser(userUuid, roleUuid);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/user/${userUuid}/roles/${roleUuid}`,
			expect.objectContaining({
				credentials: "include",
				method: "DELETE",
			}),
		);
		expect(response).toMatchObject({ message: "Role removed from user" });
	});

	it("throws an unauthorized error when the backend session has expired", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue({
			ok: false,
			status: 401,
		} as Response);

		await expect(getUserRole("018f6f83-0f2b-7b0f-b2fb-96c4d8a4b102")).rejects.toBeInstanceOf(UnauthorizedRequestError);
	});
});