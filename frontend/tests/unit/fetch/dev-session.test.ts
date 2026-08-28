import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	clearDevSession,
	getDevSession,
	selectDevSessionFixture,
	type DevSessionRead,
} from "@/fetch/dev-session";
import { ServerRequestError } from "@/fetch/errors";

const devSessionFixture: DevSessionRead = {
	currentFixtureId: null,
	enabled: true,
	fixtures: [
		{
			email: "local-rp-admin@local.example",
			fixtureId: "local-rp-admin",
			globalRole: null,
			name: "Local RP Admin",
			partnerAccess: [
				{
					role: "rp_admin",
					workspaceName: "Workspace Alpha",
					workspaceUuid: "workspace-alpha-uuid",
				},
			],
		},
	],
};

const jsonResponse = (body: unknown, status = 200): Response =>
	new Response(JSON.stringify(body), {
		headers: { "content-type": "application/json" },
		status,
	});

describe("dev session fetch helpers", () => {
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		vi.stubEnv("VITE_API_BASE_URL", "http://localhost:8000");
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	it("returns the backend-owned fixture allowlist", async () => {
		globalThis.fetch = vi
			.fn()
			.mockResolvedValue(jsonResponse(devSessionFixture));

		await expect(getDevSession()).resolves.toEqual(devSessionFixture);
		expect(globalThis.fetch).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/dev/session",
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
	});

	it("treats a missing non-local route as an unavailable feature", async () => {
		globalThis.fetch = vi
			.fn()
			.mockResolvedValue(jsonResponse({ detail: "Not Found" }, 404));

		await expect(getDevSession()).resolves.toBeNull();
	});

	it("does not hide unexpected endpoint failures as non-local mode", async () => {
		globalThis.fetch = vi
			.fn()
			.mockResolvedValue(jsonResponse({ detail: "Unavailable" }, 503));

		await expect(getDevSession()).rejects.toBeInstanceOf(ServerRequestError);
	});

	it("submits only the selected fixture identifier", async () => {
		globalThis.fetch = vi
			.fn()
			.mockResolvedValue(new Response(null, { status: 204 }));

		await selectDevSessionFixture("local-rp-admin");

		expect(globalThis.fetch).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/dev/session",
			expect.objectContaining({
				body: JSON.stringify({ fixtureId: "local-rp-admin" }),
				credentials: "include",
				method: "POST",
			})
		);
		expect(
			JSON.parse(vi.mocked(globalThis.fetch).mock.calls[0]?.[1]?.body as string)
		).not.toHaveProperty("role");
	});

	it("clears the simulated backend session", async () => {
		globalThis.fetch = vi
			.fn()
			.mockResolvedValue(new Response(null, { status: 204 }));

		await clearDevSession();

		expect(globalThis.fetch).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/dev/session",
			expect.objectContaining({
				credentials: "include",
				method: "DELETE",
			})
		);
	});
});
