import { requestJson } from "@/fetch";
import type { ApiMessageResponse } from "./api-types";

export type WorkspaceCreate = {
	departmentUuid: string;
	name: string;
	slug?: string | null;
	description?: string | null;
};

export type WorkspaceUpdate = {
	departmentUuid?: string | null;
	name?: string;
	slug?: string | null;
	description?: string | null;
};

export type WorkspaceRead = {
	id: number;
	uuid: string;
	name: string;
	slug: string;
	departmentId: number;
	description: string | null;
	onboardingState?: string | null;
	submittedAt?: string | null;
	underReviewAt?: string | null;
	approvedAt?: string | null;
	launchedAt?: string | null;
	createdAt: string;
	updatedAt: string | null;
	deletedAt: string | null;
	isDeleted: boolean;
	createdBy: number | null;
};

export type ApplicationInformationCreate = {
	migrationOrTransitionPlan: string;
	overview: string;
	securityAndPrivacy: string;
	serviceNameEn: string;
	serviceNameFr: string;
	technologyAndProtocol: string;
	usage: string;
};

export type ApplicationInformationUpdate = {
	migrationOrTransitionPlan?: string;
	overview?: string;
	securityAndPrivacy?: string;
	serviceNameEn?: string;
	serviceNameFr?: string;
	technologyAndProtocol?: string;
	usage?: string;
};

export type ApplicationInformationRead = {
	id: number;
	uuid: string;
	workspaceId: number;
	createdBy: number | null;
	serviceNameEn: string;
	serviceNameFr: string;
	overview: string;
	technologyAndProtocol: string;
	securityAndPrivacy: string;
	usage: string;
	migrationOrTransitionPlan: string;
	onboardingState?: string | null;
	submittedAt?: string | null;
	underReviewAt?: string | null;
	approvedAt?: string | null;
	launchedAt?: string | null;
	createdAt: string;
	updatedAt: string | null;
	deletedAt: string | null;
	isDeleted: boolean;
};

export type ApplicationInformationContactCreate = {
	email: string;
	firstName: string;
	lastName: string;
	phoneNumber?: string | null;
	alternatePhoneNumber?: string | null;
	responsibilityEn: string;
	responsibilityFr: string;
};

export type ApplicationInformationContactUpdate = {
	email?: string;
	firstName?: string;
	lastName?: string;
	phoneNumber?: string | null;
	alternatePhoneNumber?: string | null;
	responsibilityEn?: string;
	responsibilityFr?: string;
};

export type ApplicationInformationContactRead = {
	id: number;
	uuid: string;
	applicationInformationId: number;
	createdBy: number | null;
	email: string;
	nameEn: string | null;
	nameFr: string | null;
	firstName?: string | null;
	lastName?: string | null;
	phoneNumber: string | null;
	alternatePhoneNumber?: string | null;
	responsibilityEn: string;
	responsibilityFr: string;
	identityConfirmedAt?: string | null;
	identityConfirmedByUserUuid?: string | null;
	identityConfirmationRequired: boolean;
	createdAt: string;
	updatedAt: string | null;
	deletedAt: string | null;
	isDeleted: boolean;
};

export type ApplicationInformationReviewChecklistStatus =
	"not_started" | "incomplete" | "complete";

export type ApplicationInformationReviewDisposition =
	"pending" | "changes_requested" | "ready_for_next_step";

export type ApplicationInformationReviewNoteCreate = {
	body: string;
};

export type ApplicationInformationReviewNoteRead = {
	id: number;
	uuid: string;
	applicationInformationId: number;
	body: string;
	authorName: string | null;
	authorEmail: string | null;
	authorUserUuid: string | null;
	createdAt: string;
	updatedAt: string | null;
};

export type ApplicationInformationReviewChecklistSummaryWrite = {
	reviewDisposition: ApplicationInformationReviewDisposition;
	applicationInformationStatus: ApplicationInformationReviewChecklistStatus;
	contactsStatus: ApplicationInformationReviewChecklistStatus;
	environmentRegistrationStatus: ApplicationInformationReviewChecklistStatus;
	promotionMetadataStatus: ApplicationInformationReviewChecklistStatus;
	evidenceReferenceStatus: ApplicationInformationReviewChecklistStatus;
	processLinksStatus: ApplicationInformationReviewChecklistStatus;
	rationale?: string | null;
};

