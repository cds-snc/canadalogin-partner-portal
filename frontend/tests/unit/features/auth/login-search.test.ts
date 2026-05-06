import { describe, expect, it } from "vitest";
import {
	buildLoginLocation,
	type LoginRedirectSearch,
	parseLoginReason,
} from "@/features/auth/login-search";

describe("login-search", () => {
	it("accepts the unauthorized login reason", () => {
		expect(parseLoginReason("unauthorized")).toBe("unauthorized");
	});

	it("builds a login location with a safe redirect and message key", () => {
		const location = buildLoginLocation({
			message: "session-expired",
			reason: "unauthorized",
			redirect: "/dashboard",
		} satisfies LoginRedirectSearch);

		expect(location).toEqual({
			search: {
				message: "session-expired",
				reason: "unauthorized",
				redirect: "/dashboard",
			},
			to: "/login",
		});
	});

	it("rejects external redirect targets", () => {
		const location = buildLoginLocation({
			reason: "unauthorized",
			redirect: "https://evil.example",
		} satisfies LoginRedirectSearch);

		expect(location.search.redirect).toBe("/dashboard");
	});
});