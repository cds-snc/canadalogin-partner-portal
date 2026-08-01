import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceApplicationDetailPage } from "@/features/workspaces/pages/WorkspaceApplicationDetailPage";
import { useWorkspaceApplicationInformationList } from "@/features/workspaces/hooks/use-workspace-application-information";
import { useWorkspaceRPApplicationManagement } from "@/features/workspaces/hooks/use-workspace-rp-application-management";
import { useWorkspaceRPApplication } from "@/features/workspaces/hooks/use-workspace-rp-applications";

const navigateMock = vi.fn();
const deleteRPApplicationMock = vi.fn();
const useSearchMock = vi.fn((): { created?: "1"; updated?: "1" } => ({ created: "1" }));

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string, options?: Record<string, unknown>) => string } => ({
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"common.cancel": "Cancel",
				"common.notAvailable": "Not available",
				"workspaces.applicationDeletedSuccess": "Application deleted successfully",
				"workspaces.applicationsAuditAction": "Review audit activity",
				"workspaces.applicationsBackToList": "Back to RP applications",
				"workspaces.applicationsCreatedSuccess": "RP application created successfully",
				"workspaces.applicationsCreatedAtLabel": "Created",
				"workspaces.applicationsDetailSummary": "Review the current workspace-scoped RP application context and operational links.",
				"workspaces.applicationsEditAction": "Edit application",
				"workspaces.applicationsEnvironmentLabel": "CanadaLogin environment",
				"workspaces.applicationsIbmIdLabel": "IBM Security Verify application ID",
				"workspaces.applicationsLinkedInfoLabel": "Linked application information",
				"workspaces.applicationsNoLinkedInfo": "Not linked",
				"workspaces.applicationsNoRedirectUris": "No redirect URIs were recorded for this RP application.",
				"workspaces.applicationsOwnersLabel": "Application owners",
				"workspaces.applicationsRedirectUrisLabel": "Redirect URIs",
				"workspaces.applicationsSectionTitle": "RP applications",
				"workspaces.applicationsStatusLabel": "Registration status",
				"workspaces.applicationsUrlEnLabel": "Application environment URL (English)",
				"workspaces.applicationsUrlFrLabel": "Application environment URL (French)",
				"workspaces.applicationsUsageAction": "Review usage summary",
				"workspaces.deleteApplication": "Delete application",
				"workspaces.deleteApplicationConfirmBody": `This will permanently remove the application "${String(options?.["name"] ?? "")}".`,
				"workspaces.deleteApplicationConfirmTitle": "Delete application?",
				"workspaces.deletingAction": "Deleting workspace...",
				"workspaces.manageApplicationInformation": "Manage application information",
			};

			if (key === "workspaces.applicationsDetailTitle") {
				return `RP application - ${String(options?.["name"] ?? "")}`;
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
	useSearch: (): { created?: "1"; updated?: "1" } => useSearchMock(),
}));

