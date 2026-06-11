import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	completeLoginRedirect,
	requireAuthenticatedUser,
	redirectAuthenticatedUser,
	sanitizeAppPath,
} from "@/features/auth/auth-routing";
import { revalidateCurrentUser } from "@/features/auth/session-queries";

vi.mock("@/features/auth/session-queries", () => ({
	revalidateCurrentUser: vi.fn(),
}));

const sampleUser = {
	acceptedTermsAt: "2026-06-11T12:00:00Z",
	"authProvider": "gc-sso",
	"authSubject": "subject-123",
	email: "jane@example.com",
	name: "Jane Doe",
	"profileImageUrl": "https://example.com/jane.png",
	"roleUuids": ["role-uuid-2"],
	"tierUuid": "tier-uuid-3",
	uuid: "user-uuid-7",
	departmentAbbreviation: "TBS",
};

describe("auth-routing", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("keeps internal app paths and rejects external ones", () => {
		expect(sanitizeAppPath("/users")).toBe("/users");
		expect(sanitizeAppPath("https://example.com/attack", "/profile")).toBe("/profile");
		expect(sanitizeAppPath(undefined, "/profile")).toBe("/profile");
	});

	it("returns the authenticated user for protected routes", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue(sampleUser);

		await expect(requireAuthenticatedUser("/users")).resolves.toEqual(sampleUser);
	});

	it("redirects to login when backend revalidation clears a stale cached session", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue(null);

		await expect(requireAuthenticatedUser("/users")).rejects.toMatchObject({
			options: {
				replace: true,
				search: { redirect: "/users" },
				to: "/login",
			},
		});
		expect(revalidateCurrentUser).toHaveBeenCalledTimes(1);
	});

	it("redirects unauthenticated users to the login route", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue(null);

		await expect(requireAuthenticatedUser("/users")).rejects.toMatchObject({
			options: {
				replace: true,
				search: { redirect: "/users" },
				to: "/login",
			},
		});
	});

	it("redirects to login when session revalidation fails before route entry", async () => {
		vi.mocked(revalidateCurrentUser).mockRejectedValue(new TypeError("Failed to fetch"));

		await expect(requireAuthenticatedUser("/dashboard")).rejects.toMatchObject({
			options: {
				replace: true,
				search: { redirect: "/dashboard" },
				to: "/login",
			},
		});
	});

	it("redirects authenticated users away from the login page", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue(sampleUser);

		await expect(redirectAuthenticatedUser("/profile")).rejects.toMatchObject({
			options: {
				replace: true,
				to: "/profile",
			},
		});
	});

	it("revalidates session state and redirects into the authenticated area", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue(sampleUser);

		await expect(completeLoginRedirect("/users")).rejects.toMatchObject({
			options: {
				replace: true,
				to: "/users",
			},
		});
	});

	it("redirects to terms-and-conditions when terms have not been accepted", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue({
			...sampleUser,
			acceptedTermsAt: null,
		});

		await expect(requireAuthenticatedUser("/dashboard")).rejects.toMatchObject({
			options: {
				replace: true,
				search: { redirect: "/dashboard" },
				to: "/terms-and-conditions",
			},
		});
	});

	it("passes terms check when acceptedTermsAt is set", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue(sampleUser);

		await expect(requireAuthenticatedUser("/dashboard")).resolves.toEqual(sampleUser);
	});

	it("passes terms check when already on the terms page", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue({
			...sampleUser,
			acceptedTermsAt: null,
		});

		await expect(requireAuthenticatedUser("/terms-and-conditions")).resolves.toEqual({
			...sampleUser,
			acceptedTermsAt: null,
		});
	});

	it("returns to login when post-login revalidation still has no session", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue(null);

		await expect(completeLoginRedirect("/profile")).rejects.toMatchObject({
			options: {
				replace: true,
				search: { redirect: "/profile" },
				to: "/login",
			},
		});
	});
});