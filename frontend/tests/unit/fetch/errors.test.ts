import { describe, expect, it } from "vitest";
import { BadRequestError, getRequestErrorMessage } from "@/fetch";

describe("getRequestErrorMessage", () => {
	it("returns the backend-provided request error message when available", () => {
		expect(
			getRequestErrorMessage(
				new BadRequestError({ detail: "department_uuid is required" }),
				"Something went wrong"
			)
		).toBe("department_uuid is required");
	});

	it("falls back when the thrown value is not an Error", () => {
		expect(getRequestErrorMessage(null, "Something went wrong")).toBe(
			"Something went wrong"
		);
	});
});