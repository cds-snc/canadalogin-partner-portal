import type { PropsWithChildren, ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSession } from "@/features/auth/hooks/use-session";

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

describe("useSession", () => {
	let getCurrentUser: typeof import("@/fetch/auth").getCurrentUser;
	let logoutCurrentUser: typeof import("@/fetch/auth").logoutCurrentUser;

	beforeEach(async () => {
		({ getCurrentUser, logoutCurrentUser } = await import("@/fetch/auth"));
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("keeps the user signed out when a stale current-user request resolves after logout", async () => {
		const deferredCurrentUser = createDeferred<{
			name: string;
			username: string;
			email: string;
			profileImageUrl: string;
			authProvider: string | null;
			authSubject: string | null;
			roleUuids: string[] | null;
			tierUuid: string | null;
			uuid: string;
		}>();

		vi.mocked(getCurrentUser).mockImplementation(() => deferredCurrentUser.promise);
		vi.mocked(logoutCurrentUser).mockResolvedValue();

		const queryClient = new QueryClient();
		const wrapper = ({ children }: PropsWithChildren): ReactElement => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);

		const { result } = renderHook(() => useSession(), { wrapper });

		await act(async () => {
			await result.current.logout();
		});

		expect(result.current.currentUser).toBeNull();
		expect(result.current.isAuthenticated).toBe(false);

		deferredCurrentUser.resolve({
			authProvider: "gc-sso",
			authSubject: "subject-123",
			email: "jane@example.com",
			name: "Jane Doe",
			profileImageUrl: "https://example.com/jane.png",
			roleUuids: ["role-uuid-2"],
			tierUuid: "tier-uuid-3",
			uuid: "user-uuid-7",
			username: "jdoe",
		});

		await waitFor(() => {
			expect(result.current.currentUser).toBeNull();
			expect(result.current.isAuthenticated).toBe(false);
		});
	});

	it("does not expose a React Query result for auth session state", async () => {
		vi.mocked(getCurrentUser).mockResolvedValue(null);

		const queryClient = new QueryClient();
		const wrapper = ({ children }: PropsWithChildren): ReactElement => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);

		const { result } = renderHook(() => useSession(), { wrapper });

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect("query" in result.current).toBe(false);
	});
});