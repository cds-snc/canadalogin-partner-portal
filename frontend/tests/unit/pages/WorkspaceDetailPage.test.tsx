import type { PropsWithChildren, ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceDetailPage } from "@/features/workspaces/pages/WorkspaceDetailPage";
import { useWorkspace } from "@/features/workspaces/hooks/use-workspace";

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string, options?: Record<string, unknown>) => string } => ({
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"common.notAvailable": "Not available",
				"workspaces.approvedAtLabel": "Approved",
				"nav.workspaces": "Workspaces",
				"workspaces.createdAtLabel": "Created",
				"workspaces.createdSuccess": "Workspace created successfully",
				"workspaces.descriptionLabel": "Description",
				"workspaces.detailSummary": "Review the current workspace metadata.",
				"workspaces.launchedAtLabel": "Launched",
				"workspaces.manageApplications": "Manage RP applications",
				"workspaces.metadataTitle": "Workspace details",
				"workspaces.nameLabel": "Name",
				"workspaces.noDescriptionText": "Not provided",
				"workspaces.onboardingStateLabel": "Onboarding status",
				"workspaces.onboardingStateSubmitted": "Submitted",
				"workspaces.settingsAction": "Workspace settings",
				"workspaces.slugLabel": "Slug",
				"workspaces.submittedAtLabel": "Submitted",
				"workspaces.underReviewAtLabel": "Under review",
				"workspaces.updatedAtLabel": "Last updated",
				"workspaces.workspaceLabel": "Workspace",
			};

			if (key === "workspaces.workspaceTitle") {
				return `Workspace - ${String(options?.["name"] ?? "")}`;
			}

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useParams: (): { workspaceUuid: string } => ({ workspaceUuid: "workspace-uuid-1" }),
	useSearch: (): { created?: "1"; updated?: "1" } => ({ created: "1" }),
}));

vi.mock("@/components/ui", () => ({
	Button: ({ children, href, type }: PropsWithChildren<{ href?: string; type: string }>): ReactElement =>
		type === "link" ? <a href={href}>{children}</a> : <button type="button">{children}</button>,
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

vi.mock("@/features/workspaces/hooks/use-workspace", () => ({
	useWorkspace: vi.fn(),
}));

describe("WorkspaceDetailPage", () => {
	it("renders the success notice and settings link for a loaded workspace", () => {
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

		expect(screen.getByRole("heading", { name: /workspace created successfully/i })).toBeTruthy();
		expect(screen.getByRole("heading", { name: /workspace - benefits workspace/i })).toBeTruthy();
		expect(screen.getByText(/onboarding status: submitted/i)).toBeTruthy();
		expect(
			screen
				.getByRole("link", { name: /workspace settings/i })
				.getAttribute("href")
		).toBe("/workspaces/workspace-uuid-1/settings");
		expect(
			screen
				.getByRole("link", { name: /manage rp applications/i })
				.getAttribute("href")
		).toBe("/workspaces/workspace-uuid-1/applications");
	});
});