import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ServerRequestError, getApiBaseUrl } from "@/fetch";
import { getCurrentUser, getOidcLoginUrl, logoutCurrentUser } from "@/fetch/auth";

const createUserFixture = (): Record<string, string | number> => ({
	uuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b102",
	name: "Jane Doe",
	username: "jdoe",
	email: "jane@example.com",
	"profileImageUrl": "https://example.com/avatar.png",
	"authProvider": "gc-sso",
	"authSubject": "subject-123",
	"roleUuid": "role-uuid-1",
	"tierUuid": "tier-uuid-2",
});

describe("fetch auth", () => {
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		vi.unstubAllEnvs();
		vi.stubEnv("VITE_API_BASE_URL", "http://localhost:8000");
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("returns the current user when the backend session is valid", async () => {
		const user = createUserFixture();

		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(user),
			headers: new Headers({ "content-type": "application/json" }),
		}) as typeof fetch;

		await expect(getCurrentUser()).resolves.toEqual(user);
		expect(globalThis.fetch).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/user/me/",
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			}),
		);
	});

	it("uses backend port 8000 when no backend origin is configured locally in tests", async () => {
		const user = createUserFixture();

		vi.stubEnv("VITE_API_BASE_URL", "");
		vi.stubGlobal("location", {
			hostname: "127.0.0.1",
			origin: "http://127.0.0.1:4174",
			protocol: "http:",
		} satisfies Pick<Location, "hostname" | "origin" | "protocol">);

		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(user),
			headers: new Headers({ "content-type": "application/json" }),
		}) as typeof fetch;

		await expect(getCurrentUser()).resolves.toEqual(user);
		expect(globalThis.fetch).toHaveBeenCalledWith(
			"http://127.0.0.1:8000/api/v1/user/me/",
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			}),
		);
	});

	it("returns null when the backend says the user is unauthenticated", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 401,
			json: () => Promise.resolve({ detail: "Unauthorized" }),
			headers: new Headers({ "content-type": "application/json" }),
		}) as typeof fetch;

		await expect(getCurrentUser()).resolves.toBeNull();
	});

	it("throws shared request errors for non-401 failures", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 503,
			json: () => Promise.resolve({ detail: "Backend offline" }),
			headers: new Headers({ "content-type": "application/json" }),
		}) as typeof fetch;

		await expect(getCurrentUser()).rejects.toBeInstanceOf(ServerRequestError);
	});

	it("posts to logout with credentials included", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 204 }) as typeof fetch;

		await logoutCurrentUser();

		expect(globalThis.fetch).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/logout",
			expect.objectContaining({
				credentials: "include",
				method: "POST",
			}),
		);
	});

	it("derives the fallback backend origin from the current local hostname", () => {
		vi.stubEnv("VITE_API_BASE_URL", "");
		vi.stubGlobal("location", {
			hostname: "127.0.0.1",
			origin: "http://127.0.0.1:3000",
			protocol: "http:",
		} satisfies Pick<Location, "hostname" | "origin" | "protocol">);

		expect(getApiBaseUrl()).toBe("http://127.0.0.1:8000");
	});

	it("normalizes a configured local backend origin to the current local hostname", () => {
		vi.stubEnv("VITE_API_BASE_URL", "http://localhost:8000");
		vi.stubGlobal("location", {
			hostname: "127.0.0.1",
			origin: "http://127.0.0.1:4173",
			protocol: "http:",
		} satisfies Pick<Location, "hostname" | "origin" | "protocol">);

		expect(getApiBaseUrl()).toBe("http://127.0.0.1:8000");
	});

	it("builds the backend OIDC login URL from the configured origin", () => {
		expect(getOidcLoginUrl()).toBe("http://localhost:8000/api/v1/auth/oidc/login");
	});
});