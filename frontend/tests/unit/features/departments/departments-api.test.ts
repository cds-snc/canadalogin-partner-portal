import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDepartments } from "@/fetch/departments";

describe("departments-api", () => {
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		vi.unstubAllEnvs();
		vi.stubEnv("VITE_API_BASE_URL", "http://localhost:8000");
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		vi.restoreAllMocks();
	});

	it("requests the backend departments list with pagination parameters", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			json: () =>
				Promise.resolve({
					data: [
						{
							uuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b501",
							name: "Engineering",
							created_at: "2026-03-23T00:00:00Z",
						},
					],
					has_more: false,
					items_per_page: 20,
					page: 2,
					total_count: 1,
				}),
			ok: true,
		} as Response) as typeof fetch;

		const response = await getDepartments(2, 20);

		expect(globalThis.fetch).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/departments?items_per_page=20&page=2",
			expect.objectContaining({
				credentials: "include",
				method: "GET",
			})
		);
		expect(response.data[0]).toMatchObject({
			name: "Engineering",
			uuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b501",
		});
	});
});
