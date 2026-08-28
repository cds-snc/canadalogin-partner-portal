import { describe, expect, it } from "vitest";
import translationsEn from "@/assets/locales/en/translations.json";
import translationsFr from "@/assets/locales/fr/translations.json";

const requiredKeys = [
	"applicationsRequestedScopesLabel",
	"applicationsSectorIdentifierLabel",
	"cancelAction",
	"createAction",
	"createPageTitle",
	"createSummary",
	"createdAtLabel",
	"creatingAction",
] as const;

const requiredRegistrationKeys = [
	"currentStepStatus",
	"fieldValidationMessage",
	"needsAttentionStatus",
	"requiredFieldMessage",
	"stepsNavigationTitle",
	"unavailableStepStatus",
	"validationFieldMessage",
] as const;

const retiredApplicationInvitationKeys = [
	"applicationsInvitationsDeliveryNotice",
	"applicationsInvitationsEmpty",
	"applicationsInvitationsLoadingBody",
	"applicationsInvitationsLoadingTitle",
	"applicationsInvitationsSummary",
	"applicationsInvitationsTitle",
] as const;

describe("translation contracts", () => {
	it.each([
		["English", translationsEn],
		["French", translationsFr],
	] as const)(
		"defines every reachable workspace key in %s",
		(_label, translations) => {
			for (const key of requiredKeys) {
				expect(translations.workspaces[key]).toBeTruthy();
			}
		}
	);

	it("keeps partner workspace invitation keys in official-language parity", () => {
		expect(
			Object.keys(translationsFr.invitations.rpApplication).sort()
		).toEqual(Object.keys(translationsEn.invitations.rpApplication).sort());
		expect(
			Object.keys(translationsFr.invitations.manualDelivery).sort()
		).toEqual(Object.keys(translationsEn.invitations.manualDelivery).sort());
	});

	it("uses partner workspace wording for invitation acceptance", () => {
		expect(translationsEn.invitations.rpApplication.title).toBe(
			"Partner workspace invitation"
		);
		expect(translationsEn.invitations.rpApplication.errorBody).not.toContain(
			"RP application"
		);
		expect(translationsFr.invitations.rpApplication.title).toBe(
			"Invitation à un espace de travail partenaire"
		);
		expect(translationsFr.invitations.rpApplication.errorBody).not.toContain(
			"application RP"
		);
	});

	it.each([
		["English", translationsEn],
		["French", translationsFr],
	] as const)(
		"does not retain unused application-scoped invitation keys in %s",
		(_label, translations) => {
			for (const key of retiredApplicationInvitationKeys) {
				expect(key in translations.workspaces).toBe(false);
			}
		}
	);

	it("defines the profile empty-state body in both official languages", () => {
		expect(translationsEn.profile.noDepartmentsBody).toBeTruthy();
		expect(translationsFr.profile.noDepartmentsBody).toBeTruthy();
	});

	it.each([
		["English", translationsEn],
		["French", translationsFr],
	] as const)(
		"defines the registration recovery keys in %s",
		(_label, translations) => {
			for (const key of requiredRegistrationKeys) {
				expect(translations.workspaces.registration[key]).toBeTruthy();
			}
		}
	);

	it.each([
		["English", translationsEn],
		["French", translationsFr],
	] as const)(
		"does not expose a peer questionnaire card in %s",
		(_label, translations) => {
			expect("rpOverviewRegistrationTitle" in translations.workspaces).toBe(
				false
			);
		}
	);
});
