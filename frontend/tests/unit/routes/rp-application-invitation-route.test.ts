import { describe, expect, it } from "vitest";
import { Route } from "@/routes/invitations/rp-applications";

type ValidateSearch = (search: Record<string, unknown>) => {
	token?: string;
};

describe("rp application invitation route", () => {
	it("preserves the invite token in validated search params", () => {
		const validateSearch = Route.options.validateSearch as ValidateSearch;

		expect(validateSearch).toBeTypeOf("function");
		expect(validateSearch({ token: "raw-invite-token" })).toEqual({
			token: "raw-invite-token",
		});
	});

	it("ignores non-string invite tokens", () => {
		const validateSearch = Route.options.validateSearch as ValidateSearch;

		expect(validateSearch).toBeTypeOf("function");
		expect(validateSearch({ token: 1234 })).toEqual({ token: undefined });
	});
});