import { describe, expect, it } from "vitest";
import type { ApplicationInformationContactRead } from "@/fetch/workspaces";
import {
	getApplicationInformationContactDisplayName,
	getApplicationInformationContactResponsibility,
} from "@/features/workspaces/application-information-contact-display";

const contact: ApplicationInformationContactRead = {
	id: 3,
	uuid: "contact-uuid-1",
	applicationInformationId: 17,
	createdBy: 42,
	email: "jane.doe@example.gc.ca",
	nameEn: "Jane Mary Doe",
	nameFr: "Jeanne Marie Doe",
	firstName: null,
	lastName: null,
	phoneNumber: null,
	alternatePhoneNumber: null,
	responsibilityEn: "Product owner",
	responsibilityFr: "Responsable du produit",
	identityConfirmedAt: null,
	identityConfirmedByUserUuid: null,
	identityConfirmationRequired: true,
	createdAt: "2026-08-13T00:00:00Z",
	updatedAt: null,
	deletedAt: null,
	isDeleted: false,
};

describe("application information contact display", () => {
	it("uses the exact active-locale legacy value without parsing or joining it", () => {
		expect(
			getApplicationInformationContactDisplayName(contact, "en", "Unavailable")
		).toBe("Jane Mary Doe");
		expect(
			getApplicationInformationContactDisplayName(contact, "fr", "Indisponible")
		).toBe("Jeanne Marie Doe");
	});

	it("uses confirmed first and last name in both languages", () => {
		const confirmedContact = {
			...contact,
			firstName: "Jane",
			lastName: "Doe",
			identityConfirmedAt: "2026-08-13T01:00:00Z",
			identityConfirmedByUserUuid: "user-uuid-1",
			identityConfirmationRequired: false,
		};

		expect(
			getApplicationInformationContactDisplayName(
				confirmedContact,
				"en",
				"Unavailable"
			)
		).toBe("Jane Doe");
		expect(
			getApplicationInformationContactDisplayName(
				confirmedContact,
				"fr",
				"Indisponible"
			)
		).toBe("Jane Doe");
	});

	it("keeps bilingual responsibilities distinct", () => {
		expect(getApplicationInformationContactResponsibility(contact, "en")).toBe(
			"Product owner"
		);
		expect(getApplicationInformationContactResponsibility(contact, "fr")).toBe(
			"Responsable du produit"
		);
	});
});
