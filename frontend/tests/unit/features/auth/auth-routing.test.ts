import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	completeLoginRedirect,
	getAuthorizationLandingPath,
	getPostLoginPath,
	loadHomeAdmission,
	requireAnyCapability,
	requireCapability,
	requireAuthenticatedUser,
	requireAuthenticatedUserWithoutDepartmentSelection,
	requireWorkspaceRead,
	sanitizeAppPath,
} from "@/features/auth/auth-routing";
import { revalidateCurrentUser } from "@/features/auth/session-queries";

vi.mock("@/features/auth/session-queries", () => ({
	revalidateCurrentUser: vi.fn(),
}));

vi.mock("@/fetch/auth", () => ({
	getOidcLoginUrl: vi.fn((language?: string, redirect?: string) => {
		const searchParameters = new URLSearchParams();
		if (language) {
			searchParameters.set("ui_locales", language);
		}
		if (redirect) {
			searchParameters.set("redirect", redirect);
		}
		const query = searchParameters.toString();
		return query.length > 0
			? `http://localhost:8000/api/v1/auth/oidc/login?${query}`
			: "http://localhost:8000/api/v1/auth/oidc/login";
	}),
}));

const sampleUser = {
	acceptedTermsAt: "2026-06-11T12:00:00Z",
	authorizationContext: {
		globalRole: null,
		partnerAccess: [
			{ role: "rp_admin" as const, workspaceUuid: "workspace-uuid-1" },
		],
	},
	departmentAbbreviation: "TBS",
	departmentUuid: "department-uuid-1",
	email: "jane@example.com",
	name: "Jane Doe",
	profileImageUrl: "https://example.com/jane.png",
	termsVersion: "2026-01",
	tierUuid: "tier-uuid-3",
	uuid: "user-uuid-7",
	username: "jane@example.com",
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
		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
	});

	it("keeps internal app paths and rejects external ones", () => {
		expect(sanitizeAppPath("/users")).toBe("/users");
		expect(sanitizeAppPath("https://example.com/attack", "/profile")).toBe(
			"/profile"
		);
		expect(sanitizeAppPath(undefined, "/profile")).toBe("/profile");
	});

	it("selects a safe landing route from the confirmed authorization context", () => {
		expect(getAuthorizationLandingPath(sampleUser.authorizationContext)).toBe(
			"/"
		);
		expect(
			getAuthorizationLandingPath({
				globalRole: "cl_admin",
				partnerAccess: [],
			})
		).toBe("/");
		expect(
			getAuthorizationLandingPath({ globalRole: null, partnerAccess: [] })
		).toBe("/access-denied");
	});

	it("uses Home as the post-login default regardless of local configuration", () => {
		vi.stubEnv("VITE_AUTH_POST_LOGIN_PATH", "/your-applications");

		expect(getPostLoginPath()).toBe("/");
	});

	it("returns the authenticated user for protected routes", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue(sampleUser);

		await expect(requireAuthenticatedUser("/users")).resolves.toEqual(
			sampleUser
		);
	});

	it("navigates directly to OIDC when the user is not authenticated", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue(null);

		await expect(requireAuthenticatedUser("/users")).rejects.toThrow(
			"Redirecting to OIDC login"
		);
		expect(assignMock).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/auth/oidc/login?redirect=%2Fusers"
		);
		expect(revalidateCurrentUser).toHaveBeenCalledTimes(1);
	});

	it("navigates to OIDC when session revalidation fails before route entry", async () => {
		vi.mocked(revalidateCurrentUser).mockRejectedValue(
			new TypeError("Failed to fetch")
		);

		await expect(
			requireAuthenticatedUser("/your-applications")
		).rejects.toThrow("Redirecting to OIDC login");
		expect(assignMock).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/auth/oidc/login?redirect=%2Fyour-applications"
		);
	});

	it("admits an authenticated user to service Home after BFF revalidation", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue(sampleUser);

		await expect(loadHomeAdmission()).resolves.toEqual(sampleUser);
		expect(revalidateCurrentUser).toHaveBeenCalledTimes(1);
	});

	it("admits CL Admin to service Home", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue({
			...sampleUser,
			authorizationContext: {
				globalRole: "cl_admin",
				partnerAccess: [],
			},
		});

		await expect(loadHomeAdmission()).resolves.toMatchObject({
			authorizationContext: {
				globalRole: "cl_admin",
				partnerAccess: [],
			},
		});
	});

	it("renders public Home when no BFF session exists", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue(null);

		await expect(loadHomeAdmission()).resolves.toBeNull();
	});

	it("fails closed to public Home when BFF revalidation fails", async () => {
		vi.mocked(revalidateCurrentUser).mockRejectedValue(
			new TypeError("Failed to fetch")
		);

		await expect(loadHomeAdmission()).resolves.toBeNull();
	});

	it("routes authenticated users without usable product access to access denied", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue({
			...sampleUser,
			authorizationContext: { globalRole: null, partnerAccess: [] },
		});

		await expect(loadHomeAdmission()).rejects.toMatchObject({
			options: { replace: true, to: "/access-denied" },
		});
	});

	it("preserves a safe intended destination while terms acceptance runs first", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue({
			...sampleUser,
			acceptedTermsAt: null,
		});

		await expect(
			loadHomeAdmission("/your-applications/rp-application-uuid")
		).rejects.toMatchObject({
			options: {
				replace: true,
				search: { redirect: "/your-applications/rp-application-uuid" },
				to: "/accept-terms",
			},
		});
	});

	it("resumes an authorized intended destination after Home admission", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue(sampleUser);

		await expect(
			loadHomeAdmission("/your-applications/rp-application-uuid")
		).rejects.toMatchObject({
			options: {
				replace: true,
				to: "/your-applications/rp-application-uuid",
			},
		});
	});

	it("drops an unauthorized intended destination and keeps service Home", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue(sampleUser);

		await expect(loadHomeAdmission("/users")).resolves.toEqual(sampleUser);
	});

	it("rejects an unauthorized intended route and defaults to service Home", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue(sampleUser);

		await expect(completeLoginRedirect("/users")).rejects.toMatchObject({
			options: {
				replace: true,
				to: "/",
			},
		});
	});

	it("resumes an intended route allowed by the confirmed authorization context", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue({
			...sampleUser,
			authorizationContext: { globalRole: "cl_admin", partnerAccess: [] },
		});

		await expect(completeLoginRedirect("/users")).rejects.toMatchObject({
			options: {
				replace: true,
				to: "/users",
			},
		});
	});

	it("resumes a partner resource route for destination-level scope validation", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue(sampleUser);

		await expect(
			completeLoginRedirect("/your-applications/rp-application-uuid")
		).rejects.toMatchObject({
			options: {
				replace: true,
				to: "/your-applications/rp-application-uuid",
			},
		});
	});

	it("uses the confirmed no-access landing after login without a redirect", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue({
			...sampleUser,
			authorizationContext: { globalRole: null, partnerAccess: [] },
		});

		await expect(completeLoginRedirect()).rejects.toMatchObject({
			options: {
				replace: true,
				to: "/access-denied",
			},
		});
	});

	it.each([
		{
			caseName: "terms acceptance before the intended product route",
			currentUser: { ...sampleUser, acceptedTermsAt: null },
			expectedOptions: {
				replace: true,
				search: { redirect: "/your-applications/rp-application-uuid" },
				to: "/accept-terms",
			},
			intendedDestination: "/your-applications/rp-application-uuid",
		},
		{
			caseName: "a tokenized invitation before department setup",
			currentUser: {
				...sampleUser,
				authorizationContext: { globalRole: null, partnerAccess: [] },
				departmentAbbreviation: null,
				departmentUuid: null,
			},
			expectedOptions: {
				replace: true,
				to: "/invitations/rp-applications/invitation-token",
			},
			intendedDestination:
				"/invitations/rp-applications/invitation-token?role=cl_admin",
		},
		{
			caseName: "applicable department setup before normal routing",
			currentUser: {
				...sampleUser,
				authorizationContext: {
					globalRole: "cl_admin" as const,
					partnerAccess: [],
				},
				departmentAbbreviation: null,
				departmentUuid: null,
			},
			expectedOptions: { replace: true, to: "/profile/setup" },
			intendedDestination: "/administration",
		},
		{
			caseName: "an authorized preserved destination",
			currentUser: sampleUser,
			expectedOptions: {
				replace: true,
				to: "/your-applications/rp-application-uuid",
			},
			intendedDestination: "/your-applications/rp-application-uuid",
		},
		{
			caseName: "service Home when no intended destination remains",
			currentUser: sampleUser,
			expectedOptions: { replace: true, to: "/" },
			intendedDestination: undefined,
		},
		{
			caseName: "access denial when no product area is usable",
			currentUser: {
				...sampleUser,
				authorizationContext: { globalRole: null, partnerAccess: [] },
			},
			expectedOptions: { replace: true, to: "/access-denied" },
			intendedDestination: undefined,
		},
	])(
		"applies admission precedence for $caseName",
		async ({ currentUser, expectedOptions, intendedDestination }) => {
			vi.mocked(revalidateCurrentUser).mockResolvedValue(currentUser);

			await expect(
				completeLoginRedirect(intendedDestination)
			).rejects.toMatchObject({ options: expectedOptions });
		}
	);

	it("navigates to OIDC when post-login revalidation finds no session", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue(null);

		await expect(completeLoginRedirect("/profile/setup")).rejects.toThrow(
			"Redirecting to OIDC login"
		);
		expect(assignMock).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/auth/oidc/login?ui_locales=en&redirect=%2Fprofile%2Fsetup"
		);
	});

	it("redirects to accept-terms when terms have not been accepted", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue({
			...sampleUser,
			acceptedTermsAt: null,
		});

		await expect(
			requireAuthenticatedUser("/your-applications")
		).rejects.toMatchObject({
			options: {
				replace: true,
				search: { redirect: "/your-applications" },
				to: "/accept-terms",
			},
		});
	});

	it("passes terms check when acceptedTermsAt is set", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue(sampleUser);

		await expect(
			requireAuthenticatedUser("/your-applications")
		).resolves.toEqual(sampleUser);
	});

	it("allows an RP Admin capability in the assigned workspace", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue(sampleUser);

		await expect(
			requireCapability(
				"/workspaces/workspace-uuid-1/settings",
				"workspace_metadata_write",
				"workspace-uuid-1"
			)
		).resolves.toEqual(sampleUser);
	});

	it("admits Reports when any reporting capability is available and denies an empty role", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue(sampleUser);

		await expect(
			requireAnyCapability("/reports", [
				"onboarding_oversight_read",
				"aggregate_report_read",
				"mau_report_read",
			])
		).resolves.toEqual(sampleUser);

		vi.mocked(revalidateCurrentUser).mockResolvedValue({
			...sampleUser,
			authorizationContext: { globalRole: null, partnerAccess: [] },
		});
		await expect(
			requireAnyCapability("/reports", [
				"onboarding_oversight_read",
				"aggregate_report_read",
				"mau_report_read",
			])
		).rejects.toMatchObject({
			options: { replace: true, to: "/access-denied" },
		});
	});

	it("allows only CL Admin through the RP adoption route capability", async () => {
		const clAdmin = {
			...sampleUser,
			authorizationContext: {
				globalRole: "cl_admin" as const,
				partnerAccess: [],
			},
		};
		vi.mocked(revalidateCurrentUser).mockResolvedValue(clAdmin);

		await expect(
			requireCapability(
				"/workspaces/rp-registration-adoption",
				"partner_bootstrap"
			)
		).resolves.toEqual(clAdmin);

		vi.mocked(revalidateCurrentUser).mockResolvedValue(sampleUser);
		await expect(
			requireCapability(
				"/workspaces/rp-registration-adoption",
				"partner_bootstrap"
			)
		).rejects.toMatchObject({
			options: { replace: true, to: "/access-denied" },
		});
	});

	it("denies an RP Admin in the wrong workspace", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue(sampleUser);

		await expect(
			requireWorkspaceRead("/workspaces/workspace-uuid-2", "workspace-uuid-2")
		).rejects.toMatchObject({
			options: { replace: true, to: "/access-denied" },
		});
	});

	it("denies a signed-in user with no canonical role", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue({
			...sampleUser,
			authorizationContext: { globalRole: null, partnerAccess: [] },
		});

		await expect(
			requireWorkspaceRead("/workspaces", undefined)
		).rejects.toMatchObject({
			options: { replace: true, to: "/access-denied" },
		});
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

	it("allows invitation routes to bypass the department-setup redirect", async () => {
		vi.mocked(revalidateCurrentUser).mockResolvedValue({
			...sampleUser,
			departmentAbbreviation: null,
		});

		await expect(
			requireAuthenticatedUserWithoutDepartmentSelection(
				"/invitations/rp-applications/token-123"
			)
		).resolves.toEqual({
			...sampleUser,
			departmentAbbreviation: null,
		});
	});
});
