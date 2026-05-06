import { describe, expect, it } from "vitest";
import { Route } from "@/routes/login";

describe("login route", () => {
	it("does not gate the login page behind a beforeLoad auth redirect", () => {
		expect(Route.options.beforeLoad).toBeUndefined();
	});

	it("derives the finalized login notice from validated search state", () => {
    const loader = (Route as any).options?.loader;

    expect(loader).toBeTypeOf("function");

    expect(
        loader({
            deps: {
                search: {
                    message: "session-expired",
                    reason: "unauthorized",
                },
            },
        }),
    ).toEqual({
        loginNotice: {
            bodyKey: "login.unauthorizedBody",
            titleKey: "login.unauthorizedTitle",
        },
    });
	});
});