vi.mock("@/components/ui", () => ({
	Button: ({ children, href, onGcdsClick, type }: PropsWithChildren<{ href?: string; onGcdsClick?: () => void; type: string }>): ReactElement =>
		type === "link" ? (
			<a href={href}>{children}</a>
		) : (
			<button onClick={onGcdsClick} type="button">
				{children}
			</button>
		),
	ConfirmDialog: ({ cancelLabel, confirmLabel, description, isOpen, onCancel, onConfirm, title }: {
		cancelLabel: string;
		confirmLabel: string;
		description: string;
		isOpen: boolean;
		onCancel: () => void;
		onConfirm: () => void;
		title: string;
	}): ReactElement | null =>
		isOpen ? (
			<section>
				<h2>{title}</h2>
				<p>{description}</p>
				<button onClick={onCancel} type="button">
					{cancelLabel}
				</button>
				<button onClick={onConfirm} type="button">
					{confirmLabel}
				</button>
			</section>
		) : null,
	Heading: ({ children, tag }: PropsWithChildren<{ tag?: string }>): ReactElement =>
		tag === "h2" ? <h2>{children}</h2> : <h1>{children}</h1>,
	Notice: ({ children, noticeTitle }: PropsWithChildren<{ noticeTitle: string }>): ReactElement => (
		<section>
			<h2>{noticeTitle}</h2>
			{children}
		</section>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/features/workspaces/hooks/use-workspace-rp-applications", () => ({
	useWorkspaceRPApplication: vi.fn(),
}));

vi.mock("@/features/workspaces/hooks/use-workspace-rp-application-management", () => ({
	useWorkspaceRPApplicationManagement: vi.fn(),
}));

vi.mock("@/features/workspaces/hooks/use-workspace-application-information", () => ({
	useWorkspaceApplicationInformationList: vi.fn(),
}));

describe("WorkspaceApplicationDetailPage", () => {
	it("shows the unlinked application-information state when no canonical record is attached", () => {
		useSearchMock.mockReturnValue({});
		vi.mocked(useWorkspaceRPApplicationManagement).mockReturnValue({
			createRPApplication: vi.fn(),
			deleteRPApplication: deleteRPApplicationMock,
			isCreating: false,
			isDeleting: false,
			isUpdating: false,
			updateRPApplication: vi.fn(),
		});
		vi.mocked(useWorkspaceRPApplication).mockReturnValue({
			application: {
				application_information_id: null,
				application_owner: { owners: [{ email: "owner@example.gc.ca" }] },
				canada_login_environment: "staging",
				created_at: "2026-07-31T10:05:00Z",
				created_by: 7,
				dnr_app_name: "Benefits Portal",
				ibm_sv_application_id: null,
				id: 21,
				is_deleted: false,
				oidc_registration_payload: null,
				status: "draft",
				uuid: "rp-application-uuid-1",
				workspace_id: 9,
			},
			error: null,
			isLoading: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
		});
		vi.mocked(useWorkspaceApplicationInformationList).mockReturnValue({
			applicationInformationRecords: [],
			error: null,
			isLoading: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
		});

		render(<WorkspaceApplicationDetailPage />);

		expect(
			screen.getByText(/linked application information: not linked/i)
		).toBeTruthy();
		expect(
			screen.queryByRole("link", { name: /manage application information/i })
		).toBeNull();
	});

	it("deletes the workspace application and returns to the list", async () => {
		useSearchMock.mockReturnValue({});
		deleteRPApplicationMock.mockResolvedValue({
			message: "RP application deleted successfully",
		});
		vi.mocked(useWorkspaceRPApplicationManagement).mockReturnValue({
			createRPApplication: vi.fn(),
			deleteRPApplication: deleteRPApplicationMock,
			isCreating: false,
			isDeleting: false,
			isUpdating: false,
			updateRPApplication: vi.fn(),
		});
		vi.mocked(useWorkspaceRPApplication).mockReturnValue({
			application: {
				application_information_id: 14,
				application_owner: { owners: [{ email: "owner@example.gc.ca" }] },
				canada_login_environment: "production",
				created_at: "2026-07-31T10:05:00Z",
				created_by: 7,
				dnr_app_name: "Benefits Portal",
				ibm_sv_application_id: "ibm-app-123",
				id: 21,
				is_deleted: false,
				oidc_registration_payload: null,
				status: "active",
				uuid: "rp-application-uuid-1",
				workspace_id: 9,
			},
			error: null,
			isLoading: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
		});
		vi.mocked(useWorkspaceApplicationInformationList).mockReturnValue({
			applicationInformationRecords: [],
			error: null,
			isLoading: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
		});

		render(<WorkspaceApplicationDetailPage />);

		fireEvent.click(screen.getByRole("button", { name: /delete application/i }));
		expect(
			screen.getByRole("heading", { name: /delete application\?/i })
		).toBeTruthy();

		fireEvent.click(screen.getAllByRole("button", { name: /delete application/i })[1]!);

		await waitFor(() => {
			expect(deleteRPApplicationMock).toHaveBeenCalledWith(
				"workspace-uuid-1",
				"rp-application-uuid-1"
			);
			expect(navigateMock).toHaveBeenCalledWith({
				params: { workspaceUuid: "workspace-uuid-1" },
				replace: true,
				search: { deleted: "1" },
				to: "/workspaces/$workspaceUuid/applications",
			});
		});
	});

	it("renders the linked application context and operational links", () => {
		useSearchMock.mockReturnValue({ created: "1" });
		vi.mocked(useWorkspaceRPApplicationManagement).mockReturnValue({
			createRPApplication: vi.fn(),
			deleteRPApplication: deleteRPApplicationMock,
			isCreating: false,
			isDeleting: false,
			isUpdating: false,
			updateRPApplication: vi.fn(),
		});
		vi.mocked(useWorkspaceRPApplication).mockReturnValue({
			application: {
				application_information_id: 14,
				application_owner: { owners: [{ email: "owner@example.gc.ca" }] },
				canada_login_environment: "production",
				created_at: "2026-07-31T10:05:00Z",
				created_by: 7,
				dnr_app_name: "Benefits Portal",
				ibm_sv_application_id: "ibm-app-123",
				id: 21,
				is_deleted: false,
				oidc_registration_payload: {
					application_environment_url_en: "https://benefits.example.gc.ca",
					application_environment_url_fr: "https://prestations.example.gc.ca",
					redirect_uris: ["https://benefits.example.gc.ca/callback"],
				},
				status: "active",
				uuid: "rp-application-uuid-1",
				workspace_id: 9,
			},
			error: null,
			isLoading: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
		});
		vi.mocked(useWorkspaceApplicationInformationList).mockReturnValue({
			applicationInformationRecords: [
				{
					createdAt: "2026-07-31T10:00:00Z",
					createdBy: 7,
					deletedAt: null,
					id: 14,
					isDeleted: false,
					migrationOrTransitionPlan: "Plan",
					overview: "Overview",
					securityAndPrivacy: "Security",
					serviceNameEn: "Benefits portal",
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

		render(<WorkspaceApplicationDetailPage />);

		expect(
			screen.getByRole("heading", { name: /rp application - benefits portal/i })
		).toBeTruthy();
		expect(
			screen.getByRole("heading", { name: /rp application created successfully/i })
		).toBeTruthy();
		expect(screen.getByText(/ibm security verify application id: ibm-app-123/i)).toBeTruthy();
		expect(screen.getByText(/linked application information: benefits portal/i)).toBeTruthy();
		expect(
			screen
				.getByRole("link", { name: /manage application information/i })
				.getAttribute("href")
		).toBe(
			"/workspaces/workspace-uuid-1/application-information/application-information-uuid-1"
		);
		expect(
			screen.getByRole("link", { name: /edit application/i }).getAttribute("href")
		).toBe("/workspaces/workspace-uuid-1/applications/rp-application-uuid-1/edit");
		expect(
			screen.getByRole("link", { name: /review usage summary/i }).getAttribute("href")
		).toBe("/workspaces/workspace-uuid-1/applications/rp-application-uuid-1/usage");
	});
});