import type { PropsWithChildren, ReactElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useParams } from "@tanstack/react-router";
import { MAUReportPage } from "@/features/mau-reports/pages/MAUReportPage";
import { HttpRequestError } from "@/fetch/errors";

const { mockUseQuery } = vi.hoisted(() => ({
	mockUseQuery: vi.fn(),
}));

const mockMAUDailyTrendLineChart = vi.fn();

vi.mock("@tanstack/react-router", () => ({
	useParams: vi.fn(),
}));

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string, options?: Record<string, unknown>) => string } => ({
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"mauReport.pageTitle": `${options?.["applicationName"] ?? ""} — Usage Report`,
				"mauReport.title": "MAU report",
				"mauReport.departmentLabel": `Department: ${options?.["department"] ?? ""}`,
				"mauReport.loadingTitle": "Loading MAU report",
				"mauReport.loadingBody": "Loading MAU data for this RP application.",
				"mauReport.errorTitle": "Unable to load MAU report",
				"mauReport.errorBody": "The MAU report could not be loaded for this RP application.",
				"mauReport.sectionTitle": `On: ${options?.["date"] ?? ""}`,
				"mauReport.emptyTitle": "No MAU data",
				"mauReport.emptyBody": "No MAU records were returned for the selected date range.",
				"mauReport.metrics.totalLogin": "Total login",
				"mauReport.metrics.uniqueUser": "Unique user",
				"mauReport.metrics.successLogin": "Success login",
				"mauReport.metrics.failedLogin": "Failed login",
				"mauReport.metrics.mtdUniqueUser": "MTD unique user",
				"mauReport.filters.startDate": "Start date",
				"mauReport.filters.endDate": "End date",
				"mauReport.filters.apply": "Apply date range",
				"mauReport.trendChartTitle": "Daily sign-in trend",
				"mauReport.trendChartBody": "Daily sign-in attempts, unique users, and success rate.",
				"mauReport.dailyListTitle": "Daily MAU metrics",
				"mauReport.exportCsv": "Export to CSV",
				"mauReport.table.date": "Date",
				"mauReport.table.totalLogin": "Total login",
				"mauReport.table.uniqueUser": "Unique user",
				"mauReport.table.successLogin": "Success login",
				"mauReport.table.failedLogin": "Failed login",
				"mauReport.table.mtdUniqueUser": "MTD unique user",
				"mauReport.table.successRate": "Success rate",
				"nav.home": "Home",
				"nav.dashboard": "Dashboard",
				"workspaces.backToApplication": "Back to Application",
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-query", async () => {
	const actual = await vi.importActual("@tanstack/react-query");

	return {
		...actual,
		useQuery: mockUseQuery,
	};
});

vi.mock("@/components/layout", () => ({
	Breadcrumbs: (): ReactElement => <nav>Breadcrumbs</nav>,
	CenteredPageLayout: ({ children }: PropsWithChildren): ReactElement => (
		<div>{children}</div>
	),
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		href,
		onGcdsClick,
		type,
	}: PropsWithChildren<{
		href?: string;
		onGcdsClick?: () => void;
		type?: string;
	}>): ReactElement => {
		if (type === "link" && href) {
			return <a href={href}>{children}</a>;
		}

		return (
			<button type="button" onClick={onGcdsClick}>
				{children}
			</button>
		);
	},
	Card: ({
		cardTitle,
		cardTitleTag,
		children,
	}: PropsWithChildren<{
		cardTitle?: string;
		cardTitleTag?: string;
		href?: string;
	}>): ReactElement => (
		<section>
			{cardTitleTag === "h3" ? <h3>{cardTitle}</h3> : <h2>{cardTitle}</h2>}
			{children}
		</section>
	),
	DataTable: ({
		columns,
		rows,
	}: PropsWithChildren<{
		columns: Array<{ field: string; headerName: string }>;
		rows: Array<{ date: string }>;
	}>): ReactElement => (
		<table>
			<thead>
				<tr>
					{columns.map((col, idx) => (
						<th key={idx}>{col.headerName}</th>
					))}
				</tr>
			</thead>
			<tbody>
				{rows.map((row, idx) => (
					<tr key={idx}>{columns.map((_col, i) => <td key={i}>{row.date}</td>)}</tr>
				))}
			</tbody>
		</table>
	),
	DateInput: ({ legend }: PropsWithChildren<{ legend?: string; name?: string }>): ReactElement => (
		<div>{legend}</div>
	),
	Heading: ({ children, tag }: PropsWithChildren<{ tag?: string }>): ReactElement => {
		if (tag === "h2") {
			return <h2>{children}</h2>;
		}

		if (tag === "h3") {
			return <h3>{children}</h3>;
		}

		return <h1>{children}</h1>;
	},
	Notice: ({
		children,
		noticeTitle,
	}: PropsWithChildren<{ noticeTitle?: string }>): ReactElement => (
		<section>
			<h2>{noticeTitle ?? ""}</h2>
			{children}
		</section>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/components/charts/line/MAUDailyTrendLineChart", () => ({
	MAUDailyTrendLineChart: (props: { points: Array<{ date: string }> }): ReactElement => {
		mockMAUDailyTrendLineChart(props);
		return <div>MAU Chart</div>;
	},
}));

