import { describe, expect, it } from "vitest";
import {
	CANONICAL_ROLES,
	CAPABILITIES,
	roleAllows,
	type CanonicalRole,
	type Capability,
} from "@/features/auth/authorization";

const EXPECTED_CAPABILITIES: Readonly<
	Record<CanonicalRole, ReadonlySet<Capability>>
> = {
	cl_admin: new Set<Capability>([
		"access_administration",
		"partner_bootstrap",
		"cl_admin_assignment",
		"rp_admin_assignment",
		"partner_staff_assignment",
		"cross_workspace_metadata_read",
		"onboarding_oversight_read",
		"production_review",
	]),
	read_only: new Set<Capability>([
		"workspace_metadata_read",
		"application_information_read",
		"rp_configuration_read",
		"mau_report_read",
	]),
	rp_admin: new Set<Capability>([
		"workspace_metadata_read",
		"workspace_metadata_write",
		"application_information_read",
		"application_information_write",
		"rp_configuration_read",
		"rp_configuration_write",
		"partner_secret_read",
		"partner_secret_lifecycle",
		"production_review_request_write",
		"mau_report_read",
		"partner_invitation_manage",
		"partner_staff_assignment",
	]),
	rp_user_edit: new Set<Capability>([
		"workspace_metadata_read",
		"application_information_read",
		"application_information_write",
		"rp_configuration_read",
		"rp_configuration_write",
		"partner_secret_read",
		"partner_secret_lifecycle",
		"production_review_request_write",
		"mau_report_read",
	]),
};

describe("exhaustive canonical authorization matrix", () => {
	for (const role of CANONICAL_ROLES) {
		for (const capability of CAPABILITIES) {
			it(`${role} ${EXPECTED_CAPABILITIES[role].has(capability) ? "allows" : "denies"} ${capability}`, () => {
				expect(roleAllows(role, capability)).toBe(
					EXPECTED_CAPABILITIES[role].has(capability)
				);
			});
		}
	}

	it("covers every canonical role and capability explicitly", () => {
		expect(Object.keys(EXPECTED_CAPABILITIES).sort()).toEqual(
			[...CANONICAL_ROLES].sort()
		);
		for (const role of CANONICAL_ROLES) {
			for (const capability of EXPECTED_CAPABILITIES[role]) {
				expect(CAPABILITIES).toContain(capability);
			}
		}
	});
});
