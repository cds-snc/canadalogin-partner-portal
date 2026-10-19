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

vi.mock("@/fetch/auth", () => ({
	getOidcLoginUrl: vi.fn(() => "http://localhost:8000/api/v1/auth/oidc/login"),
}));

const sampleUser = {
	acceptedTermsAt: "2026-06-11T12:00:00Z",
	termsAccepted: true,
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

	it("redirects to OIDC when the user is not authenticated", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue(null);

		await expect(requireAuthenticatedUser("/users")).rejects.toMatchObject({
			options: {
				href: "http://localhost:8000/api/v1/auth/oidc/login",
				replace: true,
			},
		});
		expect(revalidateCurrentUser).toHaveBeenCalledTimes(1);
	});

	it("navigates to OIDC when session revalidation fails before route entry", async () => {
		vi.mocked(revalidateCurrentUser).mockRejectedValue(new TypeError("Failed to fetch"));

		await expect(requireAuthenticatedUser("/applications")).rejects.toMatchObject({
			options: {
				href: "http://localhost:8000/api/v1/auth/oidc/login",
				replace: true,
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

	it("redirects a pending session to accept terms after login", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue({
			...sampleUser,
			termsAccepted: false,
		});

		await expect(completeLoginRedirect("/users")).rejects.toMatchObject({
			options: {
				replace: true,
				search: { redirect: "/users" },
				to: "/accept-terms",
			},
		});
	});

	it("navigates to OIDC when post-login revalidation finds no session", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue(null);

		await expect(completeLoginRedirect("/profile")).rejects.toMatchObject({
			options: {
				href: "http://localhost:8000/api/v1/auth/oidc/login",
				replace: true,
			},
		});
	});

	it("redirects to accept-terms when terms have not been accepted", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue({
			...sampleUser,
			termsAccepted: false,
		});

		await expect(requireAuthenticatedUser("/applications")).rejects.toMatchObject({
			options: {
				replace: true,
				search: { redirect: "/applications" },
				to: "/accept-terms",
			},
		});
	});

	it("passes terms check when the active session accepted terms", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue(sampleUser);

		await expect(requireAuthenticatedUser("/applications")).resolves.toEqual(sampleUser);
	});

	it("passes terms check when already on the accept-terms page", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue({
			...sampleUser,
			termsAccepted: false,
		});

		await expect(requireAuthenticatedUser("/accept-terms")).resolves.toEqual({
			...sampleUser,
			termsAccepted: false,
		});
	});
});