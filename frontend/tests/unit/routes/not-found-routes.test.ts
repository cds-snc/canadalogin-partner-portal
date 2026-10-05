import { describe, expect, it } from "vitest";
import { Route as CatchAllRoute } from "@/routes/$";
import { Route as ErrorRoute } from "@/routes/error";

const captureRedirect = (callback: () => void): unknown => {
	try {
		callback();
	} catch (error) {
		return error;
	}

	throw new Error("Expected route to redirect");
};

describe("not-found routes", () => {
	it("redirects unmatched URLs to the canonical 404 route", () => {
		const beforeLoad = (CatchAllRoute as any).options?.beforeLoad;
		expect(beforeLoad).toBeTypeOf("function");

		const redirect = captureRedirect(() => beforeLoad({}));

		expect(redirect).toMatchObject({
			options: { to: "/404", replace: true },
		});
	});

	it("redirects the legacy not-found error route to /404", () => {
		const beforeLoad = (ErrorRoute as any).options?.beforeLoad;
		expect(beforeLoad).toBeTypeOf("function");

		const redirect = captureRedirect(() =>
			beforeLoad({ search: { kind: "not_found" } })
		);

		expect(redirect).toMatchObject({
			options: { to: "/404", replace: true },
		});
	});
});