import { requestJson } from "@/fetch";
import type {
	AuthenticationProtocolValue,
	ConsolidatorUsedValue,
	CurrentMfaOptionValue,
	CurrentSignInOptionValue,
	IdentityProofingMethodValue,
	PersonalInformationValue,
	UserTypeValue,
} from "@/features/workspaces/application-info-options";

export type ApplicationInfoRead = {
	aboutApplication: string;
	applicationDescription: string;
	applicationName: string;
	applicationUrl: string;
	authorityToCollectPersonalInformation: string;
	authenticationProtocol: AuthenticationProtocolValue;
	consolidatorUsed?: ConsolidatorUsedValue | null;
	createdAt: string;
	createdBy: number | null;
	credentialAssuranceLevel: string;
	currentMfaOptions?: CurrentMfaOptionValue | null;
	currentSignInOptions: Array<CurrentSignInOptionValue>;
	currentSignInOptionsOther?: string | null;
	hasAccessManagementLayer: boolean;
	hasAccountRecovery: boolean;
	hasPrivacyNotice: boolean;
	id: number;
	identityAssuranceLevel: string;
	identityProofingMethod: IdentityProofingMethodValue;
	identityProofingMethodOther?: string | null;
	isCbas: boolean;
	isDeleted: boolean;
	migrationRationale?: string | null;
	monthlyActiveUsers?: number | null;
	peakUsagePeriods?: string | null;
	personalInformationCollected: Array<PersonalInformationValue>;
	personalInformationOther?: string | null;
	plannedOidcImplementationDate?: string | null;
	portalName?: string | null;
	programLineOfBusiness: string;
	rpApplicationUuid?: string | null;
	requestsProfileDataPushes: boolean;
	rollbackStrategy: string;
	scheduleBlackoutPeriods?: string | null;
	techStack: string;
	technology: string;
	transitionMitigations?: string | null;
	transitionRisks?: string | null;
	userTypeOther?: string | null;
	userTypes: Array<UserTypeValue>;
	usesCanadaloginMigration: boolean;
	uuid: string;
	workspaceId: number;
};

export type ApplicationInfoCreate = {
	aboutApplication: string;
	applicationDescription: string;
	applicationName: string;
	applicationUrl: string;
	authorityToCollectPersonalInformation: string;
	authenticationProtocol: AuthenticationProtocolValue;
	credentialAssuranceLevel: string;
	currentSignInOptions: Array<CurrentSignInOptionValue>;
	hasAccessManagementLayer: boolean;
	hasAccountRecovery: boolean;
	hasPrivacyNotice: boolean;
	identityAssuranceLevel: string;
	identityProofingMethod: IdentityProofingMethodValue;
	isCbas: boolean;
	personalInformationCollected: Array<PersonalInformationValue>;
	programLineOfBusiness: string;
	requestsProfileDataPushes: boolean;
	rollbackStrategy: string;
	techStack: string;
	technology: string;
	userTypes: Array<UserTypeValue>;
	usesCanadaloginMigration: boolean;
	consolidatorUsed?: ConsolidatorUsedValue;
	currentMfaOptions?: CurrentMfaOptionValue;
	currentSignInOptionsOther?: string;
	identityProofingMethodOther?: string;
	migrationRationale?: string;
	monthlyActiveUsers?: number;
	peakUsagePeriods?: string;
	personalInformationOther?: string;
	plannedOidcImplementationDate?: string;
	portalName?: string;
	scheduleBlackoutPeriods?: string;
	transitionMitigations?: string;
	transitionRisks?: string;
	userTypeOther?: string;
};

export type ApplicationInfoUpdate = Partial<ApplicationInfoCreate>;

export type ApplicationContactRead = {
	action?: string | null;
	alternatePhoneNumber?: string | null;
	applicationInfoId: number;
	contactRoles: Array<string>;
	contactType?: string | null;
	createdAt: string;
	email: string;
	firstName: string;
	id: number;
	isDeleted: boolean;
	lastName: string;
	phoneNumber: string;
	titleRole: string;
	uuid: string;
};

