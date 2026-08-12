import { describe, expect, it } from "vitest";
import {
	canReadApplicationInformation,
	canReadRPApplication,
	canReadWorkspace,
	getEffectiveRoleForWorkspace,
	hasCapability,
	roleAllows,
	type AuthorizationContext,
	type PartnerRole,
} from "@/features/auth/authorization";

const WORKSPACE_UUID = "workspace-1";
const OTHER_WORKSPACE_UUID = "workspace-2";

const partnerContext = (role: PartnerRole): AuthorizationContext => ({
	globalRole: null,
	partnerAccess: [{ role, workspaceUuid: WORKSPACE_UUID }],
});

describe("canonical authorization matrix", () => {
	it("keeps CL Admin global and metadata-only for partner resources", () => {
		const context: AuthorizationContext = {
			globalRole: "cl_admin",
			partnerAccess: [],
		};

		expect(hasCapability(context, "platform_governance")).toBe(true);
		expect(canReadWorkspace(context, OTHER_WORKSPACE_UUID)).toBe(true);
		expect(canReadApplicationInformation(context, OTHER_WORKSPACE_UUID)).toBe(
			true
		);
		expect(canReadRPApplication(context, OTHER_WORKSPACE_UUID)).toBe(true);
		expect(hasCapability(context, "partner_secret_read", WORKSPACE_UUID)).toBe(
			false
		);
		expect(getEffectiveRoleForWorkspace(context, WORKSPACE_UUID)).toBe(
			"cl_admin"
		);
	});

	it("grants RP Admin workspace administration only in the assigned workspace", () => {
		const context = partnerContext("rp_admin");

		expect(
			hasCapability(context, "partner_staff_assignment", WORKSPACE_UUID)
		).toBe(true);
		expect(
			hasCapability(context, "partner_invitation_manage", WORKSPACE_UUID)
		).toBe(true);
		expect(
			hasCapability(context, "rp_configuration_write", OTHER_WORKSPACE_UUID)
		).toBe(false);
	});

	it("grants RP User (Edit) editor actions without staff or invitation management", () => {
		const context = partnerContext("rp_user_edit");

		expect(
			hasCapability(context, "application_information_write", WORKSPACE_UUID)
		).toBe(true);
		expect(
			hasCapability(context, "partner_secret_lifecycle", WORKSPACE_UUID)
		).toBe(true);
		expect(
			hasCapability(context, "partner_staff_assignment", WORKSPACE_UUID)
		).toBe(false);
		expect(
			hasCapability(context, "partner_invitation_manage", WORKSPACE_UUID)
		).toBe(false);
	});

	it("keeps Read Only non-mutating while allowing bounded reports and audit", () => {
		const context = partnerContext("read_only");

		expect(
			hasCapability(context, "rp_configuration_read", WORKSPACE_UUID)
		).toBe(true);
		expect(hasCapability(context, "mau_report_read", WORKSPACE_UUID)).toBe(
			true
		);
		expect(hasCapability(context, "partner_audit_read", WORKSPACE_UUID)).toBe(
			true
		);
		expect(
			hasCapability(context, "rp_configuration_write", WORKSPACE_UUID)
		).toBe(false);
		expect(hasCapability(context, "partner_secret_read", WORKSPACE_UUID)).toBe(
			false
		);
	});

	it("denies users with no canonical access", () => {
		const context: AuthorizationContext = {
			globalRole: null,
			partnerAccess: [],
		};

		expect(canReadWorkspace(context, WORKSPACE_UUID)).toBe(false);
		expect(canReadApplicationInformation(context, WORKSPACE_UUID)).toBe(false);
		expect(canReadRPApplication(context, WORKSPACE_UUID)).toBe(false);
		expect(getEffectiveRoleForWorkspace(context, WORKSPACE_UUID)).toBe(null);
	});

	it("denies every partner role in the wrong workspace", () => {
		for (const role of ["rp_admin", "rp_user_edit", "read_only"] as const) {
			const context = partnerContext(role);
			expect(canReadWorkspace(context, OTHER_WORKSPACE_UUID)).toBe(false);
			expect(canReadApplicationInformation(context, OTHER_WORKSPACE_UUID)).toBe(
				false
			);
			expect(canReadRPApplication(context, OTHER_WORKSPACE_UUID)).toBe(false);
		}
	});

	it("exposes the immutable matrix through roleAllows", () => {
		expect(roleAllows("cl_admin", "production_review")).toBe(true);
		expect(roleAllows("rp_admin", "partner_invitation_manage")).toBe(true);
		expect(roleAllows("rp_user_edit", "application_information_write")).toBe(
			true
		);
		expect(roleAllows("read_only", "application_information_write")).toBe(
			false
		);
	});
});
