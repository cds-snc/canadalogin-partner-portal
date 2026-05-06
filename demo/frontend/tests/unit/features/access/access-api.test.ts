import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getUserTier } from "@/fetch/access";

describe("access-api", () => {
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		vi.unstubAllEnvs();
		vi.stubEnv("VITE_API_BASE_URL", "http://localhost:8000");
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		vi.restoreAllMocks();
	});

	it("requests the current user's tier details", async () => {
		const userUuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b102";
		globalThis.fetch = vi.fn().mockResolvedValue({
			json: () => Promise.resolve({
					uuid: userUuid,
					username: "jdoe",
					name: "Jane Doe",
					email: "jane@example.com",
					profileImageUrl: "https://example.com/jane.png",
					authProvider: "gc-sso",
					authSubject: "subject-123",
					roleUuids: ["role-uuid-4"],
					tierUuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b401",
				tierName: "free",
				tierCreatedAt: "2026-03-17T00:00:00Z",
			}),
			ok: true,
		} as Response) as typeof fetch;

		const response = await getUserTier(userUuid);

		expect(globalThis.fetch).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/user/${userUuid}/tier`,
			expect.objectContaining({
				credentials: "include",
				method: "GET",
			}),
		);
		expect(response?.tierName).toBe("free");
	});
});