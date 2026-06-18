import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { HttpRequestError } from "@/fetch/errors";
import { Route } from "@/routes/rp-applications/mine/$rpApplicationUuid";

const redirectMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("@/fetch/rp-applications", () => ({
	getCurrentUserRPApplicationDepartment: vi.fn(),
}));

vi.mock("@/common/i18n", () => ({
	default: {
		t: (key: string): string => key,
	},
}));

vi.mock("@/features/auth/auth-routing", () => ({
	requireAuthenticatedUser: vi.fn().mockResolvedValue({}),
}));

vi.mock("@tanstack/react-router", () => ({
	createFileRoute: vi.fn().mockReturnValue((opts: unknown) => ({ options: opts })),
	Outlet: (): null => null,
	redirect: (args: unknown): unknown => {
		redirectMock(args);
		const err = new Error("redirect");
		(err as Error & { isRedirect: boolean }).isRedirect = true;
		throw err;
	},
}));

import { getCurrentUserRPApplicationDepartment } from "@/fetch/rp-applications";
const mockedGetDepartment = vi.mocked(getCurrentUserRPApplicationDepartment);

describe("RP application parent route guard", () => {
	beforeAll(() => {
		Object.defineProperty(globalThis, "location", {
			configurable: true,
			value: {
				pathname: "/rp-applications/mine/app-uuid-1",
				href: "/rp-applications/mine/app-uuid-1",
				replace: replaceMock,
			} as Pick<Location, "pathname" | "href" | "replace">,
		});
	});

	afterAll(() => {
		vi.restoreAllMocks();
	});

	it("has a beforeLoad defined", () => {
		expect(Route.options.beforeLoad).toBeTypeOf("function");
	});

	it("redirects to department-setup when departmentId is null", async () => {
		mockedGetDepartment.mockResolvedValue({
			id: 10,
			uuid: "app-uuid-1",
			dnrAppName: "Benefits Portal",
			departmentId: null,
		});

		const beforeLoad = Route.options.beforeLoad as (ctx: {
			params: { rpApplicationUuid: string };
			location: { pathname: string; href: string };
		}) => Promise<unknown>;

		await expect(
			beforeLoad({
				params: { rpApplicationUuid: "app-uuid-1" },
				location: { pathname: "/rp-applications/mine/app-uuid-1", href: "/rp-applications/mine/app-uuid-1" },
			})
		).rejects.toThrow("redirect");

		expect(redirectMock).toHaveBeenCalledWith(
			expect.objectContaining({
				to: "/rp-applications/mine/$rpApplicationUuid/department-setup",
				params: { rpApplicationUuid: "app-uuid-1" },
			})
		);
	});

	it("allows navigation when departmentId is set", async () => {
		mockedGetDepartment.mockResolvedValue({
			id: 10,
			uuid: "app-uuid-1",
			dnrAppName: "Benefits Portal",
			departmentId: 5,
		});

		const beforeLoad = Route.options.beforeLoad as (ctx: {
			params: { rpApplicationUuid: string };
			location: { pathname: string; href: string };
		}) => Promise<unknown>;

		const result = await beforeLoad({
			params: { rpApplicationUuid: "app-uuid-1" },
			location: { pathname: "/rp-applications/mine/app-uuid-1", href: "/rp-applications/mine/app-uuid-1" },
		});

		expect(result).toBeDefined();
		expect((result as { breadcrumbs: unknown[] }).breadcrumbs).toBeDefined();
	});

	it("skips department preflight when on department-setup path", async () => {
		mockedGetDepartment.mockReset();

		const beforeLoad = Route.options.beforeLoad as (ctx: {
			params: { rpApplicationUuid: string };
			location: { pathname: string; href: string };
		}) => Promise<unknown>;

		const result = await beforeLoad({
			params: { rpApplicationUuid: "app-uuid-1" },
			location: {
				pathname: "/rp-applications/mine/app-uuid-1/department-setup",
				href: "/rp-applications/mine/app-uuid-1/department-setup",
			},
		});

		expect(mockedGetDepartment).not.toHaveBeenCalled();
		expect(result).toBeDefined();
	});

	it("does not redirect on 403 preflight error (lets child handle it)", async () => {
		redirectMock.mockClear();
		mockedGetDepartment.mockRejectedValue(
			new HttpRequestError({ status: 403 })
		);

		const beforeLoad = Route.options.beforeLoad as (ctx: {
			params: { rpApplicationUuid: string };
			location: { pathname: string; href: string };
		}) => Promise<unknown>;

		const result = await beforeLoad({
			params: { rpApplicationUuid: "app-uuid-1" },
			location: { pathname: "/rp-applications/mine/app-uuid-1", href: "/rp-applications/mine/app-uuid-1" },
		});

		expect(result).toBeDefined();
		expect(redirectMock).not.toHaveBeenCalled();
	});
});
