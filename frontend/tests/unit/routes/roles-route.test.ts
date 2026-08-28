import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireCapability } from "@/features/auth/auth-routing";
import { Route as RolesRoute } from "@/routes/roles";

vi.mock("@/features/auth/auth-routing", () => ({
	requireCapability: vi.fn(() => Promise.resolve()),
}));

describe("roles route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns to the Administration parent", async () => {
		const beforeLoad = (RolesRoute as any).options?.beforeLoad;

		const context = await beforeLoad({ location: { pathname: "/roles" } });

		expect(requireCapability).toHaveBeenCalledWith(
			"/roles",
			"access_administration"
		);
		expect(context.backLink).toEqual({
			href: "/administration",
			label: "Administration",
		});
	});
});