export type ApplicationInformationReviewChecklistSummaryRead = {
	id: number;
	uuid: string;
	applicationInformationId: number;
	reviewDisposition: ApplicationInformationReviewDisposition;
	applicationInformationStatus: ApplicationInformationReviewChecklistStatus;
	contactsStatus: ApplicationInformationReviewChecklistStatus;
	environmentRegistrationStatus: ApplicationInformationReviewChecklistStatus;
	promotionMetadataStatus: ApplicationInformationReviewChecklistStatus;
	evidenceReferenceStatus: ApplicationInformationReviewChecklistStatus;
	processLinksStatus: ApplicationInformationReviewChecklistStatus;
	rationale: string | null;
	reviewedByName: string | null;
	reviewedByUserUuid: string | null;
	createdAt: string;
	updatedAt: string | null;
};

export type ApplicationInformationReviewContextRead = {
	notes: Array<ApplicationInformationReviewNoteRead>;
	checklistSummary: ApplicationInformationReviewChecklistSummaryRead | null;
};

export const getWorkspaces = async (): Promise<Array<WorkspaceRead>> => {
	const result = await requestJson<Array<WorkspaceRead> | null>(
		"/api/v1/workspaces",
		{
			cache: "no-store",
			method: "GET",
		}
	);
	return result ?? [];
};

export const getCurrentUserWorkspaces = async (): Promise<
	Array<WorkspaceRead>
> => {
	const result = await requestJson<Array<WorkspaceRead> | null>(
		"/api/v1/workspaces/mine",
		{
			cache: "no-store",
			method: "GET",
		}
	);
	return result ?? [];
};

export const createWorkspace = async (
	payload: WorkspaceCreate
): Promise<WorkspaceRead> => {
	const result = await requestJson<WorkspaceRead | null>("/api/v1/workspaces", {
		body: JSON.stringify(payload),
		method: "POST",
	});
	if (!result) {
		throw new Error("Failed to create workspace");
	}
	return result;
};

export const updateWorkspace = async (
	workspaceUuid: string,
	payload: WorkspaceUpdate
): Promise<WorkspaceRead> => {
	const result = await requestJson<WorkspaceRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}`,
		{
			body: JSON.stringify(payload),
			method: "PATCH",
		}
	);
	if (!result) {
		throw new Error("Failed to update workspace");
	}
	return result;
};

export const deleteWorkspace = async (
	workspaceUuid: string
): Promise<ApiMessageResponse> => {
	const result = await requestJson<ApiMessageResponse | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}`,
		{
			method: "DELETE",
		}
	);
	if (!result) {
		throw new Error("Failed to delete workspace");
	}
	return result;
};

export const getWorkspace = async (
	workspaceUuid: string
): Promise<WorkspaceRead> => {
	const result = await requestJson<WorkspaceRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}`,
		{
			cache: "no-store",
			method: "GET",
		}
	);
	if (!result) {
		throw new Error("Workspace not found");
	}
	return result;
};

export const getApplicationInformationList = async (
	workspaceUuid: string
): Promise<Array<ApplicationInformationRead>> => {
	const result = await requestJson<Array<ApplicationInformationRead> | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-information`,
		{
			cache: "no-store",
			method: "GET",
		}
	);
	return result ?? [];
};

export const getApplicationInformation = async (
	workspaceUuid: string,
	applicationInformationUuid: string
): Promise<ApplicationInformationRead> => {
	const result = await requestJson<ApplicationInformationRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-information/${encodeURIComponent(applicationInformationUuid)}`,
		{
			cache: "no-store",
			method: "GET",
		}
	);
	if (!result) {
		throw new Error("Application information not found");
	}
	return result;
};

export const createApplicationInformation = async (
	workspaceUuid: string,
	payload: ApplicationInformationCreate
): Promise<ApplicationInformationRead> => {
	const result = await requestJson<ApplicationInformationRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-information`,
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

export const updateApplicationInformation = async (
	workspaceUuid: string,
	applicationInformationUuid: string,
	payload: ApplicationInformationUpdate
): Promise<ApplicationInformationRead> => {
	const result = await requestJson<ApplicationInformationRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-information/${encodeURIComponent(applicationInformationUuid)}`,
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

export const deleteApplicationInformation = async (
	workspaceUuid: string,
	applicationInformationUuid: string
): Promise<ApiMessageResponse> => {
	const result = await requestJson<ApiMessageResponse | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-information/${encodeURIComponent(applicationInformationUuid)}`,
		{
			method: "DELETE",
		}
	);
	if (!result) {
		throw new Error("Failed to delete application information");
	}
	return result;
};

