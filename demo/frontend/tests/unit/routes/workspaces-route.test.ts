import { describe, expect, it } from "vitest";
import { validateSearch } from "../../../../src/routes/invitations/rp-applications";

describe("invitation route search", () => {
	it("keeps token when present", () => {
		expect(validateSearch({ token: "abc" })).toEqual({ token: "abc" });
	});

	it("drops non-string token", () => {
		expect(validateSearch({ token: 123 })).toEqual({ token: undefined });
	});
});