import type { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { refreshActiveListQuery } from "@/lib/refresh-active-list-query";

describe("refreshActiveListQuery", () => {
	it("invalidates dependent queries and then awaits the active query refetch", async () => {
		const queryClient = {
			invalidateQueries: vi.fn(async () => undefined),
		} as unknown as QueryClient;
		const refetchActiveQuery = vi.fn(async () => ({ data: [] }));

		await refreshActiveListQuery(queryClient, {
			exactQueryKey: ["roles", 1, 10],
			invalidationKeys: [["roles"], ["user-role"]],
			refetchActiveQuery,
		});

		const thirdInvalidationCallOrder = vi.mocked(queryClient.invalidateQueries).mock.invocationCallOrder[2];
		const refetchCallOrder = vi.mocked(refetchActiveQuery).mock.invocationCallOrder[0];

		expect(queryClient.invalidateQueries).toHaveBeenNthCalledWith(1, {
			exact: true,
			queryKey: ["roles", 1, 10],
			refetchType: "none",
		});
		expect(queryClient.invalidateQueries).toHaveBeenNthCalledWith(2, {
			queryKey: ["roles"],
			refetchType: "none",
		});
		expect(queryClient.invalidateQueries).toHaveBeenNthCalledWith(3, {
			queryKey: ["user-role"],
			refetchType: "none",
		});
		expect(refetchActiveQuery).toHaveBeenCalledTimes(1);
		expect(thirdInvalidationCallOrder).toBeDefined();
		expect(refetchCallOrder).toBeDefined();
		expect(thirdInvalidationCallOrder!).toBeLessThan(refetchCallOrder!);
	});
});