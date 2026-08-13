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
