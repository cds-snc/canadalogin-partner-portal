import { describe, expect, it } from "vitest";
import {
	createEmptyWorkspaceRPApplicationForm,
	toRPApplicationCreatePayload,
	toWorkspaceRPApplicationFormState,
	validateWorkspaceRPApplicationForm,
} from "@/features/workspaces/workspace-rp-application-form";

describe("workspace-rp-application-form", () => {
	it("maps a populated create form into the backend questionnaire payload", () => {
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

		const payload = toRPApplicationCreatePayload(form);

		expect(payload).toMatchObject({
			application_environment_url_en: "https://benefits.canada.ca",
			application_environment_url_fr: "https://prestations.canada.ca",
			application_information_uuid: "application-information-uuid-1",
			canada_login_environment: "staging",
			client_auth_method: "private_key_jwt",
			client_type: "confidential",
			jwks_uri: "https://benefits.canada.ca/.well-known/jwks.json",
			logout_mode: "front_channel",
			logout_uri: "https://benefits.canada.ca/logout",
			message_decryption_content_algorithms: ["A256GCM"],
			message_decryption_key_management_algorithms: ["RSA-OAEP-256"],
			message_decryption_supported: true,
			message_decryption_targets: ["id_token", "userinfo"],
			migration_sector_identifier_url: "https://benefits.canada.ca/sector.json",
			pkce_algorithms: ["S256"],
			pkce_supported: true,
			post_logout_redirect_uris: [
				"https://benefits.canada.ca/logout-complete",
				"https://benefits.canada.ca/logout-fallback",
			],
			private_key_distribution_method: "jwks_uri",
			redirect_uris: ["https://benefits.canada.ca/callback"],
			request_encryption_roadmap: false,
			request_encryption_supported: false,
			request_signing_revisit_on: "2027-03",
			request_signing_roadmap: true,
			request_signing_supported: false,
			requested_scopes: ["openid", "profile", "email"],
			sector_identifier: "https://benefits.canada.ca",
			service_name_en: "Benefits Portal",
			service_name_fr: "Portail des prestations",
			shares_pairwise_identifiers: false,
			signature_validation_algorithms: ["RS256"],
			signature_validation_supported: true,
			signature_validation_targets: ["id_token"],
			supports_authorization_code_flow: true,
		});
	});

	it("hydrates edit form state from the workspace RP application read model", () => {
		const form = toWorkspaceRPApplicationFormState(
			{
				application_information_id: 14,
				canada_login_environment: "production",
				created_at: "2026-07-31T10:05:00Z",
				created_by: 7,
				dnr_app_name: "Benefits Portal",
				id: 21,
				is_deleted: false,
				oidc_registration_payload: {
					application_environment_url_en: "https://benefits.canada.ca",
					application_environment_url_fr: "https://prestations.canada.ca",
					client_auth_method: "client_secret_basic",
					client_type: "confidential",
					logout_mode: "front_channel",
					logout_uri: "https://benefits.canada.ca/logout",
					pkce_supported: true,
					pkce_algorithms: ["S256"],
					redirect_uris: ["https://benefits.canada.ca/callback"],
					requested_scopes: ["openid", "profile"],
					sector_identifier: "https://benefits.canada.ca",
					service_name_en: "Benefits Portal",
					service_name_fr: "Portail des prestations",
					supports_authorization_code_flow: true,
				},
				status: "active",
				uuid: "rp-application-uuid-1",
				workspace_id: 9,
			},
			"application-information-uuid-1"
		);

		expect(form.applicationInformationUuid).toBe("application-information-uuid-1");
		expect(form.canadaLoginEnvironment).toBe("production");
		expect(form.redirectUris).toBe("https://benefits.canada.ca/callback");
		expect(form.requestedScopes).toEqual(["openid", "profile"]);
		expect(form.supportsAuthorizationCodeFlow).toBe("yes");
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
});