import { describe, expect, it, vi } from "vitest";

const redirectMock = vi.hoisted(() => vi.fn((options: unknown) => options));

vi.mock("@tanstack/react-router", () => ({
	createFileRoute: () => (options: unknown) => ({ options }),
	redirect: redirectMock,
}));

import { Route } from "@/routes/your-applications/index";

describe("Your applications compatibility root", () => {
	it("redirects the retired list destination to Workspaces", () => {
		const beforeLoad = (Route as any).options?.beforeLoad;
		expect(beforeLoad).toBeTypeOf("function");

		expect(() => beforeLoad()).toThrow();
		expect(redirectMock).toHaveBeenCalledWith({
			href: "/workspaces",
			replace: true,
		});
	});
});
