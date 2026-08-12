import type { PropsWithChildren, ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSession } from "@/features/auth/hooks/use-session";
import { resetAuthStore } from "@/store";

vi.mock("@/fetch/auth", () => ({
	getCurrentUser: vi.fn(),
	getOidcLoginUrl: vi.fn(
		(): string => "http://localhost:8000/api/v1/auth/oidc/login"
	),
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

	beforeEach(async () => {
		resetAuthStore();
		({ getCurrentUser } = await import("@/fetch/auth"));
	});

	afterEach(() => {
		resetAuthStore();
		vi.clearAllMocks();
	});

	it("keeps the user signed out when a stale current-user request resolves after logout", async () => {
		const deferredCurrentUser =
			createDeferred<NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>>();

		vi.mocked(getCurrentUser).mockImplementation(
			() => deferredCurrentUser.promise
		);

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
			acceptedTermsAt: "2026-06-11T12:00:00Z",
			authorizationContext: {
				globalRole: null,
				partnerAccess: [
					{ role: "rp_admin", workspaceUuid: "workspace-uuid-1" },
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
		});

		await waitFor(() => {
			expect(result.current.currentUser).toBeNull();
			expect(result.current.isAuthenticated).toBe(false);
		});
	});

	it("keeps TanStack Query ownership internal to the session abstraction", async () => {
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
