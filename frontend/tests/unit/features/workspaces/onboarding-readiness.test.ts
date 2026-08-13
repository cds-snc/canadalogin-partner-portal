import { describe, expect, it } from "vitest";
import type {
	ApplicationInformationContactRead,
	ApplicationInformationRead,
} from "@/fetch/workspaces";
import { getApplicationInformationReadinessSummary } from "@/features/workspaces/onboarding-readiness";

const applicationInformation: ApplicationInformationRead = {
	id: 17,
	uuid: "application-information-uuid-1",
	workspaceId: 9,
	createdBy: 42,
	serviceNameEn: "Example service",
	serviceNameFr: "Service exemple",
	overview: "Overview",
	technologyAndProtocol: "OIDC",
	securityAndPrivacy: "Protected B controls",
	usage: "Partner onboarding",
	migrationOrTransitionPlan: "Phased transition",
	createdAt: "2026-08-13T00:00:00Z",
	updatedAt: null,
	deletedAt: null,
	isDeleted: false,
};

const baseContact: ApplicationInformationContactRead = {
	id: 3,
	uuid: "contact-uuid-1",
	applicationInformationId: 17,
	createdBy: 42,
	email: "jane.doe@example.gc.ca",
	nameEn: null,
	nameFr: null,
	firstName: "Jane",
	lastName: "Doe",
	phoneNumber: null,
	alternatePhoneNumber: null,
	responsibilityEn: "Product owner",
	responsibilityFr: "Responsable du produit",
	identityConfirmedAt: "2026-08-13T00:00:00Z",
	identityConfirmedByUserUuid: "user-uuid-1",
	identityConfirmationRequired: false,
	createdAt: "2026-08-13T00:00:00Z",
	updatedAt: null,
	deletedAt: null,
	isDeleted: false,
};

describe("getApplicationInformationReadinessSummary", () => {
	it("treats a confirmed first-and-last-name contact as complete", () => {
		const summary = getApplicationInformationReadinessSummary(
			applicationInformation,
			[baseContact]
		);

		expect(summary.items.find((item) => item.key === "contacts")?.status).toBe(
			"complete"
		);
		expect(summary.submitReady).toBe(true);
		expect(summary.completedCount).toBe(6);
		expect(summary.totalCount).toBe(6);
	});

	it("keeps an unconfirmed legacy contact incomplete without parsing its localized names", () => {
		const summary = getApplicationInformationReadinessSummary(
			applicationInformation,
			[
				{
					...baseContact,
					nameEn: "Jane Mary Doe",
					nameFr: "Jeanne Marie Doe",
					firstName: null,
					lastName: null,
					identityConfirmedAt: null,
					identityConfirmedByUserUuid: null,
					identityConfirmationRequired: true,
				},
			]
		);

		expect(summary.items.find((item) => item.key === "contacts")?.status).toBe(
			"incomplete"
		);
		expect(summary.submitReady).toBe(false);
		expect(summary.completedCount).toBe(5);
		expect(summary.totalCount).toBe(6);
	});
});
