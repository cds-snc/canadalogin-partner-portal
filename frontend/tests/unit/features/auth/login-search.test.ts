import { describe, expect, it } from "vitest";
import {
	buildLoginLocation,
	type LoginRedirectSearch,
	parseLoginReason,
	sanitizeAppPath,
} from "@/features/auth/login-search";

describe("login-search", () => {
	it("accepts the unauthorized login reason", () => {
		expect(parseLoginReason("unauthorized")).toBe("unauthorized");
	});

	it("builds a login location with a safe redirect and message key", () => {
		const location = buildLoginLocation({
			message: "session-expired",
			reason: "unauthorized",
			redirect: "/your-applications",
		} satisfies LoginRedirectSearch);

		expect(location).toEqual({
			search: {
				message: "session-expired",
				reason: "unauthorized",
				redirect: "/your-applications",
			},
			to: "/",
		});
	});

	it("rejects external redirect targets", () => {
		const location = buildLoginLocation({
			reason: "unauthorized",
			redirect: "https://evil.example",
		} satisfies LoginRedirectSearch);

		expect(location.search.redirect).toBe("/");
	});

	it.each([
		"//evil.example/path",
		"/\\evil.example/path",
		"javascript:alert(1)",
		"/unknown-product-route",
	])("rejects unsafe or unknown intended destination %s", (target) => {
		expect(sanitizeAppPath(target, "/support")).toBe("/support");
	});

	it("keeps an allowlisted dynamic path while dropping client-authored query state", () => {
		expect(
			sanitizeAppPath(
				"/workspaces/workspace-uuid/settings?role=cl_admin&token=secret"
			)
		).toBe("/workspaces/workspace-uuid/settings");
	});

	it("preserves a tokenized invitation path without copying extra query state", () => {
		expect(
			sanitizeAppPath(
				"/invitations/rp-applications/token-123?capability=platform_governance"
			)
		).toBe("/invitations/rp-applications/token-123");
	});
});
