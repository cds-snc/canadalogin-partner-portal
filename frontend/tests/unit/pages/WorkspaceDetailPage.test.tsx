import type { PropsWithChildren, ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceDetailPage } from "@/features/workspaces/pages/WorkspaceDetailPage";
import { useWorkspace } from "@/features/workspaces/hooks/use-workspace";

vi.mock("react-i18next", () => ({
	useTranslation: (): {
		t: (key: string, options?: Record<string, unknown>) => string;
	} => ({
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"authorization.activeWorkspaceNameContext": `Active role: ${String(options?.["role"] ?? "")} for ${String(options?.["workspaceName"] ?? "")}.`,
				"authorization.roles.rpAdmin": "RP Admin",
				"common.notAvailable": "Not available",
				"nav.workspaces": "Workspaces",
				"workspaces.createdSuccess": "Workspace created successfully",
				"workspaces.chooseAnother": "Choose another workspace",
				"workspaces.descriptionLabel": "Description",
				"workspaces.detailSummary": "Choose a task for this workspace.",
				"workspaces.navigation.access": "Access",
				"workspaces.navigation.applications": "Applications",
				"workspaces.navigation.reports": "Reports",
				"workspaces.navigation.settings": "Settings",
				"workspaces.noDescriptionText": "Not provided",
				"workspaces.onboardingStateLabel": "Onboarding status",
				"workspaces.onboardingStateSubmitted": "Submitted",
				"workspaces.statusTitle": "Workspace status",
				"workspaces.taskGroups.access": "Access",
				"workspaces.taskGroups.insights": "Insights",
				"workspaces.taskGroups.setupAndApplications": "Setup and applications",
				"workspaces.taskGroups.workspaceManagement": "Workspace management",
				"workspaces.taskDescriptions.access":
					"Manage workspace role assignments and invitations.",
				"workspaces.taskDescriptions.applications":
					"Manage Applications and their RP configurations.",
				"workspaces.taskDescriptions.reports":
					"Review aggregate workspace reports.",
				"workspaces.taskDescriptions.settings": "Update workspace settings.",
				"workspaces.tasksTitle": "Workspace tasks",
				"workspaces.workspaceLabel": "Workspace",
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useParams: (): { workspaceUuid: string } => ({
		workspaceUuid: "workspace-uuid-1",
	}),
	useSearch: (): { created?: "1"; updated?: "1" } => ({ created: "1" }),
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
	Card: ({
		cardTitle,
		description,
		href,
	}: {
		cardTitle: string;
		description: string;
		href: string;
	}): ReactElement => (
		<article>
			<h3>
				<a href={href}>{cardTitle}</a>
			</h3>
			<p>{description}</p>
		</article>
	),
	Grid: ({ children }: PropsWithChildren): ReactElement => (
		<div>{children}</div>
	),
	Heading: ({
		children,
		tag,
	}: PropsWithChildren<{ tag?: string }>): ReactElement =>
		tag === "h2" ? (
			<h2>{children}</h2>
		) : tag === "h3" ? (
			<h3>{children}</h3>
		) : (
			<h1>{children}</h1>
		),
	Link: ({
		children,
		href,
	}: PropsWithChildren<{ href: string }>): ReactElement => (
		<a href={href}>{children}</a>
	),
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

vi.mock("@/features/workspaces/hooks/use-workspace", () => ({
	useWorkspace: vi.fn(),
}));

describe("WorkspaceDetailPage", () => {
	it("renders a task-oriented hub for the selected workspace", () => {
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
				onboardingState: "submitted",
				submittedAt: "2026-08-11T12:00:00Z",
				slug: "benefits-workspace",
				approvedAt: null,
				launchedAt: null,
				underReviewAt: null,
				updatedAt: null,
				uuid: "workspace-uuid-1",
			},
		});

		render(<WorkspaceDetailPage />);

		expect(
			screen.getByRole("heading", { name: /workspace created successfully/i })
		).toBeTruthy();
		expect(
			screen.getByRole("heading", { name: "Benefits Workspace" })
		).toBeTruthy();
		expect(
			screen.queryByText(/active role: rp admin for benefits workspace/i)
		).toBeNull();
		expect(screen.getByText(/onboarding status: submitted/i)).toBeTruthy();
		for (const groupName of [
			"Setup and applications",
			"Access",
			"Insights",
			"Workspace management",
		]) {
			expect(
				screen.getByRole("heading", { name: groupName, level: 2 })
			).toBeTruthy();
		}
		const expectedTasks = [
			["Applications", "applications"],
			["Access", "access"],
			["Reports", "reports"],
			["Settings", "settings"],
		];
		for (const [name, suffix] of expectedTasks) {
			expect(screen.getByRole("link", { name }).getAttribute("href")).toBe(
				`/workspaces/workspace-uuid-1/${suffix}`
			);
		}
		expect(
			screen
				.getByRole("link", { name: "Choose another workspace" })
				.getAttribute("href")
		).toBe("/workspaces");
		expect(document.body.textContent).not.toContain("workspace-uuid-1");
	});
});
