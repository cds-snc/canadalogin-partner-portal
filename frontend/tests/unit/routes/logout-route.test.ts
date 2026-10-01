import { describe, expect, it } from "vitest";
import { Route } from "@/routes/logout";

describe("logout route", (): void => {
	it("maps only the session-expired reason to the logout page", (): void => {
		const validateSearch = (Route as any).options?.validateSearch;
		expect(validateSearch).toBeTypeOf("function");
		expect(validateSearch({ reason: "session-expired" })).toEqual({
			reason: "session-expired",
		});
		expect(validateSearch({ reason: "manual" })).toEqual({ reason: undefined });
		expect(validateSearch({})).toEqual({ reason: undefined });
	});
});