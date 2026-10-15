import { describe, expect, it } from "vitest";
import {
	applicationEnvironmentSchema,
	DEFAULT_VALUES,
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
		sharesIdentifier: false,
		singleSignOut: false,
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
});
