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
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		vi.unstubAllGlobals();
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
});