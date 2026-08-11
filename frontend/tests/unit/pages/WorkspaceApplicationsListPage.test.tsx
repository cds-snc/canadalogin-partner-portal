import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceApplicationsListPage } from "@/features/workspaces/pages/WorkspaceApplicationsListPage";
import { useWorkspaceApplicationInformationList } from "@/features/workspaces/hooks/use-workspace-application-information";
import { useWorkspace } from "@/features/workspaces/hooks/use-workspace";
import { useWorkspaceRPApplications } from "@/features/workspaces/hooks/use-workspace-rp-applications";

const navigateMock = vi.fn();
const useSearchMock = vi.fn((): { deleted?: "1" } => ({}));

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string, options?: Record<string, unknown>) => string } => ({
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
					"workspaces.applicationDeletedSuccess": "Application deleted successfully",
					"workspaces.applicationsCreateAction": "Create RP application",
				"common.notAvailable": "Not available",
				"workspaces.applicationsEnvironmentColumn": "Environment",
				"workspaces.applicationsLinkedInfoColumn": "Linked application information",
				"workspaces.applicationsListSummary": "Review workspace-scoped RP application registrations and open their operational views.",
				"workspaces.applicationsLoadingBody": "Loading workspace-scoped RP applications.",
				"workspaces.applicationsLoadingTitle": "Loading RP applications",
				"workspaces.applicationsNameColumn": "Application name",
				"workspaces.applicationsNoLinkedInfo": "Not linked",
				"workspaces.applicationsSectionTitle": "RP applications",
				"workspaces.applicationsStatusColumn": "Status",
				"workspaces.onboardingStateColumn": "Onboarding status",
				"workspaces.onboardingStateDraft": "Draft",
				"workspaces.onboardingStateUnderReview": "Under review",
				"workspaces.applicationsViewAction": "View application",
			};

			if (key === "workspaces.applicationsListTitle") {
				return `RP applications - ${String(options?.["name"] ?? "")}`;
			}

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: (): typeof navigateMock => navigateMock,
	useParams: (): { workspaceUuid: string } => ({ workspaceUuid: "workspace-uuid-1" }),
	useSearch: (): { deleted?: "1" } => useSearchMock(),
}));

