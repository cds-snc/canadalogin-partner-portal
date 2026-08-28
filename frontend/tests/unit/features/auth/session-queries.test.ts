import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	currentUserQueryKey,
	revalidateCurrentUser,
} from "@/features/auth/session-queries";
import { appQueryClient } from "@/lib/query-client";
import { authStore, resetAuthStore } from "@/store";

vi.mock("@/fetch/auth", () => ({
	getCurrentUser: vi.fn(),
	getOidcLoginUrl: vi.fn(),
}));

describe("session-queries", () => {
	beforeEach(() => {
		resetAuthStore();
		appQueryClient.clear();
		vi.clearAllMocks();
	});

	it("revalidates the BFF session through TanStack Query and synchronizes the UI projection", async () => {
		const { getCurrentUser } = await import("@/fetch/auth");
		const user = {
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
			profileImageUrl: "",
			termsVersion: "2026-01",
			uuid: "user-uuid-7",
			username: "jane@example.com",
		};
		vi.mocked(getCurrentUser).mockResolvedValue(user);

		await expect(revalidateCurrentUser()).resolves.toEqual(user);
		expect(appQueryClient.getQueryData(currentUserQueryKey)).toEqual(user);
		expect(authStore.getState().currentUser).toEqual(user);
	});

	it("does not trust cached current-user state on the next route entry", async () => {
		const { getCurrentUser } = await import("@/fetch/auth");
		vi.mocked(getCurrentUser)
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce(null);

		await revalidateCurrentUser();
		await revalidateCurrentUser();

		expect(getCurrentUser).toHaveBeenCalledTimes(2);
	});
});
