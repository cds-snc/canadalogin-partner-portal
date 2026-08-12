import type { PropsWithChildren, ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	clearDevSession,
	getDevSession,
	selectDevSessionFixture,
	type DevSessionRead,
} from "@/fetch/dev-session";
import {
	getCurrentDevSessionFixture,
	UnknownDevSessionFixtureError,
	useDevSession,
} from "@/features/auth/hooks/use-dev-session";

vi.mock("@/fetch/dev-session", () => ({
	clearDevSession: vi.fn(),
	getDevSession: vi.fn(),
	selectDevSessionFixture: vi.fn(),
}));

const devSession: DevSessionRead = {
	currentFixtureId: "local-read-only",
	enabled: true,
	fixtures: [
		{
			email: "local-read-only@local.example",
			fixtureId: "local-read-only",
			globalRole: null,
			name: "Local Read Only",
			partnerAccess: [
				{
					role: "read_only",
					workspaceName: "Workspace Alpha",
					workspaceUuid: "workspace-alpha-uuid",
				},
			],
		},
	],
};

const createWrapper = (): ((properties: PropsWithChildren) => ReactElement) => {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});

	return ({ children }: PropsWithChildren): ReactElement => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
};

describe("useDevSession", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.mocked(getDevSession).mockResolvedValue(devSession);
		vi.mocked(selectDevSessionFixture).mockResolvedValue();
		vi.mocked(clearDevSession).mockResolvedValue();
	});

	it("exposes the confirmed current fixture", async () => {
		const { result } = renderHook(() => useDevSession(), {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(result.current.currentFixture?.fixtureId).toBe("local-read-only");
		});
	});

	it("fails closed when currentFixtureId is not in the returned allowlist", () => {
		expect(
			getCurrentDevSessionFixture({
				...devSession,
				currentFixtureId: "unknown-fixture",
			})
		).toBeNull();
	});

	it("rejects an unknown fixture before making a session request", async () => {
		const { result } = renderHook(() => useDevSession(), {
			wrapper: createWrapper(),
		});
		await waitFor(() => {
			expect(result.current.devSession).toEqual(devSession);
		});

		await expect(
			act(async () => result.current.selectFixture("cl_admin"))
		).rejects.toBeInstanceOf(UnknownDevSessionFixtureError);
		expect(selectDevSessionFixture).not.toHaveBeenCalled();
	});

	it("selects an allowlisted fixture and refreshes the dev-session query", async () => {
		const { result } = renderHook(() => useDevSession(), {
			wrapper: createWrapper(),
		});
		await waitFor(() => {
			expect(result.current.devSession).toEqual(devSession);
		});

		await act(async () => result.current.selectFixture("local-read-only"));

		expect(selectDevSessionFixture).toHaveBeenCalledWith("local-read-only");
		await waitFor(() => {
			expect(getDevSession).toHaveBeenCalledTimes(2);
		});
	});

	it("clears the server session and refreshes the confirmed fixture state", async () => {
		const { result } = renderHook(() => useDevSession(), {
			wrapper: createWrapper(),
		});
		await waitFor(() => {
			expect(result.current.devSession).toEqual(devSession);
		});

		await act(async () => result.current.clearSession());

		expect(clearDevSession).toHaveBeenCalledTimes(1);
		await waitFor(() => {
			expect(getDevSession).toHaveBeenCalledTimes(2);
		});
	});
});
