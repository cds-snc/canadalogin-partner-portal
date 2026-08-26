import { describe, expect, it } from "vitest";
import {
	createEmptyWorkspaceRPApplicationForm,
	getWorkspaceRPApplicationStepFieldErrorKeys,
	toWorkspaceRPApplicationDraftFormState,
	toWorkspaceRPApplicationRegistrationAnswers,
	validateWorkspaceRPApplicationForm,
	validateWorkspaceRPApplicationStep,
} from "@/features/workspaces/workspace-rp-application-form";
import endpointsCompleteStepContract from "../../../../../tests/contracts/workspace-rp-registration-endpoints-complete-step.json";

describe("workspace-rp-application-form", () => {
	it("serializes the Endpoints step into the cross-stack camelCase contract", () => {
		const form = {
			...createEmptyWorkspaceRPApplicationForm(),
			applicationEnvironmentUrlEn: "https://benefits.canada.ca",
			applicationEnvironmentUrlFr: "https://prestations.canada.ca",
			canadaLoginEnvironment: "test",
			logoutMode: "front_channel",
			logoutUri: "https://benefits.canada.ca/logout",
			postLogoutRedirectUris: "https://benefits.canada.ca/signed-out",
			redirectUris:
				"https://benefits.canada.ca/callback\nhttps://prestations.canada.ca/rappel",
			serviceNameEn: "Benefits Portal",
			serviceNameFr: "Portail des prestations",
		};

		expect({
			expectedDraftVersion: 2,
			registrationAnswers: toWorkspaceRPApplicationRegistrationAnswers(
				form,
				"endpoints"
			),
			saveMode: "completeStep",
			stepId: "endpoints",
		}).toEqual(endpointsCompleteStepContract);
	});

	it("maps a populated form into the canonical registration answers", () => {
		const form: ReturnType<typeof createEmptyWorkspaceRPApplicationForm> = {
			...createEmptyWorkspaceRPApplicationForm(),
			applicationEnvironmentUrlEn: "https://benefits.canada.ca",
			applicationEnvironmentUrlFr: "https://prestations.canada.ca",
			applicationInformationUuid: "application-information-uuid-1",
			canadaLoginEnvironment: "staging",
			clientAuthMethod: "private_key_jwt",
			clientType: "confidential",
			jwksUri: "https://benefits.canada.ca/.well-known/jwks.json",
			logoutMode: "front_channel",
			logoutUri: "https://benefits.canada.ca/logout",
			messageDecryptionContentAlgorithms: ["A256GCM"],
			messageDecryptionKeyManagementAlgorithms: ["RSA-OAEP-256"],
			messageDecryptionSupported: "yes",
			messageDecryptionTargets: ["id_token", "userinfo"],
			migrationSectorIdentifierUrl: "https://benefits.canada.ca/sector.json",
			pkceAlgorithms: ["S256"],
			pkceSupported: "yes",
			postLogoutRedirectUris:
				"https://benefits.canada.ca/logout-complete\nhttps://benefits.canada.ca/logout-fallback",
			privateKeyDistributionMethod: "jwks_uri",
			redirectUris: "https://benefits.canada.ca/callback",
			requestEncryptionRoadmap: "no",
			requestEncryptionSupported: "no",
			requestSigningRevisitOn: "2027-03",
			requestSigningRoadmap: "yes",
			requestSigningSupported: "no",
			requestedScopes: ["openid", "profile", "email"],
			sectorIdentifier: "https://benefits.canada.ca",
			serviceNameEn: "Benefits Portal",
			serviceNameFr: "Portail des prestations",
			sharesPairwiseIdentifiers: "no",
			signatureValidationAlgorithms: ["RS256"],
			signatureValidationSupported: "yes",
			signatureValidationTargets: ["id_token"],
			supportsAuthorizationCodeFlow: "yes",
		};

		const payload = toWorkspaceRPApplicationRegistrationAnswers(form);

		expect(payload).toMatchObject({
			applicationEnvironmentUrlEn: "https://benefits.canada.ca",
			applicationEnvironmentUrlFr: "https://prestations.canada.ca",
			applicationInformationUuid: "application-information-uuid-1",
			canadaLoginEnvironment: "staging",
			clientAuthMethod: "private_key_jwt",
			clientType: "confidential",
			jwksUri: "https://benefits.canada.ca/.well-known/jwks.json",
			logoutMode: "front_channel",
			logoutUri: "https://benefits.canada.ca/logout",
			messageDecryptionContentAlgorithms: ["A256GCM"],
			messageDecryptionKeyManagementAlgorithms: ["RSA-OAEP-256"],
			messageDecryptionSupported: true,
			messageDecryptionTargets: ["id_token", "userinfo"],
			migrationSectorIdentifierUrl: "https://benefits.canada.ca/sector.json",
			pkceAlgorithms: ["S256"],
			pkceSupported: true,
			postLogoutRedirectUris: [
				"https://benefits.canada.ca/logout-complete",
				"https://benefits.canada.ca/logout-fallback",
			],
			privateKeyDistributionMethod: "jwks_uri",
			redirectUris: ["https://benefits.canada.ca/callback"],
			requestEncryptionRoadmap: false,
			requestEncryptionSupported: false,
			requestSigningRevisitOn: "2027-03",
			requestSigningRoadmap: true,
			requestSigningSupported: false,
			requestedScopes: ["openid", "profile", "email"],
			sectorIdentifier: "https://benefits.canada.ca",
			serviceNameEn: "Benefits Portal",
			serviceNameFr: "Portail des prestations",
			sharesPairwiseIdentifiers: false,
			signatureValidationAlgorithms: ["RS256"],
			signatureValidationSupported: true,
			signatureValidationTargets: ["id_token"],
			supportsAuthorizationCodeFlow: true,
		});
	});

	it("flags invalid questionnaire combinations before save", () => {
		const form: ReturnType<typeof createEmptyWorkspaceRPApplicationForm> = {
			...createEmptyWorkspaceRPApplicationForm(),
			applicationEnvironmentUrlEn: "https://service.example.gc.ca",
			applicationEnvironmentUrlFr: "https://service.example.gc.ca/fr",
			canadaLoginEnvironment: "test",
			clientAuthMethod: "private_key_jwt",
			clientType: "public",
			logoutMode: "front_channel",
			logoutUri: "https://service.example.gc.ca/logout",
			messageDecryptionRoadmap: "no",
			messageDecryptionSupported: "no",
			pkceSupported: "no",
			redirectUris: "https://service.example.gc.ca/callback",
			requestEncryptionRoadmap: "no",
			requestEncryptionSupported: "no",
			requestSigningRoadmap: "no",
			requestSigningSupported: "no",
			requestedScopes: ["profile"],
			sectorIdentifier: "https://service.example.gc.ca",
			serviceNameEn: "Service name",
			serviceNameFr: "Nom du service",
			sharesPairwiseIdentifiers: "no",
			signatureValidationRoadmap: "no",
			signatureValidationSupported: "no",
			supportsAuthorizationCodeFlow: "no",
		};

		expect(validateWorkspaceRPApplicationForm(form)).toEqual(
			expect.arrayContaining([
				"workspaces.applicationsValidationAuthorizationCodeFlowRequired",
				"workspaces.applicationsValidationFrontChannelCanadaDomain",
				"workspaces.applicationsValidationOpenIdScopeRequired",
				"workspaces.applicationsValidationPrivateKeyDetailsRequired",
				"workspaces.applicationsValidationPublicClientPkceRequired",
			])
		);
	});

	it("maps step validation messages to the affected form controls", () => {
		const form = createEmptyWorkspaceRPApplicationForm();
		form.logoutMode = "front_channel";
		const messageKeys = validateWorkspaceRPApplicationStep(form, "endpoints");

		expect(
			getWorkspaceRPApplicationStepFieldErrorKeys(
				form,
				"endpoints",
				messageKeys
			)
		).toMatchObject({
			applicationEnvironmentUrlEn:
				"workspaces.applicationsValidationRequiredAnswers",
			applicationEnvironmentUrlFr:
				"workspaces.applicationsValidationRequiredAnswers",
			logoutUri: "workspaces.applicationsValidationRequiredAnswers",
			redirectUris: "workspaces.applicationsValidationRequiredAnswers",
		});
	});

	it("validates only the active step before continuing", () => {
		const form = {
			...createEmptyWorkspaceRPApplicationForm(),
			applicationInformationUuid: "application-information-1",
			canadaLoginEnvironment: "test",
			configurationName: "Partner test integration",
			partnerEnvironment: "Partner test",
			serviceNameEn: "Benefits Portal",
			serviceNameFr: "Portail des prestations",
		};

		expect(validateWorkspaceRPApplicationStep(form, "basics")).toEqual([]);
		expect(validateWorkspaceRPApplicationStep(form, "endpoints")).toContain(
			"workspaces.applicationsValidationRequiredAnswers"
		);
	});

	it("clears dependent key answers when the controlling choice changes", () => {
		const form = {
			...createEmptyWorkspaceRPApplicationForm(),
			clientAuthMethod: "client_secret_basic",
			jwksUri: "https://benefits.canada.ca/.well-known/jwks.json",
			offlineJwkOrCertificate: "public certificate",
			privateKeyDistributionMethod: "offline_exchange",
		};

		const answers = toWorkspaceRPApplicationRegistrationAnswers(
			form,
			"client-and-access"
		) as Record<string, unknown>;

		expect(answers["privateKeyDistributionMethod"]).toBeNull();
		expect(answers["jwksUri"]).toBeNull();
		expect(answers["offlineJwkOrCertificate"]).toBeNull();
	});

	it("hydrates the fixed camelCase draft response without raw JSON assumptions", () => {
		const form = toWorkspaceRPApplicationDraftFormState({
			applicationInformationUuid: "application-information-uuid-1",
			configurationName: "Staging integration A",
			registrationCompletedAt: null,
			registrationAnswers: {
				canadaLoginEnvironment: "staging",
				redirectUris: ["https://benefits.canada.ca/callback"],
				serviceNameEn: "Benefits Portal",
				serviceNameFr: "Portail des prestations",
			},
			registrationDraftVersion: 2,
			registrationLastCompletedStep: "endpoints",
			rpApplicationUuid: "rp-application-uuid-1",
			workspaceUuid: "workspace-uuid-1",
		});

		expect(form.canadaLoginEnvironment).toBe("staging");
		expect(form.applicationInformationUuid).toBe(
			"application-information-uuid-1"
		);
		expect(form.configurationName).toBe("Staging integration A");
		expect(form.redirectUris).toBe("https://benefits.canada.ca/callback");
		expect(form.serviceNameEn).toBe("Benefits Portal");
	});
});
