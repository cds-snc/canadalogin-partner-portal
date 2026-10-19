import { describe, expect, it } from "vitest";
import {
	applicationEnvironmentSchema,
	DEFAULT_VALUES,
	toPayload,
} from "@/features/application-environments/pages/connect-environment-form";

const validEnvironment = (
	tenantCode: "test" | "staging",
	environmentName: string
) =>
	applicationEnvironmentSchema.safeParse({
		...DEFAULT_VALUES,
		applicationUrlEn: "https://example.com",
		applicationUrlFr: "https://example.com",
		canDecryptMessages: false,
		canEncryptRequests: false,
		canSignMessages: false,
		clientType: "public",
		copyExisting: false,
		environmentName,
		pkceSupported: true,
		postLogoutRedirectUris: ["https://example.com"],
		redirectUris: ["https://example.com"],
		singleSignOut: tenantCode === "staging",
		logoutMethod: tenantCode === "staging" ? "front_channel" : undefined,
		signOutRequestUrl:
			tenantCode === "staging" ? "https://example.com/sign-out" : "",
		tenantCode,
	});

describe("applicationEnvironmentSchema", () => {
	it.each([
		["test", 59, 60],
		["staging", 56, 57],
	] as const)(
		"enforces the full environment name length for %s",
		(tenantCode, maxSuffixLength, tooLongSuffixLength) => {
			expect(
				validEnvironment(tenantCode, "a".repeat(maxSuffixLength)).success
			).toBe(true);
			expect(
				validEnvironment(tenantCode, "a".repeat(tooLongSuffixLength)).success
			).toBe(false);
		}
	);

	it("requires single sign-out configuration for staging", () => {
		const result = applicationEnvironmentSchema.safeParse({
			...DEFAULT_VALUES,
			applicationUrlEn: "https://example.com",
			applicationUrlFr: "https://example.com",
			canDecryptMessages: false,
			canEncryptRequests: false,
			canSignMessages: false,
			clientType: "public",
			copyExisting: false,
			environmentName: "portal",
			pkceSupported: true,
			postLogoutRedirectUris: ["https://example.com"],
			redirectUris: ["https://example.com"],
			singleSignOut: true,
			tenantCode: "staging",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
				expect.arrayContaining(["logoutMethod", "signOutRequestUrl"])
			);
		}
	});

	it("forces single sign-out on in staging payloads", () => {
		const result = applicationEnvironmentSchema.safeParse({
			...DEFAULT_VALUES,
			applicationUrlEn: "https://example.com",
			applicationUrlFr: "https://example.com",
			canDecryptMessages: false,
			canEncryptRequests: false,
			canSignMessages: false,
			clientAuthMethod: "client_secret_basic",
			clientType: "confidential",
			copyExisting: false,
			environmentName: "portal",
			logoutMethod: "back_channel",
			pkceSupported: true,
			postLogoutRedirectUris: ["https://example.com/logout"],
			redirectUris: ["https://example.com/callback"],
			signOutRequestUrl: "https://example.com/sign-out",
			singleSignOut: true,
			tenantCode: "staging",
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(toPayload(result.data).singleSignOut).toBe(true);
		}
	});
});
