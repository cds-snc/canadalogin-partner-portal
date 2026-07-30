import type {
	ApplicationInformationCreate,
	ApplicationInformationRead,
	ApplicationInformationUpdate,
} from "@/fetch/workspaces";

export type ApplicationInformationFormState = {
	migrationOrTransitionPlan: string;
	overview: string;
	securityAndPrivacy: string;
	serviceNameEn: string;
	serviceNameFr: string;
	technologyAndProtocol: string;
	usage: string;
};

export const createEmptyApplicationInformationForm = (): ApplicationInformationFormState => ({
	migrationOrTransitionPlan: "",
	overview: "",
	securityAndPrivacy: "",
	serviceNameEn: "",
	serviceNameFr: "",
	technologyAndProtocol: "",
	usage: "",
});

const toRequiredString = (value: string): string => value.trim();

export const toApplicationInformationFormState = (
	applicationInformation: ApplicationInformationRead
): ApplicationInformationFormState => ({
	migrationOrTransitionPlan: applicationInformation.migrationOrTransitionPlan,
	overview: applicationInformation.overview,
	securityAndPrivacy: applicationInformation.securityAndPrivacy,
	serviceNameEn: applicationInformation.serviceNameEn,
	serviceNameFr: applicationInformation.serviceNameFr,
	technologyAndProtocol: applicationInformation.technologyAndProtocol,
	usage: applicationInformation.usage,
});

export const toApplicationInformationCreatePayload = (
	form: ApplicationInformationFormState
): ApplicationInformationCreate => ({
	migrationOrTransitionPlan: toRequiredString(form.migrationOrTransitionPlan),
	overview: toRequiredString(form.overview),
	securityAndPrivacy: toRequiredString(form.securityAndPrivacy),
	serviceNameEn: toRequiredString(form.serviceNameEn),
	serviceNameFr: toRequiredString(form.serviceNameFr),
	technologyAndProtocol: toRequiredString(form.technologyAndProtocol),
	usage: toRequiredString(form.usage),
});

export const toApplicationInformationUpdatePayload = (
	form: ApplicationInformationFormState
): ApplicationInformationUpdate => ({
	migrationOrTransitionPlan: toRequiredString(form.migrationOrTransitionPlan),
	overview: toRequiredString(form.overview),
	securityAndPrivacy: toRequiredString(form.securityAndPrivacy),
	serviceNameEn: toRequiredString(form.serviceNameEn),
	serviceNameFr: toRequiredString(form.serviceNameFr),
	technologyAndProtocol: toRequiredString(form.technologyAndProtocol),
	usage: toRequiredString(form.usage),
});