const mockedUseParams = vi.mocked(useParams);

describe("MAUReportPage", () => {
	beforeEach(() => {
		mockedUseParams.mockReturnValue({
			rpApplicationUuid: "application-uuid-1",
		});
		mockUseQuery.mockReset();
		mockMAUDailyTrendLineChart.mockReset();
	});

	it("shows loading state", () => {
		mockUseQuery.mockReturnValue({
			data: null,
			error: null,
			isLoading: true,
			isRefetching: false,
		});

		render(<MAUReportPage />);

		expect(screen.getByText("Loading MAU report")).toBeTruthy();
		expect(screen.getByText("Loading MAU data for this RP application.")).toBeTruthy();
	});

	it("shows error notice on fetch failure", () => {
		mockUseQuery.mockReturnValue({
			data: null,
			error: new Error("network"),
			isLoading: false,
			isRefetching: false,
		});

		render(<MAUReportPage />);

		expect(screen.getByText("Unable to load MAU report")).toBeTruthy();
	});

	it("shows empty state when no records returned", () => {
		mockUseQuery.mockReturnValue({
			data: {
				application_name: "Test App",
				start_date: "2026-01-01",
				end_date: "2026-01-31",
				records: [],
			},
			error: null,
			isLoading: false,
			isRefetching: false,
		});

		render(<MAUReportPage />);

		expect(screen.getByText("No MAU data")).toBeTruthy();
	});

	it("renders page title with application name", () => {
		mockUseQuery.mockReturnValue({
			data: {
				application_name: "Benefits Portal",
				start_date: "2026-01-01",
				end_date: "2026-01-31",
				records: [
					{
						date: "2026-01-15",
						total_logins: 100,
						unique_users: 50,
						successful_logins: 80,
						failed_logins: 20,
						mtd_unique_users: 200,
					},
				],
			},
			error: null,
			isLoading: false,
			isRefetching: false,
		});

		render(<MAUReportPage />);

		expect(
			screen.getByRole("heading", { level: 1 }).textContent
		).toBe("Benefits Portal — Usage Report");
	});

	it("shows department name when present", () => {
		mockUseQuery.mockReturnValue({
			data: {
				application_name: "Test App",
				department_name: "Health Canada",
				start_date: "2026-01-01",
				end_date: "2026-01-31",
				records: [
					{
						date: "2026-01-15",
						total_logins: 100,
						unique_users: 50,
						successful_logins: 80,
						failed_logins: 20,
						mtd_unique_users: 200,
					},
				],
			},
			error: null,
			isLoading: false,
			isRefetching: false,
		});

		render(<MAUReportPage />);

		expect(screen.getByText("Department: Health Canada")).toBeTruthy();
	});

	it("does not show department when absent", () => {
		mockUseQuery.mockReturnValue({
			data: {
				application_name: "Test App",
				start_date: "2026-01-01",
				end_date: "2026-01-31",
				records: [
					{
						date: "2026-01-15",
						total_logins: 100,
						unique_users: 50,
						successful_logins: 80,
						failed_logins: 20,
						mtd_unique_users: 200,
					},
				],
			},
			error: null,
			isLoading: false,
			isRefetching: false,
		});

		render(<MAUReportPage />);

		expect(screen.queryByText(/^Department:/)).toBeNull();
	});

	it("renders KPI cards above the date filter with section title", () => {
		mockUseQuery.mockReturnValue({
			data: {
				application_name: "Test App",
				start_date: "2026-01-01",
				end_date: "2026-01-31",
				records: [
					{
						date: "2026-01-15",
						total_logins: 100,
						unique_users: 50,
						successful_logins: 80,
						failed_logins: 20,
						mtd_unique_users: 200,
					},
				],
			},
			error: null,
			isLoading: false,
			isRefetching: false,
		});

		render(<MAUReportPage />);

		const sectionTitle = screen.getByRole("heading", { level: 2, name: /^On:/ });
		expect(sectionTitle).toBeTruthy();
		expect(sectionTitle.textContent).toMatch(/^On: 2026-01-1[45]$/);

		expect(screen.getByRole("heading", { level: 3, name: "Total login" })).toBeTruthy();
		expect(screen.getByRole("heading", { level: 3, name: "Unique user" })).toBeTruthy();
		expect(screen.getByRole("heading", { level: 3, name: "Success login" })).toBeTruthy();
		expect(screen.getByRole("heading", { level: 3, name: "Failed login" })).toBeTruthy();
		expect(screen.getByRole("heading", { level: 3, name: "MTD unique user" })).toBeTruthy();
	});

	it("renders trend chart and data table sections", () => {
		mockUseQuery.mockReturnValue({
			data: {
				application_name: "Test App",
				start_date: "2026-01-01",
				end_date: "2026-01-31",
				records: [
					{
						date: "2026-01-17",
						total_logins: 90,
						unique_users: 45,
						successful_logins: 70,
						failed_logins: 20,
						mtd_unique_users: 210,
					},
					{
						date: "2026-01-15",
						total_logins: 100,
						unique_users: 50,
						successful_logins: 80,
						failed_logins: 20,
						mtd_unique_users: 200,
					},
				],
			},
			error: null,
			isLoading: false,
			isRefetching: false,
		});

		render(<MAUReportPage />);

		expect(screen.getByText("Daily sign-in trend")).toBeTruthy();
		expect(screen.getByText("MAU Chart")).toBeTruthy();
		expect(screen.getByText("Daily MAU metrics")).toBeTruthy();
		expect(mockMAUDailyTrendLineChart).toHaveBeenCalledTimes(1);
		expect(mockMAUDailyTrendLineChart.mock.calls[0]?.[0]?.points.map((point: { date: string }) => point.date)).toEqual([
			"2026-01-15",
			"2026-01-17",
		]);
	});

	it("shows back to application link", () => {
		mockUseQuery.mockReturnValue({
			data: {
				application_name: "Test App",
				start_date: "2026-01-01",
				end_date: "2026-01-31",
				records: [],
			},
			error: null,
			isLoading: false,
			isRefetching: false,
		});

		render(<MAUReportPage />);

		const backLink = screen.getByRole("link", { name: "Back to Application" });
		expect(backLink).toBeTruthy();
		expect(backLink.getAttribute("href")).toBe(
			"/rp-applications/mine/application-uuid-1"
		);
	});

	it("redirects to department-setup when 409 rp_application_department_required received", async () => {
		const replaceMock = vi.fn();
		const originalLocation = globalThis.location;
		Object.defineProperty(globalThis, "location", {
			configurable: true,
			value: {
				pathname: "/rp-applications/mine/application-uuid-1/mau-report",
				replace: replaceMock,
			} as Pick<Location, "pathname" | "replace">,
		});

		mockUseQuery.mockReturnValue({
			data: null,
			error: new HttpRequestError({
				status: 409,
				code: "rp_application_department_required",
				message: "RP application department assignment is required",
			}),
			isLoading: false,
			isRefetching: false,
		});

		render(<MAUReportPage />);

		await waitFor(() => {
			expect(replaceMock).toHaveBeenCalledWith(
				"/rp-applications/mine/application-uuid-1/department-setup"
			);
		});

		Object.defineProperty(globalThis, "location", {
			configurable: true,
			value: originalLocation,
		});
	});
});
