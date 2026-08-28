import { describe, expect, it } from "vitest";
import { Route } from "@/routes/workspaces/$workspaceUuid/applications";

describe("application-information parent route", () => {
	it("normalizes collection and detail success flags", () => {
		const validateSearch = (Route as any).options?.validateSearch;
		expect(validateSearch).toBeTypeOf("function");

		expect(
			validateSearch({ created: "1", deleted: "1", updated: "1" })
		).toEqual({
			created: "1",
			deleted: "1",
			updated: "1",
		});
		expect(validateSearch({ deleted: "0" })).toEqual({
			created: undefined,
			deleted: undefined,
			updated: undefined,
		});
	});
});
