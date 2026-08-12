import type { PropsWithChildren, ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceApplicationsListPage } from "@/features/workspaces/pages/WorkspaceApplicationsListPage";
import { useWorkspace } from "@/features/workspaces/hooks/use-workspace";
import { useWorkspaceRPApplications } from "@/features/workspaces/hooks/use-workspace-rp-applications";
import type { RPApplicationSummaryRead } from "@/fetch/rp-applications";

const useSearchMock = vi.fn((): { deleted?: "1" } => ({}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"workspaces.applicationDeletedSuccess": "Application deleted successfully",
				"workspaces.applicationsCreateAction": "Create RP application",
				"workspaces.applicationsListSummary": "Review RP applications.",
				"workspaces.applicationsSectionTitle": "RP applications",
			};
			if (key === "workspaces.applicationsListTitle") {
				return `RP applications - ${String(options?.["name"] ?? "")}`;
			}
			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useParams: () => ({ workspaceUuid: "workspace-uuid-1" }),
	useSearch: () => useSearchMock(),
}));

vi.mock("@/hooks", () => ({
	useSession: () => ({
		currentUser: {
			authorizationContext: {
				globalRole: null,
				partnerAccess: [
					{ role: "rp_admin", workspaceUuid: "workspace-uuid-1" },
				],
			},
		},
	}),
}));

vi.mock("@/components/ui", () => ({
	Button: ({ children, href }: PropsWithChildren<{ href?: string }>): ReactElement => (
		<a href={href}>{children}</a>
	),
	Heading: ({ children }: PropsWithChildren): ReactElement => <h1>{children}</h1>,
	Notice: ({
		children,
		noticeTitle,
	}: PropsWithChildren<{ noticeTitle: string }>): ReactElement => (
		<section>
			<h2>{noticeTitle}</h2>
			{children}
		</section>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/features/rp-applications/components/RPApplicationSummaryCard", () => ({
	RPApplicationSummaryCard: ({
		application,
	}: {
		application: RPApplicationSummaryRead;
	}): ReactElement => (
		<a href={`/workspaces/${application.workspaceUuid}/applications/${application.uuid}`}>
			{application.serviceNameEn}
		</a>
	),
}));

vi.mock("@/features/workspaces/hooks/use-workspace", () => ({
	useWorkspace: vi.fn(),
}));

vi.mock("@/features/workspaces/hooks/use-workspace-rp-applications", () => ({
	useWorkspaceRPApplications: vi.fn(),
}));

const workspace = {
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
};

const application: RPApplicationSummaryRead = {
	canadaLoginEnvironment: "staging",
	onboardingState: "under_review",
	promotionStatus: null,
	registrationLastCompletedStep: "endpoints",
	resumeTaskPath: null,
	role: "rp_admin",
	serviceNameEn: "Benefits Portal",
	serviceNameFr: "Portail des prestations",
	uuid: "rp-application-uuid-1",
	workspaceName: "Benefits Workspace",
	workspaceUuid: "workspace-uuid-1",
};

const arrange = (applications: Array<RPApplicationSummaryRead> = []): void => {
	vi.mocked(useWorkspace).mockReturnValue({
		error: null,
		isLoading: false,
		refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
		workspace,
	});
	vi.mocked(useWorkspaceRPApplications).mockReturnValue({
		applications,
		error: null,
		isLoading: false,
		refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
	});
};

describe("WorkspaceApplicationsListPage", () => {
	it("shows a delete success notice after a canonical list redirect", () => {
		useSearchMock.mockReturnValue({ deleted: "1" });
		arrange();

		render(<WorkspaceApplicationsListPage />);

		expect(
			screen.getByRole("heading", { name: /application deleted successfully/i })
		).toBeTruthy();
	});

	it("renders the shared application summary with its canonical workspace link", () => {
		useSearchMock.mockReturnValue({});
		arrange([application]);

		render(<WorkspaceApplicationsListPage />);

		expect(
			screen.getByRole("heading", {
				name: /rp applications - benefits workspace/i,
			})
		).toBeTruthy();
		expect(
			screen.getByRole("link", { name: "Benefits Portal" }).getAttribute("href")
		).toBe(
			"/workspaces/workspace-uuid-1/applications/rp-application-uuid-1"
		);
		expect(
			screen
				.getByRole("link", { name: /create rp application/i })
				.getAttribute("href")
		).toBe("/workspaces/workspace-uuid-1/applications/new");
	});
});
