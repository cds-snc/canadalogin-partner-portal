import { describe, expect, it } from "vitest";
import { Route } from "@/routes/error";

describe("error route", () => {
	it("maps known kinds and falls back unknown values to unexpected", () => {
		const validateSearch = (Route as any).options?.validateSearch;
		expect(validateSearch).toBeTypeOf("function");

		expect(validateSearch({ kind: "not_found" })).toEqual({
			kind: "not_found",
		});
		expect(validateSearch({ kind: "unexpected" })).toEqual({
			kind: "unexpected",
		});
		expect(validateSearch({ kind: "anything-else" })).toEqual({
			kind: "unexpected",
		});
		expect(validateSearch({})).toEqual({ kind: "unexpected" });
	});
});
