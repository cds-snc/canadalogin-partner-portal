import type { ComponentProps, ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AggregateReportsPageContent } from "@/features/onboarding-oversight/pages/OnboardingOversightReportsPage";
import { useWorkspace } from "@/features/workspaces/hooks/use-workspace";
import { WorkspaceReportsPage } from "@/features/workspaces/pages/WorkspaceReportsPage";

const navigateMock = vi.fn();
const aggregateReportsPageContentMock = vi.fn(
	(
		_props: ComponentProps<typeof AggregateReportsPageContent>
	): ReactElement => <div data-testid="aggregate-reports" />
);

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"workspaces.backToHub": `Back to ${String(options?.["name"] ?? "")}`,
				"workspaces.reportsAccessNoticeBody": "Selected scope details",
				"workspaces.reportsAccessNoticeTitle": "Selected workspace scope",
				"workspaces.reportsPageTitle": `Reports — ${String(options?.["name"] ?? "")}`,
				"workspaces.reportsSummary": "Review aggregate reports.",
				"workspaces.workspaceLabel": "Workspace",
			};
			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => navigateMock,
	useParams: () => ({ workspaceUuid: "workspace-uuid-1" }),
	useSearch: () => ({}),
}));

vi.mock(
	"@/features/onboarding-oversight/pages/OnboardingOversightReportsPage",
	() => ({
		AggregateReportsPageContent: (
			props: ComponentProps<typeof AggregateReportsPageContent>
		): ReactElement => aggregateReportsPageContentMock(props),
	})
);

vi.mock("@/features/workspaces/hooks/use-workspace", () => ({
	useWorkspace: vi.fn(),
}));

describe("WorkspaceReportsPage", () => {
	it("uses the named workspace hub as its stable parent destination", () => {
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

		render(<WorkspaceReportsPage />);

		expect(screen.getByTestId("aggregate-reports")).toBeTruthy();
		expect(aggregateReportsPageContentMock).toHaveBeenCalledWith(
			expect.objectContaining({
				pageTitle: "Reports — Benefits Workspace",
				returnHref: "/workspaces/workspace-uuid-1",
				returnLabel: "Back to Benefits Workspace",
				workspaceUuid: "workspace-uuid-1",
			})
		);
	});
});
