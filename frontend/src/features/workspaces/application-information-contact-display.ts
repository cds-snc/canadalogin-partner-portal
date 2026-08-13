import type { ApplicationInformationContactRead } from "@/fetch/workspaces";

export const getApplicationInformationContactDisplayName = (
	contact: ApplicationInformationContactRead,
	language: string | undefined,
	fallback: string
): string => {
	if (!contact.identityConfirmationRequired) {
		const confirmedName = [contact.firstName, contact.lastName]
			.filter((value): value is string => Boolean(value?.trim()))
			.join(" ");

		if (confirmedName) {
			return confirmedName;
		}
	}

	const retainedName = language?.startsWith("fr")
		? contact.nameFr
		: contact.nameEn;

	return retainedName?.trim() || fallback;
};

export const getApplicationInformationContactResponsibility = (
	contact: ApplicationInformationContactRead,
	language: string | undefined
): string =>
	language?.startsWith("fr")
		? contact.responsibilityFr
		: contact.responsibilityEn;
