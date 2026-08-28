import { afterEach, describe, expect, it, vi } from "vitest";
import {
	createApplicationInformation,
	createApplicationInformationContact,
	deleteApplicationInformation,
	deleteApplicationInformationContact,
	getApplicationInformation,
	getApplicationInformationChecklist,
	getApplicationInformationContacts,
	getApplicationInformationList,
	updateApplicationInformation,
	updateApplicationInformationContact,
} from "@/fetch/workspaces";

describe("application-information-api", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("loads the status-only checklist projection", async () => {
		const workspaceUuid = "workspace-uuid-1";
		const applicationInformationUuid = "application-information-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					applicationInformationUuid,
					applicationNameEn: "Benefits service",
					applicationNameFr: "Service de prestations",
					catsEvidenceStatus: "not_configured",
					items: [{ key: "contacts", status: "provided" }],
				}),
			ok: true,
			status: 200,
		} as Response);

		const checklist = await getApplicationInformationChecklist(
			workspaceUuid,
			applicationInformationUuid
		);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/application-information/${applicationInformationUuid}/checklist`,
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
		expect(checklist.items).toEqual([
			{ key: "contacts", status: "provided" },
		]);
		expect(JSON.stringify(checklist)).not.toContain("email");
	});

	it("lists application information through the backend API", async () => {
		const workspaceUuid = "workspace-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve([
					{
						createdAt: "2026-07-30T15:00:00Z",
						createdBy: 42,
						deletedAt: null,
						id: 17,
						isDeleted: false,
						migrationOrTransitionPlan: "Phased transition",
						overview: "Overview text",
						securityAndPrivacy: "Protected B controls apply",
						serviceNameEn: "Example service",
						serviceNameFr: "Service exemple",
						technologyAndProtocol: "OIDC with backend mediation",
						updatedAt: null,
						usage: "Partner onboarding usage",
						uuid: "application-information-uuid-1",
						workspaceId: 9,
					},
				]),
			ok: true,
			status: 200,
		} as Response);

		const response = await getApplicationInformationList(workspaceUuid);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/application-information`,
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
		expect(response[0]?.serviceNameEn).toBe("Example service");
	});

	it("creates and updates application information through the backend API", async () => {
		const workspaceUuid = "workspace-uuid-1";
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValueOnce({
				headers: new Headers({ "content-type": "application/json" }),
				json: () =>
					Promise.resolve({
						createdAt: "2026-07-30T15:00:00Z",
						createdBy: 42,
						deletedAt: null,
						id: 17,
						isDeleted: false,
						migrationOrTransitionPlan: "Phased transition",
						overview: "Overview text",
						securityAndPrivacy: "Protected B controls apply",
						serviceNameEn: "Example service",
						serviceNameFr: "Service exemple",
						technologyAndProtocol: "OIDC with backend mediation",
						updatedAt: null,
						usage: "Partner onboarding usage",
						uuid: "application-information-uuid-1",
						workspaceId: 9,
					}),
				ok: true,
				status: 201,
			} as Response)
			.mockResolvedValueOnce({
				headers: new Headers({ "content-type": "application/json" }),
				json: () =>
					Promise.resolve({
						createdAt: "2026-07-30T15:00:00Z",
						createdBy: 42,
						deletedAt: null,
						id: 17,
						isDeleted: false,
						migrationOrTransitionPlan: "Updated transition plan",
						overview: "Overview text",
						securityAndPrivacy: "Protected B controls apply",
						serviceNameEn: "Updated service",
						serviceNameFr: "Service mis a jour",
						technologyAndProtocol: "OIDC with backend mediation",
						updatedAt: "2026-07-30T15:30:00Z",
						usage: "Partner onboarding usage",
						uuid: "application-information-uuid-1",
						workspaceId: 9,
					}),
				ok: true,
				status: 200,
			} as Response);

		const created = await createApplicationInformation(workspaceUuid, {
			migrationOrTransitionPlan: "Phased transition",
			overview: "Overview text",
			securityAndPrivacy: "Protected B controls apply",
			serviceNameEn: "Example service",
			serviceNameFr: "Service exemple",
			technologyAndProtocol: "OIDC with backend mediation",
			usage: "Partner onboarding usage",
		});
		const updated = await updateApplicationInformation(
			workspaceUuid,
			created.uuid,
			{
				migrationOrTransitionPlan: "Updated transition plan",
				serviceNameEn: "Updated service",
				serviceNameFr: "Service mis a jour",
			}
		);

		expect(fetchMock).toHaveBeenNthCalledWith(
			1,
			`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/application-information`,
			expect.objectContaining({
				body: JSON.stringify({
					migrationOrTransitionPlan: "Phased transition",
					overview: "Overview text",
					securityAndPrivacy: "Protected B controls apply",
					serviceNameEn: "Example service",
					serviceNameFr: "Service exemple",
					technologyAndProtocol: "OIDC with backend mediation",
					usage: "Partner onboarding usage",
				}),
				credentials: "include",
				method: "POST",
			})
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			2,
			`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/application-information/${created.uuid}`,
			expect.objectContaining({
				body: JSON.stringify({
					migrationOrTransitionPlan: "Updated transition plan",
					serviceNameEn: "Updated service",
					serviceNameFr: "Service mis a jour",
				}),
				credentials: "include",
				method: "PATCH",
			})
		);
		expect(updated.serviceNameEn).toBe("Updated service");
	});

	it("gets and deletes application information through the backend API", async () => {
		const workspaceUuid = "workspace-uuid-1";
		const applicationInformationUuid = "application-information-uuid-1";
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValueOnce({
				headers: new Headers({ "content-type": "application/json" }),
				json: () =>
					Promise.resolve({
						createdAt: "2026-07-30T15:00:00Z",
						createdBy: 42,
						deletedAt: null,
						id: 17,
						isDeleted: false,
						migrationOrTransitionPlan: "Phased transition",
						overview: "Overview text",
						securityAndPrivacy: "Protected B controls apply",
						serviceNameEn: "Example service",
						serviceNameFr: "Service exemple",
						technologyAndProtocol: "OIDC with backend mediation",
						updatedAt: null,
						usage: "Partner onboarding usage",
						uuid: applicationInformationUuid,
						workspaceId: 9,
					}),
				ok: true,
				status: 200,
			} as Response)
			.mockResolvedValueOnce({
				headers: new Headers({ "content-type": "application/json" }),
				json: () =>
					Promise.resolve({ message: "Application information deleted" }),
				ok: true,
				status: 200,
			} as Response);

		const response = await getApplicationInformation(
			workspaceUuid,
			applicationInformationUuid
		);
		const deleteResponse = await deleteApplicationInformation(
			workspaceUuid,
			applicationInformationUuid
		);

		expect(response.uuid).toBe(applicationInformationUuid);
		expect(fetchMock).toHaveBeenNthCalledWith(
			2,
			`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/application-information/${applicationInformationUuid}`,
			expect.objectContaining({
				credentials: "include",
				method: "DELETE",
			})
		);
		expect(deleteResponse["message"]).toBe("Application information deleted");
	});

	it("manages application information contacts through the backend API", async () => {
		const workspaceUuid = "workspace-uuid-1";
		const applicationInformationUuid = "application-information-uuid-1";
		const contactUuid = "contact-uuid-1";
		vi.spyOn(globalThis, "fetch")
			.mockResolvedValueOnce({
				headers: new Headers({ "content-type": "application/json" }),
				json: () =>
					Promise.resolve([
						{
							applicationInformationId: 17,
							createdAt: "2026-07-30T15:15:00Z",
							createdBy: 42,
							deletedAt: null,
							email: "jane.doe@example.gc.ca",
							id: 3,
							isDeleted: false,
							nameEn: "Jane Doe",
							nameFr: "Jeanne Doe",
							phoneNumber: "555-555-5555",
							responsibilityEn: "Product owner",
							responsibilityFr: "Responsable du produit",
							updatedAt: null,
							uuid: contactUuid,
						},
					]),
				ok: true,
				status: 200,
			} as Response)
			.mockResolvedValueOnce({
				headers: new Headers({ "content-type": "application/json" }),
				json: () =>
					Promise.resolve({
						applicationInformationId: 17,
						createdAt: "2026-07-30T15:15:00Z",
						createdBy: 42,
						deletedAt: null,
						email: "jane.doe@example.gc.ca",
						id: 3,
						isDeleted: false,
						nameEn: "Jane Doe",
						nameFr: "Jeanne Doe",
						phoneNumber: "555-555-5555",
						responsibilityEn: "Product owner",
						responsibilityFr: "Responsable du produit",
						updatedAt: null,
						uuid: contactUuid,
					}),
				ok: true,
				status: 201,
			} as Response)
			.mockResolvedValueOnce({
				headers: new Headers({ "content-type": "application/json" }),
				json: () =>
					Promise.resolve({
						applicationInformationId: 17,
						createdAt: "2026-07-30T15:15:00Z",
						createdBy: 42,
						deletedAt: null,
						email: "jane.doe@example.gc.ca",
						id: 3,
						isDeleted: false,
						nameEn: "Jane Doe",
						nameFr: "Jeanne Doe",
						phoneNumber: "555-555-5555",
						responsibilityEn: "Updated responsibility",
						responsibilityFr: "Responsabilite mise a jour",
						updatedAt: "2026-07-30T15:20:00Z",
						uuid: contactUuid,
					}),
				ok: true,
				status: 200,
			} as Response)
			.mockResolvedValueOnce({
				headers: new Headers({ "content-type": "application/json" }),
				json: () =>
					Promise.resolve({
						message: "Application information contact deleted",
					}),
				ok: true,
				status: 200,
			} as Response);

		const contacts = await getApplicationInformationContacts(
			workspaceUuid,
			applicationInformationUuid
		);
		const createdContact = await createApplicationInformationContact(
			workspaceUuid,
			applicationInformationUuid,
			{
				email: "jane.doe@example.gc.ca",
				firstName: "Jane",
				lastName: "Doe",
				phoneNumber: "555-555-5555",
				responsibilityEn: "Product owner",
				responsibilityFr: "Responsable du produit",
			}
		);
		const updatedContact = await updateApplicationInformationContact(
			workspaceUuid,
			applicationInformationUuid,
			contactUuid,
			{
				responsibilityEn: "Updated responsibility",
				responsibilityFr: "Responsabilite mise a jour",
			}
		);
		const deleteResponse = await deleteApplicationInformationContact(
			workspaceUuid,
			applicationInformationUuid,
			contactUuid
		);

		expect(contacts[0]?.nameEn).toBe("Jane Doe");
		expect(createdContact.email).toBe("jane.doe@example.gc.ca");
		expect(updatedContact.responsibilityEn).toBe("Updated responsibility");
		expect(deleteResponse["message"]).toBe(
			"Application information contact deleted"
		);
	});
});
