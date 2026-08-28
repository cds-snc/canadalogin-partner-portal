import { afterEach, describe, expect, it, vi } from "vitest";
import {
	createWorkspaceRPApplicationRegistrationDraft,
	completeWorkspaceRPApplicationRegistration,
	getWorkspaceRPRegistrationValidationFieldNames,
	getWorkspaceRPApplicationRegistrationDraft,
	isWorkspaceRPRegistrationValidationError,
	updateWorkspaceRPApplicationRegistrationDraft,
	type WorkspaceRPApplicationRegistrationDraftPatch,
} from "@/fetch/rp-applications";
import endpointsCompleteStepContract from "../../../../../tests/contracts/workspace-rp-registration-endpoints-complete-step.json";

const workspaceUuid = "018f6f83-0000-0000-0000-000000000201";
const rpApplicationUuid = "018f6f83-0000-0000-0000-000000000701";
const draft = {
	registrationCompletedAt: null,
	registrationAnswers: {
		canadaLoginEnvironment: "test" as const,
		serviceNameEn: "Benefits Portal",
		serviceNameFr: "Portail des prestations",
	},
	registrationDraftVersion: 1,
	registrationLastCompletedStep: "basics" as const,
	rpApplicationUuid,
	workspaceUuid,
};

const jsonResponse = (body: unknown, status = 200): Response =>
	({
		headers: new Headers({ "content-type": "application/json" }),
		json: () => Promise.resolve(body),
		ok: status >= 200 && status < 300,
		status,
	}) as Response;

describe("workspace RP registration API", () => {
	afterEach(() => vi.restoreAllMocks());

	it("creates the minimum Basics draft with an opaque idempotency header", async () => {
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(jsonResponse(draft, 201));

		const result = await createWorkspaceRPApplicationRegistrationDraft(
			workspaceUuid,
			{
				applicationInformationUuid: "application-information-uuid-1",
				canadaLoginEnvironment: "test",
				configurationName: "Partner test integration",
				partnerEnvironment: "Partner test",
				serviceNameEn: "Benefits Portal",
				serviceNameFr: "Portail des prestations",
			},
			"018f6f83-0000-0000-0000-000000000801"
		);

		const request = fetchMock.mock.calls[0]?.[1];
		expect(request?.headers).toEqual(
			expect.objectContaining({
				"Idempotency-Key": "018f6f83-0000-0000-0000-000000000801",
			})
		);
		expect(JSON.parse(String(request?.body))).toEqual({
			applicationInformationUuid: "application-information-uuid-1",
			canadaLoginEnvironment: "test",
			configurationName: "Partner test integration",
			partnerEnvironment: "Partner test",
			serviceNameEn: "Benefits Portal",
			serviceNameFr: "Portail des prestations",
		});
		expect(result).toEqual(draft);
	});

	it("reads and conditionally saves a typed draft subresource", async () => {
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValueOnce(jsonResponse(draft))
			.mockResolvedValueOnce(
				jsonResponse({ ...draft, registrationDraftVersion: 2 })
			);

		await getWorkspaceRPApplicationRegistrationDraft(
			workspaceUuid,
			rpApplicationUuid
		);
		await updateWorkspaceRPApplicationRegistrationDraft(
			workspaceUuid,
			rpApplicationUuid,
			{
				expectedDraftVersion: 1,
				registrationAnswers: {
					applicationEnvironmentUrlEn: "https://benefits.canada.ca",
				},
				saveMode: "partial",
				stepId: "endpoints",
			}
		);

		expect(fetchMock.mock.calls[0]?.[1]).toEqual(
			expect.objectContaining({ cache: "no-store", method: "GET" })
		);
		expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toEqual({
			expectedDraftVersion: 1,
			registrationAnswers: {
				applicationEnvironmentUrlEn: "https://benefits.canada.ca",
			},
			saveMode: "partial",
			stepId: "endpoints",
		});
	});

	it("sends the frontend Endpoints completeStep contract without alias drift", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({
				...draft,
				registrationAnswers: endpointsCompleteStepContract.registrationAnswers,
				registrationDraftVersion: 3,
				registrationLastCompletedStep: "endpoints",
			})
		);

		await updateWorkspaceRPApplicationRegistrationDraft(
			workspaceUuid,
			rpApplicationUuid,
			endpointsCompleteStepContract as WorkspaceRPApplicationRegistrationDraftPatch
		);

		expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual(
			endpointsCompleteStepContract
		);
	});

	it("extracts safe field locations from the standardized 422 contract", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse(
				{
					error: {
						code: "validation_error",
						details: [
							{
								input: "invalid-endpoint-value",
								loc: [
									"body",
									"registrationAnswers",
									"applicationEnvironmentUrlEn",
								],
								msg: "Input should be a valid URL",
								type: "url_parsing",
							},
						],
						message:
							"body.registrationAnswers.applicationEnvironmentUrlEn: Input should be a valid URL",
						requestId: "registration-endpoints-422",
					},
				},
				422
			)
		);

		let requestError: Error | null = null;
		try {
			await updateWorkspaceRPApplicationRegistrationDraft(
				workspaceUuid,
				rpApplicationUuid,
				endpointsCompleteStepContract as WorkspaceRPApplicationRegistrationDraftPatch
			);
		} catch (error) {
			requestError = error as Error;
		}

		expect(isWorkspaceRPRegistrationValidationError(requestError)).toBe(true);
		expect(
			getWorkspaceRPRegistrationValidationFieldNames(requestError)
		).toEqual(["applicationEnvironmentUrlEn"]);
	});

	it("completes registration without creating a Production review", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({
				applicationInformationUuid: "application-information-uuid-1",
				registrationCompletedAt: "2026-08-25T12:00:00Z",
				registrationDraftVersion: 8,
				rpApplicationUuid,
				serviceNameEn: "Benefits Portal",
				serviceNameFr: "Portail des prestations",
				workspaceUuid,
			})
		);

		await completeWorkspaceRPApplicationRegistration(
			workspaceUuid,
			rpApplicationUuid,
			7
		);

		expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
			expectedDraftVersion: 7,
		});
		expect(fetchMock.mock.calls[0]?.[0]).toBe(
			`http://localhost:8000/api/v1/workspaces/${workspaceUuid}/applications/${rpApplicationUuid}/registration/complete`
		);
	});
});
