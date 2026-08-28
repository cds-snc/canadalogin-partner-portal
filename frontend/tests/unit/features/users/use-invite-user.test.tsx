import type { PropsWithChildren, ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useInviteUser } from "@/features/users/hooks/use-invite-user";
import { createWorkspaceDeveloperInvitation } from "@/fetch/rp-application-developer-invitations";
import { resolveUserInvitationTarget } from "@/fetch/users";

vi.mock("@/fetch/rp-application-developer-invitations", () => ({
	createWorkspaceDeveloperInvitation: vi.fn(),
}));
vi.mock("@/fetch/users", () => ({
	resolveUserInvitationTarget: vi.fn(),
}));

const createQueryClient = (): QueryClient =>
	new QueryClient({
		defaultOptions: {
			mutations: { retry: false },
			queries: { retry: false },
		},
	});

const createWrapper = (
	queryClient = createQueryClient()
): ((properties: PropsWithChildren) => ReactElement) => {
	return ({ children }: PropsWithChildren): ReactElement => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
};

const input = {
	invitedEmail: "person@example.test",
	inviteExpiresAt: "2026-08-20T12:00:00Z",
	role: "read_only" as const,
	workspaceUuid: "workspace-uuid-1",
};

describe("useInviteUser", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("redirects an active existing identity to role assignment without inviting", async () => {
		vi.mocked(resolveUserInvitationTarget).mockResolvedValue({
			outcome: "existing_identity",
			userUuid: "existing-user-uuid",
		});
		const { result } = renderHook(() => useInviteUser(), {
			wrapper: createWrapper(),
		});

		let outcome;
		await act(async () => {
			outcome = await result.current.invite(input);
		});

		expect(outcome).toEqual({
			kind: "existing_identity",
			userUuid: "existing-user-uuid",
		});
		expect(createWorkspaceDeveloperInvitation).not.toHaveBeenCalled();
	});

	it("fails closed for a disabled or deleted identity", async () => {
		vi.mocked(resolveUserInvitationTarget).mockResolvedValue({
			outcome: "ineligible_identity",
			userUuid: null,
		});
		const { result } = renderHook(() => useInviteUser(), {
			wrapper: createWrapper(),
		});

		let outcome;
		await act(async () => {
			outcome = await result.current.invite(input);
		});

		expect(outcome).toEqual({ kind: "ineligible_identity" });
		expect(createWorkspaceDeveloperInvitation).not.toHaveBeenCalled();
	});

	it("creates a workspace-owned invitation for a new identity", async () => {
		const queryClient = createQueryClient();
		const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
		vi.mocked(resolveUserInvitationTarget).mockResolvedValue({
			outcome: "new_identity",
			userUuid: null,
		});
		vi.mocked(createWorkspaceDeveloperInvitation).mockResolvedValue({
			acceptanceUrl: "https://portal.example.test/invitations/token",
		} as never);
		const { result } = renderHook(() => useInviteUser(), {
			wrapper: createWrapper(queryClient),
		});

		let outcome;
		await act(async () => {
			outcome = await result.current.invite(input);
		});

		expect(createWorkspaceDeveloperInvitation).toHaveBeenCalledWith(
			"workspace-uuid-1",
			{
				invitedEmail: "person@example.test",
				inviteExpiresAt: "2026-08-20T12:00:00Z",
				role: "read_only",
			}
		);
		expect(outcome).toEqual({
			acceptanceUrl: "https://portal.example.test/invitations/token",
			kind: "invitation_created",
		});
		expect(invalidateQueries).toHaveBeenCalledWith({
			queryKey: ["user-pending-invitations"],
		});
	});
});
