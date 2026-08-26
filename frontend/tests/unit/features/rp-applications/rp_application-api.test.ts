import { afterEach, describe, expect, it, vi } from "vitest";
import {
	createAccessibleRPApplicationRotatedClientSecret,
	createApplicationRPConfigurationCopy,
	createApplicationRPConfigurationRegistrationDraft,
	deleteAccessibleRPApplicationRotatedClientSecret,
	deleteRPApplication,
	getAccessibleRPApplication,
	getAccessibleRPApplicationClientCredentials,
	getAccessibleRPApplicationRotatedClientSecrets,
	getAccessibleRPApplicationSecretChangeLog,
	getAccessibleRPApplications,
	getApplicationRPConfigurationRegistrationDraft,
	getApplicationRPConfigurationProductionReview,
	getApplicationRPConfigurations,
	getRPApplicationAdoptionCandidatePreview,
	getRPApplicationAdoptionCandidates,
	getRPApplicationUsageSummary,
	linkRPApplicationToWorkspace,
	rotateAccessibleRPApplicationClientSecret,
	requestApplicationRPConfigurationProductionReview,
	reviewApplicationRPConfigurationProductionRequest,
	updateApplicationRPConfigurationPartnerEnvironment,
} from "@/fetch/rp-applications";

describe("rp_application-api", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("lists local RP adoption candidates without a provider-specific request", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					items: [
						{
							ibmApplicationId: "ibm-app-1",
							metadataCompleteness: "incomplete",
							missingFieldNames: ["redirectUris"],
							name: "Benefits Portal",
							rpApplicationUuid: "rp-application-1",
							updatedAt: null,
						},
					],
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await getRPApplicationAdoptionCandidates();

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/rp-applications/workspace-adoption-candidates",
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
		expect(response.items[0]?.ibmApplicationId).toBe("ibm-app-1");
	});

	it("loads one safe adoption preview", async () => {
		const applicationUuid = "rp-application-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					candidate: {
						ibmApplicationId: "ibm-app-1",
						metadataCompleteness: "incomplete",
						missingFieldNames: ["redirectUris"],
						name: "Benefits Portal",
						rpApplicationUuid: applicationUuid,
						updatedAt: null,
					},
					canadaLoginEnvironment: null,
					conflictingFieldNames: [],
					fields: [],
					fillableFieldNames: ["redirectUris"],
					preservedLocalFieldNames: [],
				}),
			ok: true,
			status: 200,
		} as Response);

		const response =
			await getRPApplicationAdoptionCandidatePreview(applicationUuid);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/rp-applications/workspace-adoption-candidates/${applicationUuid}`,
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
		expect(response.candidate.name).toBe("Benefits Portal");
	});

	it("links a retained RP to one workspace through the portal API only", async () => {
		const applicationUuid = "rp-application-1";
		const workspaceUuid = "workspace-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					applicationInformationUuid: null,
					canadaLoginEnvironment: "production",
					conflictingFieldNames: [],
					departmentUuid: "department-1",
					filledFieldNames: ["redirectUris"],
					ibmApplicationId: "ibm-app-1",
					idempotentReplay: false,
					name: "Benefits Portal",
					preservedLocalFieldNames: ["displayName"],
					rpApplicationUuid: applicationUuid,
					workspaceUuid,
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await linkRPApplicationToWorkspace(applicationUuid, {
			applicationInformationUuid: "application-information-uuid-1",
			canadaLoginEnvironment: "production",
			workspaceUuid,
		});

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/rp-applications/${applicationUuid}/workspace-link`,
			expect.objectContaining({
				body: JSON.stringify({
					applicationInformationUuid: "application-information-uuid-1",
					canadaLoginEnvironment: "production",
					workspaceUuid,
				}),
				credentials: "include",
				method: "PUT",
			})
		);
		expect(response.workspaceUuid).toBe(workspaceUuid);
	});

	it("gets an accessible RP application through the backend API", async () => {
		const applicationUuid = "application-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					id: 9,
					name: "Benefits Portal",
					settings: { description: "Example app" },
					status: "active",
					uuid: applicationUuid,
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await getAccessibleRPApplication(applicationUuid);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/rp-applications/accessible/${applicationUuid}`,
			expect.objectContaining({
				credentials: "include",
				method: "GET",
			})
		);
		expect(response.uuid).toBe(applicationUuid);
	});

	it("lists accessible RP applications through the backend API", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve([
					{
						dnrAppName: "Benefits Portal",
						role: "rp_admin",
						uuid: "application-uuid-1",
						workspaceUuid: "workspace-uuid-1",
					},
				]),
			ok: true,
			status: 200,
		} as Response);

		const response = await getAccessibleRPApplications();

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/rp-applications/accessible",
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
		expect(response).toHaveLength(1);
	});

	it("lists RP configurations through the Application-scoped backend API", async () => {
		const workspaceUuid = "workspace-uuid-1";
		const applicationInformationUuid = "application-information-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve([
					{
						applicationInformationUuid,
						configurationName: "Partner staging A",
						uuid: "rp-configuration-uuid-1",
						workspaceUuid,
					},
				]),
			ok: true,
			status: 200,
		} as Response);

		const response = await getApplicationRPConfigurations(
			workspaceUuid,
			applicationInformationUuid
		);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/application-information/${applicationInformationUuid}/rp-configurations`,
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
		expect(response[0]?.configurationName).toBe("Partner staging A");
	});

	it("creates Application-scoped Basics without duplicate public names", async () => {
		const workspaceUuid = "workspace-uuid-1";
		const applicationInformationUuid = "application-information-uuid-1";
		const creationKey = "018f6f83-0000-0000-0000-000000000901";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					applicationInformationUuid,
					configurationName: "Partner staging A",
					registrationCompletedAt: null,
					registrationAnswers: {},
					registrationDraftVersion: 1,
					registrationLastCompletedStep: "basics",
					rpApplicationUuid: "rp-configuration-uuid-1",
					workspaceUuid,
				}),
			ok: true,
			status: 201,
		} as Response);

		await createApplicationRPConfigurationRegistrationDraft(
			workspaceUuid,
			applicationInformationUuid,
			{
				canadaLoginEnvironment: "staging",
				configurationName: "Partner staging A",
				partnerEnvironment: "Partner staging",
			},
			creationKey
		);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/application-information/${applicationInformationUuid}/rp-configurations`,
			expect.objectContaining({
				body: JSON.stringify({
					canadaLoginEnvironment: "staging",
					configurationName: "Partner staging A",
					partnerEnvironment: "Partner staging",
				}),
				credentials: "include",
				headers: expect.objectContaining({ "Idempotency-Key": creationKey }),
				method: "POST",
			})
		);
	});

	it("uses the explicit Production-review subresource and constrained outcomes", async () => {
		const workspaceUuid = "workspace-uuid-1";
		const applicationInformationUuid = "application-information-uuid-1";
		const rpConfigurationUuid = "rp-configuration-uuid-1";
		const reviewResponse = {
			applicationInformationUuid,
			createdAt: "2026-08-25T12:00:00Z",
			decidedAt: null,
			externalReference: "CAB-123",
			requestedAt: "2026-08-25T12:00:00Z",
			reviewedAt: null,
			reviewedByTeam: null,
			reviewedByUserUuid: null,
			sourceRpConfigurationUuid: null,
			status: "pending",
			targetConfigurationName: "Production A",
			targetEnvironment: "production",
			targetRpConfigurationUuid: rpConfigurationUuid,
			updatedAt: null,
		};
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve(reviewResponse),
			ok: true,
			status: 200,
		} as Response);

		await getApplicationRPConfigurationProductionReview(
			workspaceUuid,
			applicationInformationUuid,
			rpConfigurationUuid
		);
		await requestApplicationRPConfigurationProductionReview(
			workspaceUuid,
			applicationInformationUuid,
			rpConfigurationUuid,
			{ externalReference: "CAB-123" }
		);
		await reviewApplicationRPConfigurationProductionRequest(
			workspaceUuid,
			applicationInformationUuid,
			rpConfigurationUuid,
			{ externalReference: "CAB-123", status: "approved" }
		);

		const expectedUrl = `http://localhost:8000/api/v1/workspaces/${workspaceUuid}/application-information/${applicationInformationUuid}/rp-configurations/${rpConfigurationUuid}/production-review`;
		expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
			expectedUrl,
			expectedUrl,
			expectedUrl,
		]);
		expect(fetchMock.mock.calls[1]?.[1]).toEqual(
			expect.objectContaining({
				body: JSON.stringify({ externalReference: "CAB-123" }),
				method: "POST",
			})
		);
		expect(fetchMock.mock.calls[2]?.[1]).toEqual(
			expect.objectContaining({
				body: JSON.stringify({
					externalReference: "CAB-123",
					status: "approved",
				}),
				method: "PATCH",
			})
		);
	});

	it("copies one explicit source to any selected environment", async () => {
		const workspaceUuid = "workspace-uuid-1";
		const applicationInformationUuid = "application-information-uuid-1";
		const sourceUuid = "rp-configuration-source-1";
		const creationKey = "018f6f83-0000-0000-0000-000000000903";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					applicationInformationUuid,
					copyPolicyVersion: 1,
					sourceConfigurationName: "Partner production A",
					sourceEnvironment: "production",
					sourcePartnerEnvironment: null,
					sourceRpConfigurationUuid: sourceUuid,
					targetConfigurationName: "Partner test B",
					targetEnvironment: "test",
					targetPartnerEnvironment: "Partner QA",
					targetRegistrationDraftVersion: 1,
					targetRegistrationLastCompletedStep: "basics",
					targetRpConfigurationUuid: "rp-configuration-target-1",
					workspaceUuid,
				}),
			ok: true,
			status: 201,
		} as Response);

		const response = await createApplicationRPConfigurationCopy(
			workspaceUuid,
			applicationInformationUuid,
			sourceUuid,
			{
				targetConfigurationName: "Partner test B",
				targetEnvironment: "test",
				targetPartnerEnvironment: "Partner QA",
			},
			creationKey
		);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/application-information/${applicationInformationUuid}/rp-configurations/${sourceUuid}/copy`,
			expect.objectContaining({
				body: JSON.stringify({
					targetConfigurationName: "Partner test B",
					targetEnvironment: "test",
					targetPartnerEnvironment: "Partner QA",
				}),
				credentials: "include",
				headers: expect.objectContaining({ "Idempotency-Key": creationKey }),
				method: "POST",
			})
		);
		expect(response.copyPolicyVersion).toBe(1);
		expect(response.targetEnvironment).toBe("test");
	});

	it("updates only the nested RP configuration Partner environment", async () => {
		const workspaceUuid = "workspace-uuid-1";
		const applicationInformationUuid = "application-information-uuid-1";
		const rpConfigurationUuid = "rp-configuration-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					applicationInformationUuid,
					partnerEnvironment: "Partner QA 2",
					rpConfigurationUuid,
					updatedAt: "2026-08-13T15:00:00Z",
					workspaceUuid,
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await updateApplicationRPConfigurationPartnerEnvironment(
			workspaceUuid,
			applicationInformationUuid,
			rpConfigurationUuid,
			{ partnerEnvironment: "Partner QA 2" }
		);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/application-information/${applicationInformationUuid}/rp-configurations/${rpConfigurationUuid}/partner-environment`,
			expect.objectContaining({
				body: JSON.stringify({ partnerEnvironment: "Partner QA 2" }),
				credentials: "include",
				method: "PATCH",
			})
		);
		expect(response.partnerEnvironment).toBe("Partner QA 2");
	});

	it("deletes an RP application through the backend API", async () => {
		const workspaceUuid = "workspace-uuid-1";
		const applicationUuid = "application-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({ message: "RP application deleted successfully" }),
			ok: true,
			status: 200,
		} as Response);

		const response = await deleteRPApplication(workspaceUuid, applicationUuid);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/applications/${applicationUuid}`,
			expect.objectContaining({
				credentials: "include",
				method: "DELETE",
			})
		);
		expect(response).toMatchObject({
			message: "RP application deleted successfully",
		});
	});

	it("gets accessible RP application client credentials through the backend API", async () => {
		const applicationUuid = "application-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					clientId: "client-id-123",
					clientSecret: "top-secret-value",
					clientSecretId: "secret-1",
				}),
			ok: true,
			status: 200,
		} as Response);

		const response =
			await getAccessibleRPApplicationClientCredentials(applicationUuid);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/rp-applications/accessible/${applicationUuid}/client`,
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
		expect(response.clientId).toBe("client-id-123");

		await getAccessibleRPApplicationClientCredentials(
			applicationUuid,
			"workspace-uuid-1",
			"application-information-uuid-1"
		);
		expect(fetchMock).toHaveBeenLastCalledWith(
			`http://localhost:8000/api/v1/rp-applications/accessible/${applicationUuid}/client?workspaceUuid=workspace-uuid-1&applicationInformationUuid=application-information-uuid-1`,
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
	});

	it("downloads the secret-change log through complete Application ancestry", async () => {
		const applicationUuid = "application-uuid-1";
		const expectedBlob = new Blob(
			["TimeGenerated,Actor,Action,RPConfigurationId"],
			{ type: "text/csv" }
		);
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			blob: () => Promise.resolve(expectedBlob),
			headers: new Headers({ "content-type": "text/csv" }),
			ok: true,
			status: 200,
		} as Response);

		await expect(
			getAccessibleRPApplicationSecretChangeLog(
				applicationUuid,
				"workspace-uuid-1",
				"application-information-uuid-1"
			)
		).resolves.toBe(expectedBlob);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/rp-applications/accessible/${applicationUuid}/client/secret-change-log?workspaceUuid=workspace-uuid-1&applicationInformationUuid=application-information-uuid-1`,
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				headers: { Accept: "text/csv" },
				method: "GET",
			})
		);
	});

	it("loads a registration draft through complete Application ancestry", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					applicationInformationUuid: "application-information-uuid-1",
					rpApplicationUuid: "rp-configuration-uuid-1",
					workspaceUuid: "workspace-uuid-1",
				}),
			ok: true,
			status: 200,
		} as Response);

		await getApplicationRPConfigurationRegistrationDraft(
			"workspace-uuid-1",
			"application-information-uuid-1",
			"rp-configuration-uuid-1"
		);

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/workspaces/workspace-uuid-1/application-information/application-information-uuid-1/rp-configurations/rp-configuration-uuid-1/registration-draft",
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
	});

	it("lists accessible rotated client secrets through the backend API", async () => {
		const applicationUuid = "application-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve([
					{
						description: "April rotation",
						expiredAt: 1775692800,
						path: "/rotatedSecrets/0",
						rotatedAt: 1773100800,
						secretId: "/rotatedSecrets/0",
						value: "{sha512}redacted",
					},
				]),
			ok: true,
			status: 200,
		} as Response);

		const response =
			await getAccessibleRPApplicationRotatedClientSecrets(applicationUuid);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/rp-applications/accessible/${applicationUuid}/client/rotated-secrets`,
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
		expect(response[0]?.secretId).toBe("/rotatedSecrets/0");
		expect(response[0]?.path).toBe("/rotatedSecrets/0");
	});

	it("creates an accessible rotated client secret through the backend API", async () => {
		const applicationUuid = "application-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve([]),
			ok: true,
			status: 200,
		} as Response);

		await createAccessibleRPApplicationRotatedClientSecret(applicationUuid, {
			description: "April rotation",
			rotatedSecretExpiredAt: 1775692800,
		});

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/rp-applications/accessible/${applicationUuid}/client/rotated-secrets`,
			expect.objectContaining({
				body: JSON.stringify({
					description: "April rotation",
					rotatedSecretExpiredAt: 1775692800,
				}),
				credentials: "include",
				method: "POST",
			})
		);
	});

	it("deletes an accessible rotated client secret through the backend API", async () => {
		const applicationUuid = "application-uuid-1";
		const secretId = "/rotatedSecrets/0";
		const rawSecret = "super-secret-value-that-must-not-be-sent";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve({ message: "Rotated client secret deleted" }),
			ok: true,
			status: 200,
		} as Response);

		const response = await deleteAccessibleRPApplicationRotatedClientSecret(
			applicationUuid,
			secretId
		);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/rp-applications/accessible/${applicationUuid}/client/rotated-secrets`,
			expect.objectContaining({
				body: JSON.stringify({ secretId }),
				credentials: "include",
				method: "DELETE",
			})
		);
		expect(JSON.stringify(fetchMock.mock.calls)).not.toContain(rawSecret);
		expect(response["message"]).toBe("Rotated client secret deleted");
	});

	it("rotates the accessible RP application client secret through the backend API", async () => {
		const applicationUuid = "application-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					clientId: "client-id-123",
					clientSecret: "rotated-secret-value",
					clientSecretId: "secret-2",
				}),
			ok: true,
			status: 200,
		} as Response);

		const response =
			await rotateAccessibleRPApplicationClientSecret(applicationUuid);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/rp-applications/accessible/${applicationUuid}/client/rotate-secret`,
			expect.objectContaining({
				credentials: "include",
				body: JSON.stringify({
					deleteRotatedSecrets: false,
					description: "",
					rotatedSecretExpiredAt: 0,
				}),
				method: "POST",
			})
		);
		expect(response.clientSecret).toBe("rotated-secret-value");
	});

	it("sends a named rotation payload for accessible client secret rotation", async () => {
		const applicationUuid = "application-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					clientId: "client-id-123",
					clientSecret: "rotated-secret-value",
					clientSecretId: "secret-2",
				}),
			ok: true,
			status: 200,
		} as Response);

		await rotateAccessibleRPApplicationClientSecret(applicationUuid, {
			deleteRotatedSecrets: true,
			description: "April rotation",
			rotatedSecretExpiredAt: 1775692800,
		});

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/rp-applications/accessible/${applicationUuid}/client/rotate-secret`,
			expect.objectContaining({
				body: JSON.stringify({
					deleteRotatedSecrets: true,
					description: "April rotation",
					rotatedSecretExpiredAt: 1775692800,
				}),
				credentials: "include",
				method: "POST",
			})
		);
	});

	it("gets RP application usage summary through the backend API", async () => {
		const workspaceUuid = "workspace-uuid-1";
		const applicationUuid = "application-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					failed: 2,
					succeeded: 9,
					total: 11,
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await getRPApplicationUsageSummary(
			workspaceUuid,
			applicationUuid,
			"2026-04-09"
		);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/applications/${applicationUuid}/usage/summary?selected_date=1775692800000`,
			expect.objectContaining({
				credentials: "include",
				method: "GET",
			})
		);
		expect(response.total).toBe(11);
	});
});
