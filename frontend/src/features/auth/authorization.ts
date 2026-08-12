/* eslint-disable camelcase -- Canonical API role codes intentionally use snake_case. */
export const CANONICAL_ROLES = [
	"cl_admin",
	"rp_admin",
	"rp_user_edit",
	"read_only",
] as const;

export type CanonicalRole = (typeof CANONICAL_ROLES)[number];
export type GlobalRole = Extract<CanonicalRole, "cl_admin">;
export type PartnerRole = Exclude<CanonicalRole, GlobalRole>;

export type PartnerAuthorizationScope = {
	role: PartnerRole;
	workspaceUuid: string;
};

export type AuthorizationContext = {
	globalRole: GlobalRole | null;
	partnerAccess: Array<PartnerAuthorizationScope>;
};

export const CAPABILITIES = [
	"platform_governance",
	"partner_bootstrap",
	"cl_admin_assignment",
	"rp_admin_assignment",
	"partner_staff_assignment",
	"cross_workspace_metadata_read",
	"onboarding_oversight_read",
	"production_review",
	"workspace_metadata_read",
	"workspace_metadata_write",
	"application_information_read",
	"application_information_write",
	"rp_configuration_read",
	"rp_configuration_write",
	"partner_secret_read",
	"partner_secret_lifecycle",
	"promotion_request_write",
	"cats_fields_write",
	"mau_report_read",
	"aggregate_report_read",
	"partner_audit_read",
	"partner_audit_sensitive_fields_read",
	"partner_invitation_manage",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

const ROLE_CAPABILITIES: Readonly<
	Record<CanonicalRole, ReadonlySet<Capability>>
> = {
	cl_admin: new Set<Capability>([
		"platform_governance",
		"partner_bootstrap",
		"cl_admin_assignment",
		"rp_admin_assignment",
		"partner_staff_assignment",
		"cross_workspace_metadata_read",
		"onboarding_oversight_read",
		"production_review",
		"aggregate_report_read",
	]),
	read_only: new Set<Capability>([
		"workspace_metadata_read",
		"application_information_read",
		"rp_configuration_read",
		"mau_report_read",
		"aggregate_report_read",
		"partner_audit_read",
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
		"promotion_request_write",
		"cats_fields_write",
		"mau_report_read",
		"aggregate_report_read",
		"partner_audit_read",
		"partner_audit_sensitive_fields_read",
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
		"promotion_request_write",
		"cats_fields_write",
		"mau_report_read",
		"aggregate_report_read",
		"partner_audit_read",
		"partner_audit_sensitive_fields_read",
	]),
};

export const ROLE_LABEL_KEYS: Readonly<Record<CanonicalRole, string>> = {
	cl_admin: "authorization.roles.clAdmin",
	read_only: "authorization.roles.readOnly",
	rp_admin: "authorization.roles.rpAdmin",
	rp_user_edit: "authorization.roles.rpUserEdit",
};

export const roleAllows = (
	role: CanonicalRole,
	capability: Capability
): boolean => ROLE_CAPABILITIES[role]?.has(capability) === true;

export const getPartnerAccessForWorkspace = (
	context: AuthorizationContext | null | undefined,
	workspaceUuid: string
): PartnerAuthorizationScope | null =>
	context?.partnerAccess.find(
		(access) => access.workspaceUuid === workspaceUuid
	) ?? null;

export const hasPartnerAccess = (
	context: AuthorizationContext | null | undefined
): boolean => (context?.partnerAccess.length ?? 0) > 0;

export const isClAdmin = (
	context: AuthorizationContext | null | undefined
): boolean => context?.globalRole === "cl_admin";

export const hasCapability = (
	context: AuthorizationContext | null | undefined,
	capability: Capability,
	workspaceUuid?: string
): boolean => {
	if (!context) {
		return false;
	}

	if (
		context.globalRole !== null &&
		roleAllows(context.globalRole, capability)
	) {
		return true;
	}

	return context.partnerAccess.some(
		(access) =>
			(workspaceUuid === undefined || access.workspaceUuid === workspaceUuid) &&
			roleAllows(access.role, capability)
	);
};

export const canReadWorkspace = (
	context: AuthorizationContext | null | undefined,
	workspaceUuid?: string
): boolean =>
	hasCapability(context, "cross_workspace_metadata_read") ||
	hasCapability(context, "workspace_metadata_read", workspaceUuid);

export const canReadApplicationInformation = (
	context: AuthorizationContext | null | undefined,
	workspaceUuid: string
): boolean =>
	hasCapability(context, "cross_workspace_metadata_read") ||
	hasCapability(context, "application_information_read", workspaceUuid);

export const canReadRPApplication = (
	context: AuthorizationContext | null | undefined,
	workspaceUuid: string
): boolean =>
	hasCapability(context, "cross_workspace_metadata_read") ||
	hasCapability(context, "rp_configuration_read", workspaceUuid);

export const getEffectiveRoleForWorkspace = (
	context: AuthorizationContext | null | undefined,
	workspaceUuid: string
): CanonicalRole | null =>
	context?.globalRole ??
	getPartnerAccessForWorkspace(context, workspaceUuid)?.role ??
	null;
