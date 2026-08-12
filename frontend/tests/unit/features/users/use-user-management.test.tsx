import type { PropsWithChildren, ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getUsers, searchUsers } from "@/fetch/users";
import { useUserManagement } from "@/features/users/hooks/use-user-management";

vi.mock("@/fetch/users", () => ({
	createUser: vi.fn(),
	deleteUser: vi.fn(),
	getUsers: vi.fn(),
	searchUsers: vi.fn(),
	updateUser: vi.fn(),
}));

const createWrapper = (): ((properties: PropsWithChildren) => ReactElement) => {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});

	return ({ children }: PropsWithChildren): ReactElement => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
};

const searchedUser = {
	acceptedTermsAt: null,
	authProvider: "local",
	departmentAbbreviation: null,
	departmentUuid: null,
	email: "outside.page@example.test",
	enabled: true,
	globalRole: null,
	name: "Outside Page",
	profileImageUrl: "",
	termsVersion: null,
	tierUuid: null,
	uuid: "user-outside-page",
	username: "outside.page@example.test",
	workspaceAssignments: [],
};

describe("useUserManagement", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.mocked(getUsers).mockResolvedValue({
			data: [],
			has_more: true,
			items_per_page: 10,
			page: 2,
			total_count: 30,
		});
		vi.mocked(searchUsers).mockResolvedValue([searchedUser]);
	});

	it("uses server-wide search so a CL Admin can find a target outside the current page", async () => {
		const { result } = renderHook(
			() => useUserManagement(2, 10, "outside.page@example.test"),
			{ wrapper: createWrapper() }
		);

		await waitFor(() => {
			expect(result.current.users).toEqual([searchedUser]);
		});
		expect(searchUsers).toHaveBeenCalledWith("outside.page@example.test");
		expect(getUsers).not.toHaveBeenCalled();
		expect(result.current.page).toBe(1);
	});
});
