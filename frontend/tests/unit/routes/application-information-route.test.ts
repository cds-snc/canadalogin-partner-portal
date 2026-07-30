import { describe, expect, it } from "vitest";
import { Route } from "@/routes/workspaces/$workspaceUuid/application-information";

describe("application-information parent route", () => {
	it("normalizes search flags for delete success state", () => {
		const validateSearch = (Route as any).options?.validateSearch;
		expect(validateSearch).toBeTypeOf("function");

		expect(validateSearch({ deleted: "1" })).toEqual({
			deleted: "1",
		});
		expect(validateSearch({ deleted: "0" })).toEqual({
			deleted: undefined,
		});
	});
});