import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceApplicationEditPage } from "@/features/workspaces/pages/WorkspaceApplicationEditPage";
import { useWorkspaceApplicationInformationList } from "@/features/workspaces/hooks/use-workspace-application-information";
import { useWorkspaceRPApplicationManagement } from "@/features/workspaces/hooks/use-workspace-rp-application-management";
import { useWorkspaceRPApplication } from "@/features/workspaces/hooks/use-workspace-rp-applications";

const navigateMock = vi.fn(() => Promise.resolve());
const updateRPApplicationMock = vi.fn(() =>
	Promise.resolve({
		created_at: "2026-07-31T12:00:00Z",
		created_by: 42,
		dnr_app_name: "Benefits Portal Updated",
		id: 21,
		is_deleted: false,
		status: null,
		uuid: "rp-application-uuid-1",
		workspace_id: 9,
	})
);

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string, options?: Record<string, unknown>) => string } => ({
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"workspaces.applicationsEditSummary": "Update the questionnaire-backed RP application details before returning to the detail page.",
				"workspaces.applicationsLoadingBody": "Loading workspace-scoped RP applications.",
				"workspaces.applicationsLoadingTitle": "Loading RP applications",
				"workspaces.applicationsSaveAction": "Save RP application",
				"workspaces.applicationsSavingAction": "Saving RP application...",
				"workspaces.applicationsSectionTitle": "RP applications",
				"workspaces.applicationsValidationErrorTitle": "Complete the RP application questionnaire before saving",
				"workspaces.applicationsValidationOpenIdScopeRequired": "The requested scopes must include openid.",
			};

			if (key === "workspaces.applicationsEditPageTitle") {
				return `Edit RP application - ${String(options?.["name"] ?? "")}`;
			}

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: (): typeof navigateMock => navigateMock,
	useParams: (): { rpApplicationUuid: string; workspaceUuid: string } => ({
		rpApplicationUuid: "rp-application-uuid-1",
		workspaceUuid: "workspace-uuid-1",
	}),
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
					onChange("requestedScopes", ["openid", "profile", "email"]);
					onChange("serviceNameEn", "Benefits Portal Updated");
				}}
				type="button"
			>
				Update fields
			</button>
			<button
				onClick={() => {
					onChange("requestedScopes", ["profile"]);
				}}
				type="button"
			>
				Set invalid scopes
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

vi.mock("@/features/workspaces/hooks/use-workspace-rp-applications", () => ({
	useWorkspaceRPApplication: vi.fn(),
}));

vi.mock("@/features/workspaces/hooks/use-workspace-rp-application-management", () => ({
	useWorkspaceRPApplicationManagement: vi.fn(),
}));

describe("WorkspaceApplicationEditPage", () => {
	it("updates the workspace-scoped RP application and redirects to detail", async () => {
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
		vi.mocked(useWorkspaceRPApplication).mockReturnValue({
			application: {
				application_information_id: 17,
				canada_login_environment: "staging",
				created_at: "2026-07-31T12:00:00Z",
				created_by: 42,
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
					message_decryption_content_algorithms: ["A256GCM"],
					message_decryption_key_management_algorithms: ["RSA-OAEP-256"],
					message_decryption_supported: true,
					message_decryption_targets: ["id_token"],
					pkce_algorithms: ["S256"],
					pkce_supported: true,
					redirect_uris: ["https://benefits.canada.ca/callback"],
					request_encryption_roadmap: false,
					request_encryption_supported: false,
					request_signing_roadmap: false,
					request_signing_supported: false,
					requested_scopes: ["openid", "profile"],
					sector_identifier: "https://benefits.canada.ca",
					service_name_en: "Benefits Portal",
					service_name_fr: "Portail des prestations",
					shares_pairwise_identifiers: false,
					signature_validation_algorithms: ["RS256"],
					signature_validation_supported: true,
					signature_validation_targets: ["id_token"],
					supports_authorization_code_flow: true,
				},
				status: null,
				uuid: "rp-application-uuid-1",
				workspace_id: 9,
			},
			error: null,
			isLoading: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
		});
		vi.mocked(useWorkspaceRPApplicationManagement).mockReturnValue({
			createRPApplication: vi.fn(),
			isCreating: false,
			isUpdating: false,
			updateRPApplication: updateRPApplicationMock,
		});

		render(<WorkspaceApplicationEditPage />);

		fireEvent.click(screen.getByRole("button", { name: /update fields/i }));
		fireEvent.click(screen.getByRole("button", { name: /save rp application/i }));

		expect(updateRPApplicationMock).toHaveBeenCalledWith(
			"workspace-uuid-1",
			"rp-application-uuid-1",
			expect.objectContaining({
				application_information_uuid: "application-information-uuid-1",
				requested_scopes: ["openid", "profile", "email"],
				service_name_en: "Benefits Portal Updated",
			})
		);

		await waitFor(() => {
			expect(navigateMock).toHaveBeenCalledWith({
				params: {
					rpApplicationUuid: "rp-application-uuid-1",
					workspaceUuid: "workspace-uuid-1",
				},
				replace: true,
				search: { updated: "1" },
				to: "/workspaces/$workspaceUuid/applications/$rpApplicationUuid",
			});
		});
	});

	it("blocks invalid questionnaire data before calling the update mutation", () => {
		updateRPApplicationMock.mockClear();
		navigateMock.mockClear();
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
		vi.mocked(useWorkspaceRPApplication).mockReturnValue({
			application: {
				application_information_id: 17,
				canada_login_environment: "staging",
				created_at: "2026-07-31T12:00:00Z",
				created_by: 42,
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
					message_decryption_content_algorithms: ["A256GCM"],
					message_decryption_key_management_algorithms: ["RSA-OAEP-256"],
					message_decryption_supported: true,
					message_decryption_targets: ["id_token"],
					pkce_algorithms: ["S256"],
					pkce_supported: true,
					redirect_uris: ["https://benefits.canada.ca/callback"],
					request_encryption_roadmap: false,
					request_encryption_supported: false,
					request_signing_roadmap: false,
					request_signing_supported: false,
					requested_scopes: ["openid", "profile"],
					sector_identifier: "https://benefits.canada.ca",
					service_name_en: "Benefits Portal",
					service_name_fr: "Portail des prestations",
					shares_pairwise_identifiers: false,
					signature_validation_algorithms: ["RS256"],
					signature_validation_supported: true,
					signature_validation_targets: ["id_token"],
					supports_authorization_code_flow: true,
				},
				status: null,
				uuid: "rp-application-uuid-1",
				workspace_id: 9,
			},
			error: null,
			isLoading: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
		});
		vi.mocked(useWorkspaceRPApplicationManagement).mockReturnValue({
			createRPApplication: vi.fn(),
			isCreating: false,
			isUpdating: false,
			updateRPApplication: updateRPApplicationMock,
		});

		render(<WorkspaceApplicationEditPage />);

		fireEvent.click(screen.getByRole("button", { name: /set invalid scopes/i }));
		fireEvent.click(screen.getByRole("button", { name: /save rp application/i }));

		expect(updateRPApplicationMock).not.toHaveBeenCalled();
		expect(navigateMock).not.toHaveBeenCalled();
		expect(screen.getByText(/requested scopes must include openid/i)).toBeTruthy();
	});
});