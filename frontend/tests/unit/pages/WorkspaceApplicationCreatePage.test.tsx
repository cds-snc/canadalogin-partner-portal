import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceApplicationCreatePage } from "@/features/workspaces/pages/WorkspaceApplicationCreatePage";
import { useWorkspaceApplicationInformationList } from "@/features/workspaces/hooks/use-workspace-application-information";
import { useWorkspaceRPApplicationManagement } from "@/features/workspaces/hooks/use-workspace-rp-application-management";

const navigateMock = vi.fn(() => Promise.resolve());
const createRPApplicationMock = vi.fn(() =>
	Promise.resolve({
		created_at: "2026-07-31T12:00:00Z",
		created_by: 42,
		dnr_app_name: "Benefits Portal",
		id: 21,
		is_deleted: false,
		status: null,
		uuid: "rp-application-uuid-1",
		workspace_id: 9,
	})
);

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string) => string } => ({
		t: (key: string): string => {
			const translations: Record<string, string> = {
				"workspaces.applicationsCreateAction": "Create RP application",
				"workspaces.applicationsCreatePageTitle": "Create RP application",
				"workspaces.applicationsCreateSummary": "Register a workspace-scoped RP application for one CanadaLogin environment.",
				"workspaces.applicationsSavingAction": "Saving RP application...",
				"workspaces.applicationsValidationErrorTitle": "Complete the RP application questionnaire before saving",
				"workspaces.applicationsValidationOpenIdScopeRequired": "The requested scopes must include openid.",
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: (): typeof navigateMock => navigateMock,
	useParams: (): { workspaceUuid: string } => ({ workspaceUuid: "workspace-uuid-1" }),
}));

vi.mock("@/components/ui", () => ({
	Heading: ({ children }: PropsWithChildren): ReactElement => <h1>{children}</h1>,
	Notice: ({ children, noticeTitle }: PropsWithChildren<{ noticeTitle: string }>): ReactElement => (
		<section>
			<h2>{noticeTitle}</h2>
			{children}
		</section>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/features/workspaces/components/WorkspaceRPApplicationForm", () => ({
	WorkspaceRPApplicationForm: ({ onChange, onSubmit, submitLabel }: { onChange: (field: string, value: string | Array<string>) => void; onSubmit: () => void; submitLabel: string }): ReactElement => (
		<section>
			<button
				onClick={() => {
					onChange("applicationEnvironmentUrlEn", "https://benefits.canada.ca");
					onChange("applicationEnvironmentUrlFr", "https://prestations.canada.ca");
					onChange("applicationInformationUuid", "application-information-uuid-1");
					onChange("canadaLoginEnvironment", "staging");
					onChange("clientAuthMethod", "private_key_jwt");
					onChange("clientType", "confidential");
					onChange("jwksUri", "https://benefits.canada.ca/.well-known/jwks.json");
					onChange("logoutMode", "front_channel");
					onChange("logoutUri", "https://benefits.canada.ca/logout");
					onChange("messageDecryptionContentAlgorithms", ["A256GCM"]);
					onChange("messageDecryptionKeyManagementAlgorithms", ["RSA-OAEP-256"]);
					onChange("messageDecryptionSupported", "yes");
					onChange("messageDecryptionTargets", ["id_token"]);
					onChange("pkceAlgorithms", ["S256"]);
					onChange("pkceSupported", "yes");
					onChange("privateKeyDistributionMethod", "jwks_uri");
					onChange("redirectUris", "https://benefits.canada.ca/callback");
					onChange("requestEncryptionRoadmap", "no");
					onChange("requestEncryptionSupported", "no");
					onChange("requestSigningRoadmap", "no");
					onChange("requestSigningSupported", "no");
					onChange("requestedScopes", ["openid", "profile", "email"]);
					onChange("sectorIdentifier", "https://benefits.canada.ca");
					onChange("serviceNameEn", "Benefits Portal");
					onChange("serviceNameFr", "Portail des prestations");
					onChange("sharesPairwiseIdentifiers", "no");
					onChange("signatureValidationAlgorithms", ["RS256"]);
					onChange("signatureValidationSupported", "yes");
					onChange("signatureValidationTargets", ["id_token"]);
					onChange("supportsAuthorizationCodeFlow", "yes");
				}}
				type="button"
			>
				Fill form
			</button>
			<button
				onClick={() => {
					onChange("applicationEnvironmentUrlEn", "https://benefits.canada.ca");
					onChange("applicationEnvironmentUrlFr", "https://prestations.canada.ca");
					onChange("canadaLoginEnvironment", "staging");
					onChange("clientAuthMethod", "client_secret_basic");
					onChange("clientType", "confidential");
					onChange("logoutMode", "back_channel");
					onChange("logoutUri", "https://benefits.canada.ca/logout");
					onChange("messageDecryptionRoadmap", "no");
					onChange("messageDecryptionSupported", "no");
					onChange("pkceSupported", "yes");
					onChange("pkceAlgorithms", ["S256"]);
					onChange("redirectUris", "https://benefits.canada.ca/callback");
					onChange("requestEncryptionRoadmap", "no");
					onChange("requestEncryptionSupported", "no");
					onChange("requestSigningRoadmap", "no");
					onChange("requestSigningSupported", "no");
					onChange("requestedScopes", ["profile"]);
					onChange("sectorIdentifier", "https://benefits.canada.ca");
					onChange("serviceNameEn", "Benefits Portal");
					onChange("serviceNameFr", "Portail des prestations");
					onChange("sharesPairwiseIdentifiers", "no");
					onChange("signatureValidationRoadmap", "no");
					onChange("signatureValidationSupported", "no");
					onChange("supportsAuthorizationCodeFlow", "yes");
				}}
				type="button"
			>
				Fill invalid form
			</button>
			<button onClick={onSubmit} type="button">
				{submitLabel}
			</button>
		</section>
	),
}));

vi.mock("@/features/workspaces/hooks/use-workspace-application-information", () => ({
	useWorkspaceApplicationInformationList: vi.fn(),
}));

vi.mock("@/features/workspaces/hooks/use-workspace-rp-application-management", () => ({
	useWorkspaceRPApplicationManagement: vi.fn(),
}));

describe("WorkspaceApplicationCreatePage", () => {
	it("creates a workspace-scoped RP application and redirects to detail", async () => {
		vi.mocked(useWorkspaceApplicationInformationList).mockReturnValue({
			applicationInformationRecords: [
				{
					createdAt: "2026-07-31T11:00:00Z",
					createdBy: 42,
					deletedAt: null,
					id: 17,
					isDeleted: false,
					migrationOrTransitionPlan: "Plan",
					overview: "Overview",
					securityAndPrivacy: "Protected B",
					serviceNameEn: "Benefits Portal",
					serviceNameFr: "Portail des prestations",
					technologyAndProtocol: "OIDC",
					updatedAt: null,
					usage: "Usage",
					uuid: "application-information-uuid-1",
					workspaceId: 9,
				},
			],
			error: null,
			isLoading: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
		});
		vi.mocked(useWorkspaceRPApplicationManagement).mockReturnValue({
			createRPApplication: createRPApplicationMock,
			isCreating: false,
			isUpdating: false,
			updateRPApplication: vi.fn(),
		});

		render(<WorkspaceApplicationCreatePage />);

		fireEvent.click(screen.getByRole("button", { name: /fill form/i }));
		fireEvent.click(screen.getByRole("button", { name: /create rp application/i }));

		expect(createRPApplicationMock).toHaveBeenCalledWith(
			"workspace-uuid-1",
			expect.objectContaining({
				application_information_uuid: "application-information-uuid-1",
				canada_login_environment: "staging",
				client_auth_method: "private_key_jwt",
				client_type: "confidential",
				message_decryption_supported: true,
				pkce_supported: true,
				request_signing_supported: false,
				requested_scopes: ["openid", "profile", "email"],
				service_name_en: "Benefits Portal",
			})
		);

		await waitFor(() => {
			expect(navigateMock).toHaveBeenCalledWith({
				params: {
					rpApplicationUuid: "rp-application-uuid-1",
					workspaceUuid: "workspace-uuid-1",
				},
				replace: true,
				search: { created: "1" },
				to: "/workspaces/$workspaceUuid/applications/$rpApplicationUuid",
			});
		});
	});

	it("blocks invalid questionnaire data before calling the create mutation", () => {
		createRPApplicationMock.mockClear();
		navigateMock.mockClear();
		vi.mocked(useWorkspaceApplicationInformationList).mockReturnValue({
			applicationInformationRecords: [],
			error: null,
			isLoading: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
		});
		vi.mocked(useWorkspaceRPApplicationManagement).mockReturnValue({
			createRPApplication: createRPApplicationMock,
			isCreating: false,
			isUpdating: false,
			updateRPApplication: vi.fn(),
		});

		render(<WorkspaceApplicationCreatePage />);

		fireEvent.click(screen.getByRole("button", { name: /fill invalid form/i }));
		fireEvent.click(screen.getByRole("button", { name: /create rp application/i }));

		expect(createRPApplicationMock).not.toHaveBeenCalled();
		expect(navigateMock).not.toHaveBeenCalled();
		expect(screen.getByText(/requested scopes must include openid/i)).toBeTruthy();
	});
});