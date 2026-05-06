import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getHealthCheck, getReadyCheck } from "@/fetch/system";

describe("system-api", () => {
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		vi.unstubAllEnvs();
		vi.stubEnv("VITE_API_BASE_URL", "http://localhost:8000");
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		vi.restoreAllMocks();
	});

	it("fetches the health check from the backend", async () => {
		const healthPayload = {
			status: "ok",
			environment: "development",
			version: "0.1.0",
			timestamp: "2026-03-16T00:00:00Z",
		};

		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(healthPayload),
		}) as typeof fetch;

		await expect(getHealthCheck()).resolves.toEqual(healthPayload);
		expect(globalThis.fetch).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/health",
			expect.objectContaining({ method: "GET" }),
		);
	});

	it("fetches the ready check from the backend", async () => {
		const readyPayload = {
			status: "ok",
			environment: "development",
			version: "0.1.0",
			app: "ok",
			database: "ok",
			redis: "ok",
			timestamp: "2026-03-16T00:00:00Z",
		};

		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(readyPayload),
		}) as typeof fetch;

		await expect(getReadyCheck()).resolves.toEqual(readyPayload);
		expect(globalThis.fetch).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/ready",
			expect.objectContaining({ method: "GET" }),
		);
	});
});