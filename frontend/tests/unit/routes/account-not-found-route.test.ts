import { describe, expect, it } from "vitest";
import { Route } from "@/routes/account-not-found";

describe("account not found route", () => {
	it("renders as a public route without a route-entry guard", () => {
		expect(Route.options?.beforeLoad).toBeUndefined();
		expect(Route.options?.component).toBeTypeOf("function");
	});
});