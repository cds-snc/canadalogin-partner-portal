import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { markBackendActivity } from "@/lib/backend-activity";
import {
	BadRequestError,
	ForbiddenRequestError,
	ServerRequestError,
	UnauthorizedRequestError,
	requestJson,
} from "@/fetch";

vi.mock("@/lib/backend-activity", () => ({
	markBackendActivity: vi.fn(),
}));

describe("requestJson", () => {
	const originalFetch = globalThis.fetch;
	const originalLocation = globalThis.location;

	beforeEach(() => {
		vi.unstubAllEnvs();
		vi.stubEnv("VITE_API_BASE_URL", "http://localhost:8000");
		vi.mocked(markBackendActivity).mockReset();
		vi.stubGlobal("location", {
			href: "http://localhost:3000/dashboard",
			pathname: "/dashboard",
			replace: vi.fn(),
			search: "",
		} satisfies Pick<Location, "href" | "pathname" | "replace" | "search">);
		document.cookie = "csrftoken=test-token; path=/";
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		vi.unstubAllGlobals();
		document.cookie = "csrftoken=; Max-Age=0; path=/";
		if (originalLocation) {
			globalThis.location = originalLocation;
		}
		vi.restoreAllMocks();
	});

	it("throws a BadRequestError with backend payload details for 400 responses", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					error: {
						code: "bad_request",
						details: { field: "title" },
						message: "body.title: Field required",
						requestId: "request-400",
					},
				}),
			ok: false,
			status: 400,
		} as Response);

		await expect(
			requestJson("/api/v1/posts", {
				method: "POST",
			}),
		).rejects.toMatchObject({
			detail: "body.title: Field required",
			message: "body.title: Field required",
			status: 400,
		});
		await expect(
			requestJson("/api/v1/posts", {
				method: "POST",
			}),
		).rejects.toBeInstanceOf(BadRequestError);
	});

	it("redirects to login and throws UnauthorizedRequestError for 401 responses", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					error: {
						code: "unauthorized",
						message: "User not authenticated.",
						requestId: "request-401",
					},
				}),
			ok: false,
			status: 401,
		} as Response);

		await expect(
			requestJson("/api/v1/posts", {
				method: "GET",
			}),
		).rejects.toBeInstanceOf(UnauthorizedRequestError);

		expect(window.location.replace).toHaveBeenCalledWith(
			"/login?reason=unauthorized&message=session-expired&redirect=%2Fdashboard",
		);
	});

	it("redirects to access-denied and throws ForbiddenRequestError for 403 responses", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					error: {
						code: "forbidden",
						message: "You do not have enough privileges.",
						requestId: "request-403",
					},
				}),
			ok: false,
			status: 403,
		} as Response);

		await expect(
			requestJson("/api/v1/policies", {
				method: "GET",
			}),
		).rejects.toBeInstanceOf(ForbiddenRequestError);
		expect(window.location.replace).toHaveBeenCalledWith("/access-denied");
	});

	it("throws a ServerRequestError for 5xx responses", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					error: {
						code: "internal_server_error",
						message: "An unexpected error occurred.",
						requestId: "request-503",
					},
				}),
			ok: false,
			status: 503,
		} as Response);

		await expect(
			requestJson("/api/v1/posts", {
				method: "GET",
			}),
		).rejects.toMatchObject({
			detail: "An unexpected error occurred.",
			message: "An unexpected error occurred.",
			status: 503,
		});
		await expect(
			requestJson("/api/v1/posts", {
				method: "GET",
			}),
		).rejects.toBeInstanceOf(ServerRequestError);
		expect(window.location.replace).toHaveBeenCalledWith(
			"/error?kind=unexpected"
		);
	});

	it("redirects network exceptions to the generic error route", async () => {
		globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

		await expect(
			requestJson("/api/v1/posts", {
				method: "GET",
			})
		).rejects.toThrow("Failed to fetch");

		expect(window.location.replace).toHaveBeenCalledWith(
			"/error?kind=unexpected"
		);
	});

	it("falls back to legacy detail payloads when the backend envelope is absent", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve({ detail: "Legacy error detail" }),
			ok: false,
			status: 400,
		} as Response);

		await expect(
			requestJson("/api/v1/posts", {
				method: "POST",
			}),
		).rejects.toMatchObject({
			detail: "Legacy error detail",
			message: "Legacy error detail",
			status: 400,
		});
		expect(markBackendActivity).not.toHaveBeenCalled();
	});

	it("marks backend activity when a request succeeds", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve({ uuid: "item-1" }),
			ok: true,
			status: 200,
		} as Response);

		await expect(
			requestJson<{ uuid: string }>("/api/v1/posts", {
				method: "GET",
			}),
		).resolves.toEqual({ uuid: "item-1" });

		expect(markBackendActivity).toHaveBeenCalledTimes(1);
	});

	it("marks backend activity for successful empty responses", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			headers: new Headers(),
			ok: true,
			status: 204,
		} as Response);

		await expect(
			requestJson("/api/v1/posts", {
				method: "DELETE",
			}),
		).resolves.toBeNull();

		expect(markBackendActivity).toHaveBeenCalledTimes(1);
	});

	it("bootstraps one token and adds it to concurrent unsafe requests", async () => {
		document.cookie = "csrftoken=; Max-Age=0; path=/";
		globalThis.fetch = vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
			if (String(input).endsWith("/api/v1/csrf")) {
				document.cookie = "csrftoken=bootstrap-token; path=/";
				return { headers: new Headers(), ok: true, status: 204 } as Response;
			}

			return {
				headers: new Headers({ "content-type": "application/json" }),
				json: () => Promise.resolve({ uuid: "item-1" }),
				ok: true,
				status: 200,
			} as Response;
		});

		await Promise.all([
			requestJson("/api/v1/posts", { method: "POST" }),
			requestJson("/api/v1/roles", { method: "POST" }),
		]);

		const calls = vi.mocked(globalThis.fetch).mock.calls;
		const bootstrapCalls = calls.filter(([input]) =>
			String(input).endsWith("/api/v1/csrf")
		);
		expect(bootstrapCalls).toHaveLength(1);
		for (const [, requestInit] of calls.filter(
			([input]) => !String(input).endsWith("/api/v1/csrf")
		)) {
			expect(new Headers(requestInit?.headers).get("x-csrftoken")).toBe(
				"bootstrap-token"
			);
		}
	});

	it("does not redirect to access-denied for a CSRF rejection", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					error: {
						code: "csrf_error",
						message: "CSRF token verification failed",
					},
				}),
			ok: false,
			status: 403,
		} as Response);

		await expect(
			requestJson("/api/v1/posts", { method: "POST" })
		).rejects.toBeInstanceOf(ForbiddenRequestError);

		expect(window.location.replace).not.toHaveBeenCalled();
	});
});