export const getApplicationInformationContacts = async (
	workspaceUuid: string,
	applicationInformationUuid: string
): Promise<Array<ApplicationInformationContactRead>> => {
	const result =
		await requestJson<Array<ApplicationInformationContactRead> | null>(
			`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-information/${encodeURIComponent(applicationInformationUuid)}/contacts`,
			{
				cache: "no-store",
				method: "GET",
			}
		);
	return result ?? [];
};

export const createApplicationInformationContact = async (
	workspaceUuid: string,
	applicationInformationUuid: string,
	payload: ApplicationInformationContactCreate
): Promise<ApplicationInformationContactRead> => {
	const result = await requestJson<ApplicationInformationContactRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-information/${encodeURIComponent(applicationInformationUuid)}/contacts`,
		{
			body: JSON.stringify(payload),
			method: "POST",
		}
	);
	if (!result) {
		throw new Error("Failed to create application information contact");
	}
	return result;
};

export const updateApplicationInformationContact = async (
	workspaceUuid: string,
	applicationInformationUuid: string,
	contactUuid: string,
	payload: ApplicationInformationContactUpdate
): Promise<ApplicationInformationContactRead> => {
	const result = await requestJson<ApplicationInformationContactRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-information/${encodeURIComponent(applicationInformationUuid)}/contacts/${encodeURIComponent(contactUuid)}`,
		{
			body: JSON.stringify(payload),
			method: "PATCH",
		}
	);
	if (!result) {
		throw new Error("Failed to update application information contact");
	}
	return result;
};

export const deleteApplicationInformationContact = async (
	workspaceUuid: string,
	applicationInformationUuid: string,
	contactUuid: string
): Promise<ApiMessageResponse> => {
	const result = await requestJson<ApiMessageResponse | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-information/${encodeURIComponent(applicationInformationUuid)}/contacts/${encodeURIComponent(contactUuid)}`,
		{
			method: "DELETE",
		}
	);
	if (!result) {
		throw new Error("Failed to delete application information contact");
	}
	return result;
};

export const getApplicationInformationReviewContext = async (
	workspaceUuid: string,
	applicationInformationUuid: string
): Promise<ApplicationInformationReviewContextRead> => {
	const result =
		await requestJson<ApplicationInformationReviewContextRead | null>(
			`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-information/${encodeURIComponent(applicationInformationUuid)}/review`,
			{
				cache: "no-store",
				method: "GET",
			}
		);
	if (!result) {
		throw new Error("Failed to load application information review context");
	}
	return result;
};

export const createApplicationInformationReviewNote = async (
	workspaceUuid: string,
	applicationInformationUuid: string,
	payload: ApplicationInformationReviewNoteCreate
): Promise<ApplicationInformationReviewNoteRead> => {
	const result = await requestJson<ApplicationInformationReviewNoteRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-information/${encodeURIComponent(applicationInformationUuid)}/review/notes`,
		{
			body: JSON.stringify(payload),
			method: "POST",
		}
	);
	if (!result) {
		throw new Error("Failed to create application information review note");
	}
	return result;
};

export const upsertApplicationInformationReviewChecklistSummary = async (
	workspaceUuid: string,
	applicationInformationUuid: string,
	payload: ApplicationInformationReviewChecklistSummaryWrite
): Promise<ApplicationInformationReviewChecklistSummaryRead> => {
	const result =
		await requestJson<ApplicationInformationReviewChecklistSummaryRead | null>(
			`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/application-information/${encodeURIComponent(applicationInformationUuid)}/review/checklist`,
			{
				body: JSON.stringify(payload),
				method: "PUT",
			}
		);
	if (!result) {
		throw new Error(
			"Failed to update application information review checklist"
		);
	}
	return result;
};
