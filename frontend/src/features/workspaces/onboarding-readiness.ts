import type {
	ApplicationInformationContactRead,
	ApplicationInformationRead,
} from "@/fetch/workspaces";

export type ApplicationInformationReadinessStatus =
	| "not_started"
	| "incomplete"
	| "complete";

export type ApplicationInformationReadinessKey =
	| "service_identity"
	| "business_context"
	| "technical_integration"
	| "security_posture"
	| "migration_planning"
	| "contacts";

export type ApplicationInformationReadinessItem = {
	key: ApplicationInformationReadinessKey;
	status: ApplicationInformationReadinessStatus;
};

export type ApplicationInformationReadinessSummary = {
	items: Array<ApplicationInformationReadinessItem>;
	submitReady: boolean;
};

const hasContent = (value: string | null | undefined): boolean =>
	typeof value === "string" && value.trim().length > 0;

const getStatusFromPresence = (
	presence: Array<boolean>
): ApplicationInformationReadinessStatus => {
	const completedCount = presence.filter(Boolean).length;

	if (completedCount === 0) {
		return "not_started";
	}

	if (completedCount === presence.length) {
		return "complete";
	}

	return "incomplete";
};

const isCompleteContact = (
	contact: ApplicationInformationContactRead
): boolean =>
	hasContent(contact.nameEn) &&
	hasContent(contact.nameFr) &&
	hasContent(contact.email) &&
	hasContent(contact.responsibilityEn) &&
	hasContent(contact.responsibilityFr);

export const getApplicationInformationReadinessSummary = (
	applicationInformation: ApplicationInformationRead,
	contacts: Array<ApplicationInformationContactRead>
): ApplicationInformationReadinessSummary => {
	const items: Array<ApplicationInformationReadinessItem> = [
		{
			key: "service_identity",
			status: getStatusFromPresence([
				hasContent(applicationInformation.serviceNameEn),
				hasContent(applicationInformation.serviceNameFr),
			]),
		},
		{
			key: "business_context",
			status: getStatusFromPresence([
				hasContent(applicationInformation.overview),
				hasContent(applicationInformation.usage),
			]),
		},
		{
			key: "technical_integration",
			status: getStatusFromPresence([
				hasContent(applicationInformation.technologyAndProtocol),
			]),
		},
		{
			key: "security_posture",
			status: getStatusFromPresence([
				hasContent(applicationInformation.securityAndPrivacy),
			]),
		},
		{
			key: "migration_planning",
			status: getStatusFromPresence([
				hasContent(applicationInformation.migrationOrTransitionPlan),
			]),
		},
		{
			key: "contacts",
			status:
				contacts.length === 0
					? "not_started"
					: contacts.every(isCompleteContact)
						? "complete"
						: "incomplete",
		},
	];

	return {
		items,
		submitReady: items.every((item) => item.status === "complete"),
	};
};