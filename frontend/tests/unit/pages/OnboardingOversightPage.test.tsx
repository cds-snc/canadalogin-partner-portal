import type { PropsWithChildren, ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useOnboardingOversightQueue } from "@/features/onboarding-oversight/hooks/use-onboarding-oversight-queue";
import { OnboardingOversightPage } from "@/features/onboarding-oversight/pages/OnboardingOversightPage";

vi.mock("react-i18next", () => ({
	useTranslation: (): {
		i18n: { resolvedLanguage: string };
		t: (key: string, options?: Record<string, unknown>) => string;
	} => ({
		i18n: { resolvedLanguage: "en" },
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"onboardingOversight.overview.accessNoticeBody":
					"Metadata-only overview body",
				"onboardingOversight.overview.accessNoticeTitle":
					"Oversight access is metadata-only",
				"onboardingOversight.overview.emptyBody":
					"No onboarding work is currently waiting for oversight review.",
				"onboardingOversight.overview.emptyTitle": "No oversight work",
				"onboardingOversight.overview.errorBody":
					"The onboarding oversight overview could not be loaded for this session.",
				"onboardingOversight.overview.errorTitle":
					"Unable to load the oversight overview",
				"onboardingOversight.overview.loadingBody":
					"Loading onboarding oversight signals across workspaces.",
				"onboardingOversight.overview.loadingTitle":
					"Loading the oversight overview",
				"onboardingOversight.overview.openFilteredQueueAction":
					"Open filtered queue",
				"onboardingOversight.overview.openQueueAction": "Open queue",
				"onboardingOversight.overview.pageTitle": "Onboarding oversight",
				"onboardingOversight.overview.recentActivityBody":
					"Review the most recently updated onboarding records.",
				"onboardingOversight.overview.recentActivityTitle": "Recent activity",
				"onboardingOversight.overview.summary":
					"Review the current onboarding workload before opening the full queue.",
				"onboardingOversight.overview.workspaceCoverageBody": `Backlog currently spans ${String(options?.["count"] ?? "0")} workspaces.`,
				"onboardingOversight.overview.workspaceCoverageTitle": `Workspaces in backlog: ${String(options?.["count"] ?? "0")}`,
				"onboardingOversight.overview.submittedBody": `There are ${String(options?.["count"] ?? "0")} submitted records waiting for first review.`,
				"onboardingOversight.overview.submittedTitle": `Submitted records: ${String(options?.["count"] ?? "0")}`,
				"onboardingOversight.overview.underReviewBody": `There are ${String(options?.["count"] ?? "0")} records already under review.`,
				"onboardingOversight.overview.underReviewTitle": `Under review: ${String(options?.["count"] ?? "0")}`,
				"onboardingOversight.overview.productionProgressionBody": `There are ${String(options?.["count"] ?? "0")} production progression requests being tracked.`,
				"onboardingOversight.overview.productionProgressionTitle": `Production progression: ${String(options?.["count"] ?? "0")}`,
				"onboardingOversight.overview.recentActivityRow": `${String(options?.["workspace"] ?? "")} - ${String(options?.["onboardingState"] ?? "")} - ${String(options?.["lastActivityAt"] ?? "")}`,
				"workspaces.onboardingStateSubmitted": "Submitted",
				"workspaces.onboardingStateUnderReview": "Under review",
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		href,
	}: PropsWithChildren<{ href?: string }>): ReactElement => (
		<a href={href}>{children}</a>
	),
	Grid: ({ children }: PropsWithChildren): ReactElement => (
		<div>{children}</div>
	),
	Heading: ({
		children,
		tag,
	}: PropsWithChildren<{ tag?: string }>): ReactElement =>
		tag === "h2" ? <h2>{children}</h2> : <h1>{children}</h1>,
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

vi.mock(
	"@/features/onboarding-oversight/hooks/use-onboarding-oversight-queue",
	() => ({
		useOnboardingOversightQueue: vi.fn(),
	})
);

describe("OnboardingOversightPage", () => {
	it("renders the empty state when no oversight rows exist", () => {
		vi.mocked(useOnboardingOversightQueue).mockReturnValue({
			error: null,
			isLoading: false,
			isRefetching: false,
			queueRows: [],
		});

		render(<OnboardingOversightPage />);

		expect(
			screen.getByRole("heading", { name: /no oversight work/i })
		).toBeTruthy();
	});

	it("renders derived summary cards and recent activity links", () => {
		vi.mocked(useOnboardingOversightQueue).mockReturnValue({
			error: null,
			isLoading: false,
			isRefetching: false,
			queueRows: [
				{
					currentEnvironment: null,
					departmentName: "Employment",
					departmentUuid: "department-uuid-1",
					detailPath: "/workspaces/workspace-uuid-1",
					externalReviewReference: null,
					lastActivityAt: "2026-08-11T10:00:00Z",
					onboardingState: "submitted",
					primaryRecordLabel: "Benefits Workspace",
					promotionStatus: null,
					recordType: "workspace",
					recordUuid: "workspace-row-1",
					targetEnvironment: null,
					workspaceName: "Benefits Workspace",
					workspaceUuid: "workspace-uuid-1",
				},
				{
					currentEnvironment: "production",
					departmentName: "Employment",
					departmentUuid: "department-uuid-1",
					detailPath:
						"/workspaces/workspace-uuid-1/applications/rp-application-uuid-1",
					externalReviewReference: "EXT-123",
					lastActivityAt: "2026-08-12T12:00:00Z",
					onboardingState: "under_review",
					primaryRecordLabel: "Benefits Portal",
					promotionStatus: "review_tracked",
					recordType: "production_progression",
					recordUuid: "rp-row-1",
					targetEnvironment: "production",
					workspaceName: "Benefits Workspace",
					workspaceUuid: "workspace-uuid-1",
				},
			],
		});

		render(<OnboardingOversightPage />);

		expect(screen.getByText(/submitted records: 1/i)).toBeTruthy();
		expect(screen.getByText(/under review: 1/i)).toBeTruthy();
		expect(screen.getByText(/production progression: 1/i)).toBeTruthy();
		expect(
			screen
				.getByRole("link", { name: /benefits portal/i })
				.getAttribute("href")
		).toBe("/workspaces/workspace-uuid-1/applications/rp-application-uuid-1");
	});

	it("renders the load failure notice", () => {
		vi.mocked(useOnboardingOversightQueue).mockReturnValue({
			error: new Error("boom"),
			isLoading: false,
			isRefetching: false,
			queueRows: [],
		});

		render(<OnboardingOversightPage />);

		expect(
			screen.getByRole("heading", {
				name: /unable to load the oversight overview/i,
			})
		).toBeTruthy();
	});
});
