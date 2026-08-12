import {
	createElement,
	type PropsWithChildren,
	type ReactElement,
} from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceApplicationDetailPage } from "@/features/workspaces/pages/WorkspaceApplicationDetailPage";
import { useWorkspace } from "@/features/workspaces/hooks/use-workspace";
import { useWorkspaceRPApplications } from "@/features/workspaces/hooks/use-workspace-rp-applications";
import { useSession } from "@/hooks";

const useSearchMock = vi.fn((): { created?: "1"; updated?: "1" } => ({}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"authorization.activeWorkspaceNameContext": `${String(options?.["role"])} — ${String(options?.["workspaceName"])}`,
				"authorization.roles.rpAdmin": "RP Admin",
				"authorization.roles.clAdmin": "Canada Login Admin",
				"common.notAvailable": "Not available",
				"workspaces.applicationsCreatedSuccess":
					"RP application created successfully",
				"workspaces.applicationsSectionTitle": "RP applications",
				"workspaces.environmentStaging": "Staging",
				"workspaces.onboardingStateDraft": "Draft",
				"workspaces.promotionStatusReviewTracked": "Review tracked",
				"workspaces.rpOverviewConfigurationDescription":
					"Review saved registration configuration.",
				"workspaces.rpOverviewConfigurationTitle": "Configuration",
				"workspaces.rpOverviewContext": `Environment: ${String(options?.["environment"])}. Onboarding status: ${String(options?.["status"])}.`,
				"workspaces.rpOverviewCredentialsDescription":
					"Manage client credentials.",
				"workspaces.rpOverviewCredentialsTitle": "Manage credentials",
				"workspaces.rpOverviewNoActionsBody": "No partner tasks are granted.",
				"workspaces.rpOverviewNoActionsTitle": "No partner actions available",
				"workspaces.rpOverviewNotFoundBody":
					"The RP application is unavailable or you no longer have access to it.",
				"workspaces.rpOverviewNotFoundTitle": "RP application unavailable",
				"workspaces.rpOverviewPromotionContext": `Production review: ${String(options?.["status"])}.`,
				"workspaces.rpOverviewSummary": "Choose a focused task.",
				"workspaces.rpOverviewTasksTitle": "Application tasks",
				"workspaces.rpOverviewUsageDescription": "Review usage.",
				"workspaces.rpOverviewUsageTitle": "Usage",
			};
			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useParams: () => ({
		rpApplicationUuid: "rp-application-uuid-1",
		workspaceUuid: "workspace-uuid-1",
	}),
	useSearch: () => useSearchMock(),
}));

vi.mock("@/components/ui", () => ({
	Card: ({
		cardTitle,
		description,
		href,
	}: {
		cardTitle: string;
		description: string;
		href: string;
	}): ReactElement => (
		<a href={href}>
			<span>{cardTitle}</span>
			<span>{description}</span>
		</a>
	),
	Grid: ({ children }: PropsWithChildren): ReactElement => (
		<div>{children}</div>
	),
	Heading: ({
		children,
		tag = "h1",
	}: PropsWithChildren<{ tag?: string }>): ReactElement =>
		createElement(tag, undefined, children),
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

vi.mock("@/hooks", () => ({ useSession: vi.fn() }));
vi.mock("@/features/workspaces/hooks/use-workspace", () => ({
	useWorkspace: vi.fn(),
}));
vi.mock("@/features/workspaces/hooks/use-workspace-rp-applications", () => ({
	useWorkspaceRPApplications: vi.fn(),
}));

const application = {
	canadaLoginEnvironment: "staging",
	onboardingState: "draft",
	promotionStatus: "review_tracked",
	registrationLastCompletedStep: "endpoints" as const,
	resumeTaskPath: "/resume",
	role: "rp_admin" as const,
	serviceNameEn: "Benefits Portal",
	serviceNameFr: "Portail des prestations",
	uuid: "rp-application-uuid-1",
	workspaceName: "Benefits Workspace",
	workspaceUuid: "workspace-uuid-1",
};

describe("WorkspaceApplicationDetailPage", () => {
	beforeEach(() => {
		useSearchMock.mockReturnValue({});
		vi.mocked(useWorkspace).mockReturnValue({
			error: null,
			isLoading: false,
			refetch: vi.fn(async () => null),
			workspace: {
				createdAt: "2026-08-12T12:00:00Z",
				createdBy: 42,
				deletedAt: null,
				description: null,
				departmentId: 7,
				id: 9,
				isDeleted: false,
				name: "Benefits Workspace",
				slug: "benefits-workspace",
				updatedAt: null,
				uuid: "workspace-uuid-1",
			},
		});
		vi.mocked(useWorkspaceRPApplications).mockReturnValue({
			applications: [application],
			error: null,
			isLoading: false,
			refetch: vi.fn(async () => null),
		});
		vi.mocked(useSession).mockReturnValue({
			currentUser: {
				authorizationContext: {
					globalRole: null,
					partnerAccess: [
						{ role: "rp_admin", workspaceUuid: "workspace-uuid-1" },
					],
				},
			},
		} as unknown as ReturnType<typeof useSession>);
	});

	it("renders the RP name and three canonical task cards for an RP admin", () => {
		render(<WorkspaceApplicationDetailPage />);

		expect(
			screen.getByRole("heading", { level: 1, name: "Benefits Portal" })
		).toBeTruthy();
		expect(
			screen.getByText(/Environment: Staging\. Onboarding status: Draft/i)
		).toBeTruthy();
		expect(screen.getByText(/Production review: Review tracked/i)).toBeTruthy();

		const expectedLinks = [
			["Configuration", "configuration"],
			["Usage", "usage"],
			["Manage credentials", "manage-credentials"],
		] as const;
		for (const [name, child] of expectedLinks) {
			expect(
				screen
					.getByRole("link", { name: new RegExp(name, "i") })
					.getAttribute("href")
			).toBe(
				`/workspaces/workspace-uuid-1/applications/rp-application-uuid-1/${child}`
			);
		}
	});

	it("keeps safe metadata visible without partner task cards for a CL admin", () => {
		vi.mocked(useSession).mockReturnValue({
			currentUser: {
				authorizationContext: { globalRole: "cl_admin", partnerAccess: [] },
			},
		} as unknown as ReturnType<typeof useSession>);

		render(<WorkspaceApplicationDetailPage />);

		expect(
			screen.getByRole("heading", { level: 1, name: "Benefits Portal" })
		).toBeTruthy();
		expect(
			screen.getByRole("heading", { name: "No partner actions available" })
		).toBeTruthy();
		expect(
			screen.queryByRole("link", { name: /manage credentials/i })
		).toBeNull();
	});

	it("announces creation while preserving the task hub", () => {
		useSearchMock.mockReturnValue({ created: "1" });
		render(<WorkspaceApplicationDetailPage />);

		expect(
			screen.getByRole("heading", {
				name: "RP application created successfully",
			})
		).toBeTruthy();
		expect(
			screen.getByRole("heading", { name: "Application tasks" })
		).toBeTruthy();
	});

	it("renders a safe unavailable state when the RP is outside the scoped list", () => {
		vi.mocked(useWorkspaceRPApplications).mockReturnValue({
			applications: [],
			error: null,
			isLoading: false,
			refetch: vi.fn(async () => null),
		});

		render(<WorkspaceApplicationDetailPage />);

		expect(
			screen.getByRole("heading", { name: "RP application unavailable" })
		).toBeTruthy();
		expect(
			screen.getByText(
				"The RP application is unavailable or you no longer have access to it."
			)
		).toBeTruthy();
		expect(screen.queryByRole("link")).toBeNull();
	});
});
