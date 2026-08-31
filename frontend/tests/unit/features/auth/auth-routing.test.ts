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
	let assignMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.resetAllMocks();
		assignMock = vi.fn();
		vi.stubGlobal("location", { assign: assignMock });
	});

	afterEach(() => {
		vi.clearAllMocks();
		vi.unstubAllGlobals();
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

	it("navigates directly to OIDC when the user is not authenticated", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue(null);

		await expect(requireAuthenticatedUser("/users")).rejects.toThrow("Redirecting to OIDC login");
		expect(assignMock).toHaveBeenCalledWith("http://localhost:8000/api/v1/auth/oidc/login");
		expect(revalidateCurrentUser).toHaveBeenCalledTimes(1);
	});

	it("navigates to OIDC when session revalidation fails before route entry", async () => {
		vi.mocked(revalidateCurrentUser).mockRejectedValue(new TypeError("Failed to fetch"));

		await expect(requireAuthenticatedUser("/your-applications")).rejects.toThrow("Redirecting to OIDC login");
		expect(assignMock).toHaveBeenCalledWith("http://localhost:8000/api/v1/auth/oidc/login");
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

	it("navigates to OIDC when post-login revalidation finds no session", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue(null);

		await expect(completeLoginRedirect("/profile")).rejects.toThrow("Redirecting to OIDC login");
		expect(assignMock).toHaveBeenCalledWith("http://localhost:8000/api/v1/auth/oidc/login");
	});

	it("redirects to accept-terms when terms have not been accepted", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue({
			...sampleUser,
			acceptedTermsAt: null,
		});

		await expect(requireAuthenticatedUser("/your-applications")).rejects.toMatchObject({
			options: {
				replace: true,
				search: { redirect: "/your-applications" },
				to: "/accept-terms",
			},
		});
	});

	it("passes terms check when acceptedTermsAt is set", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue(sampleUser);

		await expect(requireAuthenticatedUser("/your-applications")).resolves.toEqual(sampleUser);
	});

	it("passes terms check when already on the accept-terms page", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue({
			...sampleUser,
			acceptedTermsAt: null,
		});

		await expect(requireAuthenticatedUser("/accept-terms")).resolves.toEqual({
			...sampleUser,
			acceptedTermsAt: null,
		});
	});
});