export type ApplicationContactCreate = {
	email: string;
	firstName: string;
	lastName: string;
	phoneNumber: string;
	titleRole: string;
	contactRoles: Array<string>;
	action?: string;
	alternatePhoneNumber?: string;
	contactType?: string;
};

export type ApplicationContactUpdate = Partial<ApplicationContactCreate>;

export const workspaceApplicationInfoQueryKey = (
	workspaceUuid: string
) => ["workspace-application-info", workspaceUuid] as const;

export const applicationInfoContactsQueryKey = (
	workspaceUuid: string,
	applicationInfoUuid: string
) =>
	[
		"application-info-contacts",
		workspaceUuid,
		applicationInfoUuid,
	] as const;

export const getWorkspaceApplicationInfos = async (
	workspaceUuid: string
): Promise<Array<ApplicationInfoRead>> => {
	const result = await requestJson<Array<ApplicationInfoRead> | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-info`,
		{
			cache: "no-store",
			method: "GET",
		}
	);

	return result ?? [];
};

export const createWorkspaceApplicationInfo = async (
	workspaceUuid: string,
	payload: ApplicationInfoCreate
): Promise<ApplicationInfoRead> => {
	const result = await requestJson<ApplicationInfoRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-info`,
		{
			body: JSON.stringify(payload),
			method: "POST",
		}
	);

	if (!result) {
		throw new Error("Failed to create application information");
	}

	return result;
};

export const updateWorkspaceApplicationInfo = async (
	workspaceUuid: string,
	applicationInfoUuid: string,
	payload: ApplicationInfoUpdate
): Promise<ApplicationInfoRead> => {
	const result = await requestJson<ApplicationInfoRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-info/${encodeURIComponent(applicationInfoUuid)}`,
		{
			body: JSON.stringify(payload),
			method: "PATCH",
		}
	);

	if (!result) {
		throw new Error("Failed to update application information");
	}

	return result;
};

export const deleteWorkspaceApplicationInfo = async (
	workspaceUuid: string,
	applicationInfoUuid: string
): Promise<{ message: string }> => {
	const result = await requestJson<{ message: string } | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-info/${encodeURIComponent(applicationInfoUuid)}`,
		{
			method: "DELETE",
		}
	);

	if (!result) {
		throw new Error("Failed to delete application information");
	}

	return result;
};

export const getWorkspaceApplicationContacts = async (
	workspaceUuid: string,
	applicationInfoUuid: string
): Promise<Array<ApplicationContactRead>> => {
	const result = await requestJson<Array<ApplicationContactRead> | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-info/${encodeURIComponent(applicationInfoUuid)}/contacts`,
		{
			cache: "no-store",
			method: "GET",
		}
	);

	return result ?? [];
};

export const createWorkspaceApplicationContact = async (
	workspaceUuid: string,
	applicationInfoUuid: string,
	payload: ApplicationContactCreate
): Promise<ApplicationContactRead> => {
	const result = await requestJson<ApplicationContactRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-info/${encodeURIComponent(applicationInfoUuid)}/contacts`,
		{
			body: JSON.stringify(payload),
			method: "POST",
		}
	);

	if (!result) {
		throw new Error("Failed to create application contact");
	}

	return result;
};

export const updateWorkspaceApplicationContact = async (
	workspaceUuid: string,
	applicationInfoUuid: string,
	applicationContactUuid: string,
	payload: ApplicationContactUpdate
): Promise<ApplicationContactRead> => {
	const result = await requestJson<ApplicationContactRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-info/${encodeURIComponent(applicationInfoUuid)}/contacts/${encodeURIComponent(applicationContactUuid)}`,
		{
			body: JSON.stringify(payload),
			method: "PATCH",
		}
	);

	if (!result) {
		throw new Error("Failed to update application contact");
	}

	return result;
};

export const deleteWorkspaceApplicationContact = async (
	workspaceUuid: string,
	applicationInfoUuid: string,
	applicationContactUuid: string
): Promise<{ message: string }> => {
	const result = await requestJson<{ message: string } | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-info/${encodeURIComponent(applicationInfoUuid)}/contacts/${encodeURIComponent(applicationContactUuid)}`,
		{
			method: "DELETE",
		}
	);

	if (!result) {
		throw new Error("Failed to delete application contact");
	}

	return result;
};