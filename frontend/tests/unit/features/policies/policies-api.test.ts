import { afterEach, describe, expect, it, vi } from "vitest";
import { UnauthorizedRequestError } from "@/fetch";
import { createPolicy, deletePolicy, getPolicies, updatePolicy } from "@/fetch/policies";

describe("policies-api", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("requests the backend policies list with pagination parameters", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			json: () => Promise.resolve({
				data: [{ action: "read", resource: "roles", subject: "analyst", uuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b501" }],
				"has_more": false,
				"items_per_page": 10,
				page: 1,
				"total_count": 1,
			}),
			ok: true,
		} as Response);

		const response = await getPolicies();

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/policies?items_per_page=10&page=1",
			expect.objectContaining({
				credentials: "include",
				method: "GET",
			}),
		);
		expect(response).toMatchObject({
			data: [{ action: "read", resource: "roles", subject: "analyst", uuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b501" }],
		});
	});

	it("creates a policy through the backend API", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve({ action: "read", resource: "roles", subject: "analyst", uuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b501" }),
			ok: true,
			status: 201,
		} as Response);

		const response = await createPolicy({ action: "read", resource: "roles", subject: "analyst" });

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/policy",
			expect.objectContaining({
				body: JSON.stringify({ action: "read", resource: "roles", subject: "analyst" }),
				credentials: "include",
				method: "POST",
			}),
		);
		expect(response).toMatchObject({ action: "read", resource: "roles", subject: "analyst", uuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b501" });
	});

	it("updates a policy through the backend API", async () => {
		const policyUuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b501";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve({ message: "Policy updated" }),
			ok: true,
			status: 200,
		} as Response);

		const response = await updatePolicy(policyUuid, { action: "write" });

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/policy/${policyUuid}`,
			expect.objectContaining({
				body: JSON.stringify({ action: "write" }),
				credentials: "include",
				method: "PATCH",
			}),
		);
		expect(response).toMatchObject({ message: "Policy updated" });
	});

	it("deletes a policy through the backend API", async () => {
		const policyUuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b501";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve({ message: "Policy deleted" }),
			ok: true,
			status: 200,
		} as Response);

		const response = await deletePolicy(policyUuid);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/policy/${policyUuid}`,
			expect.objectContaining({
				credentials: "include",
				method: "DELETE",
			}),
		);
		expect(response).toMatchObject({ message: "Policy deleted" });
	});

	it("throws an unauthorized error when the backend session has expired", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue({
			ok: false,
			status: 401,
		} as Response);

		await expect(getPolicies()).rejects.toBeInstanceOf(UnauthorizedRequestError);
	});
});