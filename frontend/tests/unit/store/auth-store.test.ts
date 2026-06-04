import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authStore, resetAuthStore } from "@/store";

vi.mock("@/fetch/auth", () => ({
	buildOidcLogoutUrl: vi.fn(
		(oidcLogout: {
			endSessionEndpoint: string;
			idTokenHint?: string | null;
			postLogoutRedirectUri?: string | null;
		}): string => {
			const logoutUrl = new URL(oidcLogout.endSessionEndpoint);

			if (oidcLogout.idTokenHint) {
				logoutUrl.searchParams.set("id_token_hint", oidcLogout.idTokenHint);
			}

			if (oidcLogout.postLogoutRedirectUri) {
				logoutUrl.searchParams.set(
					"post_logout_redirect_uri",
					oidcLogout.postLogoutRedirectUri
				);
			}

			return logoutUrl.toString();
		}
	),
	getCurrentUser: vi.fn(),
	getOidcLoginUrl: vi.fn((): string => "http://localhost:8000/api/v1/auth/oidc/login"),
	logoutCurrentUser: vi.fn((): Promise<{ message: string }> => Promise.resolve({ message: "Logged out successfully" })),
}));

type DeferredPromise<T> = {
	promise: Promise<T>;
	resolve: (value: T) => void;
	reject: (reason?: unknown) => void;
};

const createDeferred = <T,>(): DeferredPromise<T> => {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;

	const promise = new Promise<T>((innerResolve, innerReject) => {
		resolve = innerResolve;
		reject = innerReject;
	});

	return { promise, reject, resolve };
};

const sampleUser = {
	authProvider: "gc-sso",
	authSubject: "subject-123",
	email: "jane@example.com",
	name: "Jane Doe",
	profileImageUrl: "https://example.com/jane.png",
	roleUuids: ["role-uuid-2"],
	tierUuid: "tier-uuid-3",
	uuid: "user-uuid-7",
};

describe("authStore", () => {
	let getCurrentUser: typeof import("@/fetch/auth").getCurrentUser;
	let logoutCurrentUser: typeof import("@/fetch/auth").logoutCurrentUser;

	beforeEach(async () => {
		resetAuthStore();
		({ getCurrentUser, logoutCurrentUser } = await import("@/fetch/auth"));
	});

	afterEach(() => {
		resetAuthStore();
		vi.clearAllMocks();
	});

	it("hydrates session state from the backend", async () => {
		vi.mocked(getCurrentUser).mockResolvedValue(sampleUser);

		await expect(authStore.getState().hydrateSession()).resolves.toEqual(sampleUser);
		expect(authStore.getState()).toMatchObject({
			currentUser: sampleUser,
			hasHydrated: true,
			isAuthenticated: true,
			isLoading: false,
		});
	});

	it("refreshes session state even after an earlier hydration", async () => {
		vi.mocked(getCurrentUser)
			.mockResolvedValueOnce(sampleUser)
			.mockResolvedValueOnce(null);

		await authStore.getState().hydrateSession();
		await expect(authStore.getState().refreshSession()).resolves.toBeNull();
		expect(authStore.getState()).toMatchObject({
			currentUser: null,
			hasHydrated: true,
			isAuthenticated: false,
			isLoading: false,
		});
	});

	it("keeps the user signed out when logout wins over an in-flight hydration", async () => {
		const deferredCurrentUser = createDeferred<typeof sampleUser | null>();

		vi.mocked(getCurrentUser).mockImplementation(() => deferredCurrentUser.promise);
		vi.mocked(logoutCurrentUser).mockResolvedValue({
			message: "Logged out successfully",
		});

		const hydratePromise = authStore.getState().hydrateSession();
		await authStore.getState().logout();

		deferredCurrentUser.resolve(sampleUser);
		await hydratePromise;

		expect(authStore.getState()).toMatchObject({
			currentUser: null,
			hasHydrated: true,
			isAuthenticated: false,
			isLoading: false,
		});
	});

	it("redirects to the OIDC end-session endpoint when logout returns provider details", async () => {
		const assign = vi.fn();

		Object.defineProperty(window, "location", {
			configurable: true,
			value: {
				assign,
			},
		});

		vi.mocked(logoutCurrentUser).mockResolvedValue({
			message: "Logged out successfully",
			oidcLogout: {
				endSessionEndpoint: "https://example.verify.ibm.com/oidc/logout",
				idTokenHint: "id-token-value",
				postLogoutRedirectUri: "https://portal.example.gc.ca/logout-complete",
			},
		});

		await authStore.getState().logout();

		expect(assign).toHaveBeenCalledWith(
			"https://example.verify.ibm.com/oidc/logout?id_token_hint=id-token-value&post_logout_redirect_uri=https%3A%2F%2Fportal.example.gc.ca%2Flogout-complete",
		);
		expect(authStore.getState()).toMatchObject({
			currentUser: null,
			hasHydrated: true,
			isAuthenticated: false,
			isLoading: false,
		});
	});
});