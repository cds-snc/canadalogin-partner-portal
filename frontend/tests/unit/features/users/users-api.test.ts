import { afterEach, describe, expect, it, vi } from "vitest";
import { UnauthorizedRequestError } from "@/fetch";
import { createUser, deleteUser, getUsers, updateUser } from "@/fetch/users";

describe("users-api", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("requests the backend users list with pagination parameters", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
				json: () => Promise.resolve({
					data: [{ roleUuids: ["018f6f83-0f2b-7b0f-b2fb-96c4d8a4b301"], tierUuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b401", uuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b101" }],
					"has_more": false,
					"items_per_page": 20,
					page: 2,
					"total_count": 1,
				}),
			ok: true,
		} as Response);

		const response = await getUsers(2, 20);

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/users?items_per_page=20&page=2",
			expect.objectContaining({
				credentials: "include",
				method: "GET",
			}),
		);
		expect(response).toMatchObject({
			data: [{ roleUuids: ["018f6f83-0f2b-7b0f-b2fb-96c4d8a4b301"], tierUuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b401", uuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b101" }],
			"has_more": false,
			"items_per_page": 20,
			page: 2,
			"total_count": 1,
		});
	});

	it("throws an unauthorized error when the backend session has expired", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue({
			ok: false,
			status: 401,
		} as Response);

		await expect(getUsers()).rejects.toBeInstanceOf(UnauthorizedRequestError);
	});

	it("creates a user through the backend API", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve({
				email: "jane@example.com",
				name: "Jane Doe",
				profileImageUrl: "",
				roleUuids: [],
				tierUuid: null,
				uuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b102",
			}),
			ok: true,
			status: 201,
		} as Response);

		const response = await createUser({
			email: "jane@example.com",
			name: "Jane Doe",
		});

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/user",
			expect.objectContaining({
				body: JSON.stringify({
					email: "jane@example.com",
					name: "Jane Doe",
				}),
				credentials: "include",
				method: "POST",
			}),
		);
		expect(response).toMatchObject({
			email: "jane@example.com",
			name: "Jane Doe",
			uuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b102",
		});
	});

	it("updates a user through the backend API", async () => {
		const userUuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b102";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve({ message: "User updated successfully" }),
			ok: true,
			status: 200,
		} as Response);

		const response = await updateUser(userUuid, {
			email: "updated@example.com",
			name: "Jane Updated",
		});

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/user/${userUuid}`,
			expect.objectContaining({
				body: JSON.stringify({
					email: "updated@example.com",
					name: "Jane Updated",
				}),
				credentials: "include",
				method: "PATCH",
			}),
		);
		expect(response).toMatchObject({ message: "User updated successfully" });
	});

	it("deletes a user through the backend API", async () => {
		const userUuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b102";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve({ message: "User deleted successfully" }),
			ok: true,
			status: 200,
		} as Response);

		const response = await deleteUser(userUuid);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/user/${userUuid}`,
			expect.objectContaining({
				credentials: "include",
				method: "DELETE",
			}),
		);
		expect(response).toMatchObject({ message: "User deleted successfully" });
	});
});