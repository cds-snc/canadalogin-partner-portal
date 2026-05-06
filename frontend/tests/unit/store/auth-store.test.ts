import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authStore, resetAuthStore } from "@/store";

vi.mock("@/fetch/auth", () => ({
	getCurrentUser: vi.fn(),
	getOidcLoginUrl: vi.fn((): string => "http://localhost:8000/api/v1/auth/oidc/login"),
	logoutCurrentUser: vi.fn((): Promise<void> => Promise.resolve()),
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
	username: "jdoe",
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
		vi.mocked(logoutCurrentUser).mockResolvedValue();

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
});