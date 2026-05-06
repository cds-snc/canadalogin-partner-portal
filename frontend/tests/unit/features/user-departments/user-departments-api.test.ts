import { afterEach, describe, expect, it, vi } from "vitest";
import { UnauthorizedRequestError } from "@/fetch";
import { getUserDepartment, updateUserDepartment } from "@/fetch/user-departments";

describe("user-departments-api", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("loads the assigned department for a user", async () => {
		const userUuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b102";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			json: () => Promise.resolve({
				created_at: "2026-03-23T00:00:00Z",
				name: "Engineering",
				uuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b501",
			}),
			ok: true,
			status: 200,
		} as Response);

		const response = await getUserDepartment(userUuid);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/user/${userUuid}/department`,
			expect.objectContaining({
				credentials: "include",
				method: "GET",
			}),
		);
		expect(response).toMatchObject({
			name: "Engineering",
			uuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b501",
		});
	});

	it("updates the assigned department for a user", async () => {
		const userUuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b102";
		const departmentAbbreviation = "AAFC";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve({ message: "Department updated successfully" }),
			ok: true,
			status: 200,
		} as Response);

		const response = await updateUserDepartment(userUuid, { departmentAbbreviation: departmentAbbreviation });

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/user/${userUuid}/department`,
			expect.objectContaining({
				body: JSON.stringify({ departmentAbbreviation: departmentAbbreviation }),
				credentials: "include",
				method: "PATCH",
			}),
		);
		expect(response).toMatchObject({ message: "Department updated successfully" });
	});

	it("throws an unauthorized error when the backend session has expired", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue({
			ok: false,
			status: 401,
		} as Response);

		await expect(getUserDepartment("018f6f83-0f2b-7b0f-b2fb-96c4d8a4b102")).rejects.toBeInstanceOf(UnauthorizedRequestError);
	});
});