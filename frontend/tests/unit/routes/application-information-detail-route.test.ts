import { describe, expect, it } from "vitest";
import { Route } from "@/routes/workspaces/$workspaceUuid/application-information/$applicationInformationUuid";

describe("application-information detail parent route", () => {
	it("normalizes search flags for create and update success states", () => {
		const validateSearch = (Route as any).options?.validateSearch;
		expect(validateSearch).toBeTypeOf("function");

		expect(validateSearch({ created: "1" })).toEqual({
			created: "1",
			updated: undefined,
		});
		expect(validateSearch({ updated: "1" })).toEqual({
			created: undefined,
			updated: "1",
		});
		expect(validateSearch({ created: "0", updated: "nope" })).toEqual({
			created: undefined,
			updated: undefined,
		});
	});
});