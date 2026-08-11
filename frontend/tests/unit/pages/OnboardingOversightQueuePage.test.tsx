import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useOnboardingOversightQueue } from "@/features/onboarding-oversight/hooks/use-onboarding-oversight-queue";
import { OnboardingOversightQueuePage } from "@/features/onboarding-oversight/pages/OnboardingOversightQueuePage";

const navigateMock = vi.fn();
const useSearchMock = vi.fn(() => ({}));

vi.mock("react-i18next", () => ({
	useTranslation: (): {
		i18n: { resolvedLanguage: string };
		t: (key: string) => string;
	} => ({
		i18n: { resolvedLanguage: "en" },
		t: (key: string): string => {
			const translations: Record<string, string> = {
				"onboardingOversight.queue.accessNoticeBody": "Metadata only body",
				"onboardingOversight.queue.accessNoticeTitle": "Oversight access is metadata-only",
				"onboardingOversight.queue.anyOption": "Any",
				"onboardingOversight.queue.applyAction": "Apply filters",
				"onboardingOversight.queue.clearAction": "Clear filters",
				"onboardingOversight.queue.departmentColumn": "Department",
				"onboardingOversight.queue.emptyBody": "No onboarding records are currently waiting in the oversight queue.",
				"onboardingOversight.queue.emptyFilteredBody": "No onboarding records match the current filters.",
				"onboardingOversight.queue.emptyTitle": "No queue records",
				"onboardingOversight.queue.environmentColumn": "Environment",
				"onboardingOversight.queue.errorBody": "The onboarding oversight queue could not be loaded for this session.",
				"onboardingOversight.queue.errorTitle": "Unable to load the oversight queue",
				"onboardingOversight.queue.externalReviewReferenceColumn": "External review reference",
				"onboardingOversight.queue.filtersDepartmentLabel": "Department",
				"onboardingOversight.queue.filtersEnvironmentLabel": "Environment",
				"onboardingOversight.queue.filtersOnboardingStateLabel": "Onboarding status",
				"onboardingOversight.queue.filtersPromotionStatusLabel": "Production review status",
				"onboardingOversight.queue.filtersRecordTypeLabel": "Record type",
				"onboardingOversight.queue.filtersTitle": "Filter the oversight queue",
				"onboardingOversight.queue.filtersWorkspaceLabel": "Workspace",
				"onboardingOversight.queue.lastActivityAtColumn": "Last activity",
				"onboardingOversight.queue.loadingBody": "Loading onboarding oversight records across workspaces.",
				"onboardingOversight.queue.loadingTitle": "Loading the oversight queue",
				"onboardingOversight.queue.notApplicable": "Not applicable",
				"onboardingOversight.queue.onboardingStateColumn": "Onboarding status",
				"onboardingOversight.queue.pageTitle": "Onboarding oversight queue",
				"onboardingOversight.queue.primaryRecordLabelColumn": "Record",
				"onboardingOversight.queue.promotionStatusColumn": "Production review",
				"onboardingOversight.queue.recordTypeApplicationInformation": "Application information",
				"onboardingOversight.queue.recordTypeColumn": "Record type",
				"onboardingOversight.queue.recordTypeProductionProgression": "Production progression",
				"onboardingOversight.queue.recordTypeRpApplication": "RP application",
				"onboardingOversight.queue.recordTypeWorkspace": "Workspace",
				"onboardingOversight.queue.summary": "Review cross-workspace onboarding records.",
				"onboardingOversight.queue.tableTitle": "Onboarding review backlog",
				"onboardingOversight.queue.viewAction": "View record",
				"onboardingOversight.queue.workspaceColumn": "Workspace",
				"workspaces.onboardingStateApproved": "Approved",
				"workspaces.onboardingStateLaunched": "Launched",
				"workspaces.onboardingStateSubmitted": "Submitted",
				"workspaces.onboardingStateUnderReview": "Under review",
				"workspaces.promotionStatusApproved": "Approved",
				"workspaces.promotionStatusChangesRequested": "Changes requested",
				"workspaces.promotionStatusLaunched": "Launched",
				"workspaces.promotionStatusReviewTracked": "Review tracked",
				"yourApplications.environmentProduction": "Production",
				"yourApplications.environmentStaging": "Staging",
				"yourApplications.environmentTest": "Test",
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: (): typeof navigateMock => navigateMock,
	useSearch: (): ReturnType<typeof useSearchMock> => useSearchMock(),
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		buttonRole,
		children,
		href,
		onGcdsClick,
		type,
	}: PropsWithChildren<{
		buttonRole?: string;
		href?: string;
		onGcdsClick?: () => void;
		type: "button" | "link" | "reset" | "submit";
	}>): ReactElement =>
		type === "link" ? (
			<a href={href}>{children}</a>
		) : (
			<button data-button-role={buttonRole} onClick={onGcdsClick} type={type}>
				{children}
			</button>
		),
	DataTable: ({
		action,
		columns,
		rows,
		title,
	}: {
		action: { buttonLabel: string; onAction: (row: { detailPath: string; primaryRecordLabel: string; recordUuid: string; workspaceName: string }) => void };
		columns: Array<{ headerName: string }>;
		rows: Array<{ detailPath: string; primaryRecordLabel: string; recordUuid: string; workspaceName: string }>;
		title: string;
	}): ReactElement => (
		<section>
			<h2>{title}</h2>
			{columns.map((column) => (
				<span key={column.headerName}>{column.headerName}</span>
			))}
			{rows.map((row) => (
				<div key={row.recordUuid}>
					<span>{row.primaryRecordLabel}</span>
					<span>{row.workspaceName}</span>
					<button onClick={() => action.onAction(row)} type="button">
						{action.buttonLabel}
					</button>
				</div>
			))}
		</section>
	),
	Grid: ({ children }: PropsWithChildren): ReactElement => <div>{children}</div>,
	Heading: ({ children, tag }: PropsWithChildren<{ tag?: string }>): ReactElement =>
		tag === "h2" ? <h2>{children}</h2> : <h1>{children}</h1>,
	Input: ({
		inputId,
		label,
		onInput,
		value,
	}: {
		inputId: string;
		label: string;
		onInput?: (event: { nativeEvent: Event }) => void;
		value?: string;
	}): ReactElement => (
		<label htmlFor={inputId}>
			<span>{label}</span>
			<input
				id={inputId}
				value={value}
				onInput={(event): void => {
					onInput?.({ nativeEvent: event.nativeEvent });
				}}
			/>
		</label>
	),
	Notice: ({ children, noticeTitle }: PropsWithChildren<{ noticeTitle: string }>): ReactElement => (
		<section>
			<h2>{noticeTitle}</h2>
			{children}
		</section>
	),
	Select: ({
		children,
		label,
		onInput,
		selectId,
		value,
	}: PropsWithChildren<{
		label: string;
		onInput?: (event: { nativeEvent: Event }) => void;
		selectId: string;
		value?: string;
	}>): ReactElement => (
		<label htmlFor={selectId}>
			<span>{label}</span>
			<select
				id={selectId}
				value={value}
				onInput={(event): void => {
					onInput?.({ nativeEvent: event.nativeEvent });
				}}
			>
				{children}
			</select>
		</label>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock(
	"@/features/onboarding-oversight/hooks/use-onboarding-oversight-queue",
	() => ({
		useOnboardingOversightQueue: vi.fn(),
	})
);

describe("OnboardingOversightQueuePage", () => {
	it("renders a loading state", () => {
		useSearchMock.mockReturnValue({});
		vi.mocked(useOnboardingOversightQueue).mockReturnValue({
			error: null,
			isLoading: true,
			isRefetching: false,
			queueRows: [],
		});

		render(<OnboardingOversightQueuePage />);

		expect(
			screen.getByRole("heading", { name: /loading the oversight queue/i })
		).toBeTruthy();
	});

	it("renders an empty state", () => {
		useSearchMock.mockReturnValue({});
		vi.mocked(useOnboardingOversightQueue).mockReturnValue({
			error: null,
			isLoading: false,
			isRefetching: false,
			queueRows: [],
		});

		render(<OnboardingOversightQueuePage />);

		expect(
			screen.getByRole("heading", { name: /no queue records/i })
		).toBeTruthy();
	});

	it("submits filters and navigates to the selected detail route", () => {
		useSearchMock.mockReturnValue({});
		vi.mocked(useOnboardingOversightQueue).mockReturnValue({
			error: null,
			isLoading: false,
			isRefetching: false,
			queueRows: [
				{
					currentEnvironment: "production",
					departmentName: "Employment and Social Development Canada",
					departmentUuid: "department-uuid-1",
					detailPath:
						"/workspaces/workspace-uuid-1/applications/rp-application-uuid-1",
					externalReviewReference: "CAB-123",
					lastActivityAt: "2026-08-11T12:30:00Z",
					onboardingState: "under_review",
					primaryRecordLabel: "Benefits production registration",
					promotionStatus: "review_tracked",
					recordType: "production_progression",
					recordUuid: "row-uuid-1",
					targetEnvironment: "production",
					workspaceName: "Benefits Workspace",
					workspaceUuid: "workspace-uuid-1",
				},
			],
		});

		render(<OnboardingOversightQueuePage />);

		fireEvent.input(screen.getByLabelText(/workspace/i), {
			target: { value: "Benefits" },
		});
		fireEvent.input(screen.getByLabelText(/^department$/i), {
			target: { value: "Employment" },
		});
		fireEvent.input(screen.getByLabelText(/record type/i), {
			target: { value: "production_progression" },
		});
		fireEvent.input(screen.getByLabelText(/onboarding status/i), {
			target: { value: "under_review" },
		});
		fireEvent.input(screen.getByLabelText(/^environment$/i), {
			target: { value: "production" },
		});
		fireEvent.input(screen.getByLabelText(/production review status/i), {
			target: { value: "review_tracked" },
		});
		fireEvent.click(screen.getByRole("button", { name: /apply filters/i }));

		expect(navigateMock).toHaveBeenCalledWith({
			search: {
				department: "Employment",
				environment: "production",
				onboardingState: "under_review",
				promotionStatus: "review_tracked",
				recordType: "production_progression",
				workspace: "Benefits",
			},
			to: "/onboarding-oversight/queue",
		});

		fireEvent.click(screen.getByRole("button", { name: /view record/i }));

		expect(navigateMock).toHaveBeenLastCalledWith({
			to: "/workspaces/workspace-uuid-1/applications/rp-application-uuid-1",
		});
	});
});