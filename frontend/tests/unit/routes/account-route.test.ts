import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireAuthenticatedUser } from "@/features/auth/auth-routing";
import { Route as AccountRoute } from "@/routes/account";

vi.mock("@/features/auth/auth-routing", () => ({
	requireAuthenticatedUser: vi.fn(() => Promise.resolve()),
}));

describe("account route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("reauthorizes direct entry to the focused account page", async () => {
		const beforeLoad = (AccountRoute as any).options?.beforeLoad;

		await beforeLoad({ location: { pathname: "/account" } });

		expect(requireAuthenticatedUser).toHaveBeenCalledWith("/account");
	});
});
