import type {
	ApplicationInformationContactCreate,
	ApplicationInformationContactRead,
	ApplicationInformationContactUpdate,
} from "@/fetch/workspaces";

export type ApplicationInformationContactFormState = {
	email: string;
	nameEn: string;
	nameFr: string;
	phoneNumber: string;
	responsibilityEn: string;
	responsibilityFr: string;
};

export const createEmptyApplicationInformationContactForm = (): ApplicationInformationContactFormState => ({
	email: "",
	nameEn: "",
	nameFr: "",
	phoneNumber: "",
	responsibilityEn: "",
	responsibilityFr: "",
});

const toOptionalString = (value: string): string | null => {
	const normalizedValue = value.trim();

	return normalizedValue.length > 0 ? normalizedValue : null;
};

const toRequiredString = (value: string): string => value.trim();

export const toApplicationInformationContactFormState = (
	contact: ApplicationInformationContactRead
): ApplicationInformationContactFormState => ({
	email: contact.email,
	nameEn: contact.nameEn,
	nameFr: contact.nameFr,
	phoneNumber: contact.phoneNumber ?? "",
	responsibilityEn: contact.responsibilityEn,
	responsibilityFr: contact.responsibilityFr,
});

export const toApplicationInformationContactCreatePayload = (
	form: ApplicationInformationContactFormState
): ApplicationInformationContactCreate => ({
	email: toRequiredString(form.email),
	nameEn: toRequiredString(form.nameEn),
	nameFr: toRequiredString(form.nameFr),
	phoneNumber: toOptionalString(form.phoneNumber),
	responsibilityEn: toRequiredString(form.responsibilityEn),
	responsibilityFr: toRequiredString(form.responsibilityFr),
});

export const toApplicationInformationContactUpdatePayload = (
	form: ApplicationInformationContactFormState
): ApplicationInformationContactUpdate => ({
	email: toRequiredString(form.email),
	nameEn: toRequiredString(form.nameEn),
	nameFr: toRequiredString(form.nameFr),
	phoneNumber: toOptionalString(form.phoneNumber),
	responsibilityEn: toRequiredString(form.responsibilityEn),
	responsibilityFr: toRequiredString(form.responsibilityFr),
});