vi.mock("@/components/ui", () => ({
	Button: ({ children, href }: PropsWithChildren<{ href?: string }>): ReactElement => (
		<a href={href}>{children}</a>
	),
	DataTable: ({ action, rows }: { action: { buttonLabel: string; onAction: (row: { linkedApplicationInformation: string; name: string; onboardingState: string; uuid: string }) => void }; rows: Array<{ linkedApplicationInformation: string; name: string; onboardingState: string; uuid: string }> }): ReactElement => (
		<section>
			{rows.map((row) => (
				<div key={row.uuid}>
					<span>{row.name}</span>
					<span>{row.onboardingState}</span>
					<span>{row.linkedApplicationInformation}</span>
					<button onClick={() => action.onAction(row)} type="button">
						{action.buttonLabel}
					</button>
				</div>
			))}
		</section>
	),
	Heading: ({ children }: PropsWithChildren): ReactElement => <h1>{children}</h1>,
	Notice: ({ children, noticeTitle }: PropsWithChildren<{ noticeTitle: string }>): ReactElement => (
		<section>
			<h2>{noticeTitle}</h2>
			{children}
		</section>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/features/workspaces/hooks/use-workspace", () => ({
	useWorkspace: vi.fn(),
}));

vi.mock("@/features/workspaces/hooks/use-workspace-application-information", () => ({
	useWorkspaceApplicationInformationList: vi.fn(),
}));

vi.mock("@/features/workspaces/hooks/use-workspace-rp-applications", () => ({
	useWorkspaceRPApplications: vi.fn(),
}));

describe("WorkspaceApplicationsListPage", () => {
	it("shows a delete success notice when redirected from the detail page", () => {
		useSearchMock.mockReturnValue({ deleted: "1" });
		vi.mocked(useWorkspace).mockReturnValue({
			error: null,
			isLoading: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
			workspace: {
				createdAt: "2026-07-31T10:00:00Z",
				createdBy: 7,
				deletedAt: null,
				description: null,
				departmentId: 10,
				id: 9,
				isDeleted: false,
				name: "Benefits Workspace",
				slug: "benefits-workspace",
				updatedAt: null,
				uuid: "workspace-uuid-1",
			},
		});
		vi.mocked(useWorkspaceApplicationInformationList).mockReturnValue({
			applicationInformationRecords: [],
			error: null,
			isLoading: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
		});
		vi.mocked(useWorkspaceRPApplications).mockReturnValue({
			applications: [],
			error: null,
			isLoading: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
		});

		render(<WorkspaceApplicationsListPage />);

		expect(
			screen.getByRole("heading", { name: /application deleted successfully/i })
		).toBeTruthy();
	});

	it("shows linked and unlinked application-information context in the applications table", () => {
		useSearchMock.mockReturnValue({});
		vi.mocked(useWorkspace).mockReturnValue({
			error: null,
			isLoading: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
			workspace: {
				createdAt: "2026-07-31T10:00:00Z",
				createdBy: 7,
				deletedAt: null,
				description: null,
				departmentId: 10,
				id: 9,
				isDeleted: false,
				name: "Benefits Workspace",
				slug: "benefits-workspace",
				updatedAt: null,
				uuid: "workspace-uuid-1",
			},
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
		vi.mocked(useWorkspaceRPApplications).mockReturnValue({
			applications: [
				{
					application_information_id: 14,
					canada_login_environment: "staging",
					created_at: "2026-07-31T10:05:00Z",
					created_by: 7,
					dnr_app_name: "Benefits Portal",
					id: 21,
					is_deleted: false,
					onboarding_state: "under_review",
					oidc_registration_payload: null,
					status: "active",
					uuid: "rp-application-uuid-1",
					workspace_id: 9,
					promotion_status: null,
				},
				{
					application_information_id: null,
					canada_login_environment: "test",
					created_at: "2026-07-31T11:05:00Z",
					created_by: 7,
					dnr_app_name: "Standalone Portal",
					id: 22,
					is_deleted: false,
					onboarding_state: "draft",
					oidc_registration_payload: null,
					status: "draft",
					uuid: "rp-application-uuid-2",
					workspace_id: 9,
					promotion_status: null,
				},
			],
			error: null,
			isLoading: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
		});

		render(<WorkspaceApplicationsListPage />);

		expect(screen.getByText("Benefits portal")).toBeTruthy();
		expect(screen.getByText(/under review/i)).toBeTruthy();
		expect(screen.getByText("Not linked")).toBeTruthy();
	});

	it("renders workspace applications and opens the detail route", () => {
		useSearchMock.mockReturnValue({});
		vi.mocked(useWorkspace).mockReturnValue({
			error: null,
			isLoading: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
			workspace: {
				createdAt: "2026-07-31T10:00:00Z",
				createdBy: 7,
				deletedAt: null,
				description: null,
				departmentId: 10,
				id: 9,
				isDeleted: false,
				name: "Benefits Workspace",
				slug: "benefits-workspace",
				updatedAt: null,
				uuid: "workspace-uuid-1",
			},
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
		vi.mocked(useWorkspaceRPApplications).mockReturnValue({
			applications: [
				{
					application_information_id: 14,
					canada_login_environment: "staging",
					created_at: "2026-07-31T10:05:00Z",
					created_by: 7,
					dnr_app_name: "Benefits Portal",
					id: 21,
					is_deleted: false,
					onboarding_state: "under_review",
					oidc_registration_payload: null,
					status: "active",
					uuid: "rp-application-uuid-1",
					workspace_id: 9,
					promotion_status: null,
				},
			],
			error: null,
			isLoading: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
		});

		render(<WorkspaceApplicationsListPage />);

		expect(
			screen.getByRole("heading", { name: /rp applications - benefits workspace/i })
		).toBeTruthy();
		expect(
			screen.getByRole("link", { name: /create rp application/i }).getAttribute("href")
		).toBe("/workspaces/workspace-uuid-1/applications/new");
		expect(screen.getByText("Benefits Portal")).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: /view application/i }));

		expect(navigateMock).toHaveBeenCalledWith({
			params: {
				rpApplicationUuid: "rp-application-uuid-1",
				workspaceUuid: "workspace-uuid-1",
			},
			to: "/workspaces/$workspaceUuid/applications/$rpApplicationUuid",
		});
	});
});