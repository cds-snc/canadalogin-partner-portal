import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApplicationInformationListPage } from "@/features/workspaces/pages/ApplicationInformationListPage";
import { useWorkspace } from "@/features/workspaces/hooks/use-workspace";
import { useWorkspaceApplicationInformationList } from "@/features/workspaces/hooks/use-workspace-application-information";

const navigateMock = vi.fn(() => Promise.resolve());

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string, options?: Record<string, unknown>) => string } => ({
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"common.notAvailable": "Not available",
				"workspaces.appInfoCreateButton": "Create application information",
				"workspaces.appInfoDeletedSuccess": "Application information deleted successfully",
				"workspaces.appInfoListSummary": "Create, review, and update canonical bilingual application details for this workspace.",
				"workspaces.appInfoSectionTitle": "Application Information",
				"workspaces.appInfoServiceNameEnLabel": "Service name (English)",
				"workspaces.appInfoServiceNameFrLabel": "Service name (French)",
				"workspaces.onboardingStateColumn": "Onboarding status",
				"workspaces.onboardingStateUnderReview": "Under review",
				"workspaces.viewAction": "View workspace",
			};

			if (key === "workspaces.appInfoListTitle") {
				return `Application information - ${String(options?.["name"] ?? "")}`;
			}

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: (): typeof navigateMock => navigateMock,
	useParams: (): { workspaceUuid: string } => ({ workspaceUuid: "workspace-uuid-1" }),
	useSearch: (): { deleted?: "1" } => ({ deleted: "1" }),
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
	DataTable: ({ action, primaryAction, rows }: { action: { buttonLabel: string; onAction: (row: { onboardingState: string; serviceNameEn: string; serviceNameFr: string; uuid: string }) => void }; primaryAction: { buttonLabel: string; onAction: () => void }; rows: Array<{ onboardingState: string; serviceNameEn: string; serviceNameFr: string; uuid: string }> }): ReactElement => (
		<section>
			<button onClick={primaryAction.onAction} type="button">
				{primaryAction.buttonLabel}
			</button>
			{rows.map((row) => (
				<div key={row.uuid}>
					<span>{row.serviceNameEn}</span>
					<span>{row.onboardingState}</span>
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

describe("ApplicationInformationListPage", () => {
	it("renders the delete success notice and navigates to detail and create routes", () => {
		vi.mocked(useWorkspace).mockReturnValue({
			error: null,
			isLoading: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
			workspace: {
				createdAt: "2026-07-30T12:00:00Z",
				createdBy: 42,
				deletedAt: null,
				description: "Primary workspace",
				departmentId: 7,
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
					createdAt: "2026-07-30T15:00:00Z",
					createdBy: 42,
					deletedAt: null,
					id: 17,
					isDeleted: false,
					migrationOrTransitionPlan: "Phased transition",
					overview: "Overview text",
					onboardingState: "under_review",
					securityAndPrivacy: "Protected B controls apply",
					serviceNameEn: "Example service",
					serviceNameFr: "Service exemple",
					submittedAt: null,
					technologyAndProtocol: "OIDC with backend mediation",
					underReviewAt: null,
					updatedAt: null,
					usage: "Partner onboarding usage",
					uuid: "application-information-uuid-1",
					workspaceId: 9,
					approvedAt: null,
					launchedAt: null,
				},
			],
			error: null,
			isLoading: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
		});

		render(<ApplicationInformationListPage />);
		expect(screen.getByText(/under review/i)).toBeTruthy();

		expect(
			screen.getByRole("heading", {
				name: /application information deleted successfully/i,
			})
		).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: /view workspace/i }));
		expect(navigateMock).toHaveBeenCalledWith({
			params: {
				applicationInformationUuid: "application-information-uuid-1",
				workspaceUuid: "workspace-uuid-1",
			},
			to: "/workspaces/$workspaceUuid/application-information/$applicationInformationUuid",
		});

		fireEvent.click(
			screen.getByRole("button", { name: /create application information/i })
		);
		expect(navigateMock).toHaveBeenCalledWith({
			params: { workspaceUuid: "workspace-uuid-1" },
			to: "/workspaces/$workspaceUuid/application-information/new",
		});
	});
});