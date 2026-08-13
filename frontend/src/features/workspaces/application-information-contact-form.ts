import type {
	ApplicationInformationContactCreate,
	ApplicationInformationContactRead,
	ApplicationInformationContactUpdate,
} from "@/fetch/workspaces";

export type ApplicationInformationContactFormState = {
	alternatePhoneNumber: string;
	email: string;
	firstName: string;
	lastName: string;
	phoneNumber: string;
	responsibilityEn: string;
	responsibilityFr: string;
};

export const createEmptyApplicationInformationContactForm =
	(): ApplicationInformationContactFormState => ({
		alternatePhoneNumber: "",
		email: "",
		firstName: "",
		lastName: "",
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
	alternatePhoneNumber: contact.alternatePhoneNumber ?? "",
	email: contact.email,
	firstName: contact.firstName ?? "",
	lastName: contact.lastName ?? "",
	phoneNumber: contact.phoneNumber ?? "",
	responsibilityEn: contact.responsibilityEn,
	responsibilityFr: contact.responsibilityFr,
});

export const toApplicationInformationContactCreatePayload = (
	form: ApplicationInformationContactFormState
): ApplicationInformationContactCreate => ({
	alternatePhoneNumber: toOptionalString(form.alternatePhoneNumber),
	email: toRequiredString(form.email),
	firstName: toRequiredString(form.firstName),
	lastName: toRequiredString(form.lastName),
	phoneNumber: toOptionalString(form.phoneNumber),
	responsibilityEn: toRequiredString(form.responsibilityEn),
	responsibilityFr: toRequiredString(form.responsibilityFr),
});

export const toApplicationInformationContactUpdatePayload = (
	form: ApplicationInformationContactFormState
): ApplicationInformationContactUpdate => ({
	alternatePhoneNumber: toOptionalString(form.alternatePhoneNumber),
	email: toRequiredString(form.email),
	firstName: toRequiredString(form.firstName),
	lastName: toRequiredString(form.lastName),
	phoneNumber: toOptionalString(form.phoneNumber),
	responsibilityEn: toRequiredString(form.responsibilityEn),
	responsibilityFr: toRequiredString(form.responsibilityFr),
});
