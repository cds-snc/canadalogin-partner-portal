import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAuditLogs } from "@/fetch/audit-logs";

describe("fetch audit logs", () => {
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		vi.stubEnv("VITE_API_BASE_URL", "http://localhost:8000");
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	it("sends the selected end date as the end of day upper bound", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () =>
				Promise.resolve({
					data: [],
					has_more: false,
					items_per_page: 10,
					page: 1,
					total_count: 0,
				}),
			headers: new Headers({ "content-type": "application/json" }),
		}) as typeof fetch;

		await getAuditLogs(1, 10, "2026-06-01", "2026-06-17");

		expect(globalThis.fetch).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/audit-logs?items_per_page=10&page=1&created_at_gte=2026-06-01T00%3A00%3A00.000&created_at_lte=2026-06-17T23%3A59%3A59.999",
			expect.objectContaining({
				cache: "no-store",
				method: "GET",
			}),
		);
	});

	it("preserves explicit datetime bounds without rewriting them", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () =>
				Promise.resolve({
					data: [],
					has_more: false,
					items_per_page: 10,
					page: 1,
					total_count: 0,
				}),
			headers: new Headers({ "content-type": "application/json" }),
		}) as typeof fetch;

		await getAuditLogs(
			1,
			10,
			"2026-06-01T08:00:00.000",
			"2026-06-17T17:30:00.000"
		);

		expect(globalThis.fetch).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/audit-logs?items_per_page=10&page=1&created_at_gte=2026-06-01T08%3A00%3A00.000&created_at_lte=2026-06-17T17%3A30%3A00.000",
			expect.objectContaining({
				cache: "no-store",
				method: "GET",
			}),
		);
	});
});