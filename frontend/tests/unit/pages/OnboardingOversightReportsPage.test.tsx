import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BadRequestError } from "@/fetch/errors";
import { useOnboardingOversightReport } from "@/features/onboarding-oversight/hooks/use-onboarding-oversight-report";
import { OnboardingOversightReportsPage } from "@/features/onboarding-oversight/pages/OnboardingOversightReportsPage";

const navigateMock = vi.fn();
const useSearchMock = vi.fn(() => ({
	endDate: "2026-08-31",
	groupBy: "week",
	metric: "onboarding_throughput",
	startDate: "2026-08-01",
}));

vi.mock("react-i18next", () => ({
	useTranslation: (): {
		t: (key: string, options?: Record<string, unknown>) => string;
	} => ({
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"onboardingOversight.reports.acceptedColumn": "Invitations accepted",
				"onboardingOversight.reports.accessNoticeBody": "Aggregate-only onboarding reporting.",
				"onboardingOversight.reports.accessNoticeTitle": "Reporting stays aggregate-only",
				"onboardingOversight.reports.applyAction": "Apply report filters",
				"onboardingOversight.reports.approvedColumn": "Approved",
				"onboardingOversight.reports.bucketColumn": "Period",
				"onboardingOversight.reports.compliantApplicationsColumn": "Compliant applications",
				"onboardingOversight.reports.conversionRateColumn": "Conversion rate",
				"onboardingOversight.reports.emptyBody": "No report rows were returned.",
				"onboardingOversight.reports.emptyTitle": "No report data",
				"onboardingOversight.reports.errorBody": "The report could not be loaded.",
				"onboardingOversight.reports.errorTitle": "Unable to load the report",
				"onboardingOversight.reports.exportAction": "Export CSV",
				"onboardingOversight.reports.filtersEndDateLabel": "End date",
				"onboardingOversight.reports.filtersGroupByLabel": "Group by",
				"onboardingOversight.reports.filtersMetricLabel": "Metric",
				"onboardingOversight.reports.filtersStartDateLabel": "Start date",
				"onboardingOversight.reports.filtersTitle": "Filter aggregate reports",
				"onboardingOversight.reports.groupByDay": "Day",
				"onboardingOversight.reports.groupByMonth": "Month",
				"onboardingOversight.reports.groupByWeek": "Week",
				"onboardingOversight.reports.hygieneRateColumn": "Hygiene rate",
				"onboardingOversight.reports.launchedColumn": "Launched",
				"onboardingOversight.reports.loadingBody": "Loading reporting aggregates.",
				"onboardingOversight.reports.loadingTitle": "Loading the reports",
				"onboardingOversight.reports.metricInvitationConversion": "Invitation conversion",
				"onboardingOversight.reports.metricOnboardingThroughput": "Onboarding throughput",
				"onboardingOversight.reports.metricSecretRotationHygiene": "Secret rotation hygiene",
				"onboardingOversight.reports.nonCompliantApplicationsColumn": "Non-compliant applications",
				"onboardingOversight.reports.pageTitle": "Onboarding reports",
				"onboardingOversight.reports.policyWindowBody": `Recent rotation is measured over ${String(options?.["days"] ?? "0")} days.`,
				"onboardingOversight.reports.policyWindowTitle": "Rotation window",
				"onboardingOversight.reports.resultsPeriod": `${String(options?.["startDate"] ?? "")} to ${String(options?.["endDate"] ?? "")}`,
				"onboardingOversight.reports.resultsTitle": `${String(options?.["metric"] ?? "")} results`,
				"onboardingOversight.reports.sentColumn": "Invitations sent",
				"onboardingOversight.reports.submittedColumn": "Submitted",
				"onboardingOversight.reports.summary": "Review onboarding throughput, invitation conversion, and secret hygiene from one reporting route.",
				"onboardingOversight.reports.tableTitle": "Aggregate onboarding report",
				"onboardingOversight.reports.totalApplicationsColumn": "Total applications",
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
		children,
		href,
		type,
	}: PropsWithChildren<{ href?: string; type: "link" | "submit" }>): ReactElement =>
		type === "link" ? <a href={href}>{children}</a> : <button type="submit">{children}</button>,
	DataTable: ({
		columns,
		rows,
		title,
	}: {
		columns: Array<{ headerName: string }>;
		rows: Array<{ bucketLabel: string }>;
		title: string;
	}): ReactElement => (
		<section>
			<h2>{title}</h2>
			{columns.map((column) => (
				<span key={column.headerName}>{column.headerName}</span>
			))}
			{rows.map((row) => (
				<div key={row.bucketLabel}>{row.bucketLabel}</div>
			))}
		</section>
	),
	DateInput: ({
		legend,
		onInput,
		value,
	}: {
		legend: string;
		onInput?: (event: { target: HTMLInputElement }) => void;
		value: string;
	}): ReactElement => (
		<label>
			<span>{legend}</span>
			<input
				value={value}
				onInput={(event): void => {
					onInput?.({ target: event.target as HTMLInputElement });
				}}
			/>
		</label>
	),
	Grid: ({ children }: PropsWithChildren): ReactElement => <div>{children}</div>,
	Heading: ({ children, tag }: PropsWithChildren<{ tag?: string }>): ReactElement =>
		tag === "h2" ? <h2>{children}</h2> : <h1>{children}</h1>,
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
		value,
	}: PropsWithChildren<{
		label: string;
		onInput?: (event: { target: HTMLSelectElement }) => void;
		value: string;
	}>): ReactElement => (
		<label>
			<span>{label}</span>
			<select
				value={value}
				onInput={(event): void => {
					onInput?.({ target: event.target as HTMLSelectElement });
				}}
			>
				{children}
			</select>
		</label>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock(
	"@/features/onboarding-oversight/hooks/use-onboarding-oversight-report",
	() => ({
		useOnboardingOversightReport: vi.fn(),
	})
);

describe("OnboardingOversightReportsPage", () => {
	it("submits report filters and renders KPI results with an export link", () => {
		useSearchMock.mockReturnValue({
			endDate: "2026-08-31",
			groupBy: "week",
			metric: "onboarding_throughput",
			startDate: "2026-08-01",
		});
		vi.mocked(useOnboardingOversightReport).mockReturnValue({
			error: null,
			isLoading: false,
			isRefetching: false,
			report: {
				appliedFilters: {
					endDate: "2026-08-31",
					groupBy: "week",
					metric: "onboarding_throughput",
					startDate: "2026-08-01",
				},
				exportAvailable: true,
				generatedAt: "2026-08-31T12:00:00Z",
				metric: "onboarding_throughput",
				rows: [
					{
						approvedCount: 1,
						bucketEnd: "2026-08-31",
						bucketLabel: "2026-08-25 to 2026-08-31",
						bucketStart: "2026-08-25",
						launchedCount: 1,
						submittedCount: 3,
					},
				],
				summary: {
					approvedCount: 1,
					launchedCount: 1,
					submittedCount: 3,
				},
				title: "Onboarding throughput",
			},
		});

		render(<OnboardingOversightReportsPage />);

		fireEvent.input(screen.getByLabelText(/metric/i), {
			target: { value: "invitation_conversion" },
		});
		fireEvent.input(screen.getByLabelText(/start date/i), {
			target: { value: "2026-08-10" },
		});
		fireEvent.input(screen.getByLabelText(/end date/i), {
			target: { value: "2026-08-20" },
		});
		fireEvent.input(screen.getByLabelText(/group by/i), {
			target: { value: "day" },
		});
		fireEvent.click(
			screen.getByRole("button", { name: /apply report filters/i })
		);

		expect(navigateMock).toHaveBeenCalledWith({
			search: {
				endDate: "2026-08-20",
				groupBy: "day",
				metric: "invitation_conversion",
				startDate: "2026-08-10",
			},
			to: "/onboarding-oversight/reports",
		});

		expect(screen.getByText(/2026-08-25 to 2026-08-31/i)).toBeTruthy();
		expect(
			(screen.getByRole("link", { name: /export csv/i }) as HTMLAnchorElement).getAttribute(
				"href"
			)
		).toContain(
			"/api/v1/onboarding-oversight/reports/export?metric=onboarding_throughput"
		);
	});

	it("keeps the last successful report visible when a later request fails", () => {
		useSearchMock.mockReturnValue({
			endDate: "2026-08-31",
			groupBy: "week",
			metric: "onboarding_throughput",
			startDate: "2026-08-01",
		});
		vi.mocked(useOnboardingOversightReport).mockReturnValue({
			error: null,
			isLoading: false,
			isRefetching: false,
			report: {
				appliedFilters: {
					endDate: "2026-08-31",
					groupBy: "week",
					metric: "onboarding_throughput",
					startDate: "2026-08-01",
				},
				exportAvailable: true,
				generatedAt: "2026-08-31T12:00:00Z",
				metric: "onboarding_throughput",
				rows: [
					{
						approvedCount: 1,
						bucketEnd: "2026-08-31",
						bucketLabel: "2026-08-25 to 2026-08-31",
						bucketStart: "2026-08-25",
						launchedCount: 1,
						submittedCount: 3,
					},
				],
				summary: {
					approvedCount: 1,
					launchedCount: 1,
					submittedCount: 3,
				},
				title: "Onboarding throughput",
			},
		});

		const { rerender } = render(<OnboardingOversightReportsPage />);

		useSearchMock.mockReturnValue({
			endDate: "2026-08-01",
			groupBy: "week",
			metric: "onboarding_throughput",
			startDate: "2026-08-31",
		});
		vi.mocked(useOnboardingOversightReport).mockReturnValue({
			error: new BadRequestError({
				code: "onboarding_report_invalid_date_range",
				detail: "Start date must be on or before end date.",
			}),
			isLoading: false,
			isRefetching: false,
			report: null,
		});

		rerender(<OnboardingOversightReportsPage />);

		expect(
			screen.getByText(/start date must be on or before end date/i)
		).toBeTruthy();
		expect(screen.getByText(/2026-08-25 to 2026-08-31/i)).toBeTruthy();
	});
});