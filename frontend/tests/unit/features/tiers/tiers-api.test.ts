import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	createTier,
	deleteTier,
	getTiers,
	updateTier,
} from "@/fetch/tiers";

describe("tiers-api", () => {
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		vi.unstubAllEnvs();
		vi.stubEnv("VITE_API_BASE_URL", "http://localhost:8000");
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		vi.restoreAllMocks();
	});

	it("requests the backend tiers list with pagination parameters", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			json: () => Promise.resolve({
				data: [{ uuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b401", name: "free", created_at: "2026-03-17T00:00:00Z" }],
				"has_more": false,
				"items_per_page": 20,
				page: 2,
				"total_count": 1,
			}),
			ok: true,
		} as Response) as typeof fetch;

		const response = await getTiers(2, 20);

		expect(globalThis.fetch).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/tiers?items_per_page=20&page=2",
			expect.objectContaining({
				credentials: "include",
				method: "GET",
			}),
		);
		expect(response.data[0]).toMatchObject({ name: "free", uuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b401" });
	});

	it("creates a tier through the backend write endpoint", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			json: () => Promise.resolve({ uuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b402", name: "enterprise", created_at: "2026-03-17T00:00:00Z" }),
			ok: true,
		} as Response) as typeof fetch;

		await createTier({ name: "enterprise" });

		expect(globalThis.fetch).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/tier",
			expect.objectContaining({
				body: JSON.stringify({ name: "enterprise" }),
				credentials: "include",
				method: "POST",
			}),
		);
	});

	it("updates a tier through the backend patch endpoint", async () => {
		const tierUuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b401";
		globalThis.fetch = vi.fn().mockResolvedValue({
			json: () => Promise.resolve({ message: "Tier updated" }),
			ok: true,
		} as Response) as typeof fetch;

		await updateTier(tierUuid, { name: "starter" });

		expect(globalThis.fetch).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/tier/${tierUuid}`,
			expect.objectContaining({
				body: JSON.stringify({ name: "starter" }),
				credentials: "include",
				method: "PATCH",
			}),
		);
	});

	it("deletes a tier through the backend erase endpoint", async () => {
		const tierUuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b401";
		globalThis.fetch = vi.fn().mockResolvedValue({
			json: () => Promise.resolve({ message: "Tier deleted" }),
			ok: true,
		} as Response) as typeof fetch;

		await deleteTier(tierUuid);

		expect(globalThis.fetch).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/tier/${tierUuid}`,
			expect.objectContaining({
				credentials: "include",
				method: "DELETE",
			}),
		);
	});
});