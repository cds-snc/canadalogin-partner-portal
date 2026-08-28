import type { ReactElement, ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RPApplicationSummaryTable } from "@/features/rp-applications/components/RPApplicationSummaryCard";
import type { RPApplicationSummaryRead } from "@/fetch/rp-applications";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		i18n: { language: "en", resolvedLanguage: "en" },
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"common.notProvided": "Not provided",
				"workspaces.rpConfigurationActionColumn": "Action",
				"workspaces.rpConfigurationCanadaLoginEnvironmentColumn":
					"CanadaLogin environment",
				"workspaces.rpConfigurationNameColumn": "Name",
				"workspaces.rpConfigurationOpenAction": "View RP configuration",
				"workspaces.rpConfigurationPartnerEnvironmentColumn":
					"Partner environment",
				"workspaces.productionReviewLabel": "Production review",
				"workspaces.productionReviewNotApplicable": "Not applicable",
				"workspaces.productionReviewReconciliationRequired":
					"Historical review requires reconciliation",
				"workspaces.rpConfigurationRegistrationColumn": "Registration",
				"workspaces.registrationStatusIncomplete": "Incomplete",
				"workspaces.rpConfigurationsItemLabel":
					options?.["count"] === 1 ? "RP configuration" : "RP configurations",
				"yourApplications.environmentTest": "Test",
				"yourApplications.publicReferenceLabel": "Reference",
				"yourApplications.unknownApplication": "Unknown application",
			};
			if (key === "workspaces.rpConfigurationActionNameContext") {
				return `for ${String(options?.["name"] ?? "")}`;
			}
			return translations[key] ?? key;
		},
	}),
}));

type TestColumn = {
	cellRenderer?: (row: Record<string, unknown>) => ReactNode;
	field: string;
	headerName: string;
	rowHeader?: boolean;
};

vi.mock("@/components/ui", () => ({
	DataTable: ({
		action,
		actionHeader,
		columns,
		filter,
		itemLabel,
		pagination,
		rows,
		sort,
		title,
	}: {
		action: {
			buttonLabel: string;
			href: (row: Record<string, unknown>) => string;
			screenReaderLabel: (row: Record<string, unknown>) => string;
		};
		actionHeader: string;
		columns: Array<TestColumn>;
		filter: boolean;
		itemLabel: string;
		pagination: boolean;
		rows: Array<Record<string, unknown>>;
		sort: boolean;
		title: string;
	}): ReactElement => (
		<section>
			<p>{`Showing ${rows.length} ${itemLabel}.`}</p>
			<table
				data-filter={String(filter)}
				data-pagination={String(pagination)}
				data-sort={String(sort)}
			>
				<caption>{title}</caption>
				<thead>
					<tr>
						{columns.map((column) => (
							<th key={column.field}>{column.headerName}</th>
						))}
						<th>{actionHeader}</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((row) => (
						<tr key={String(row["uuid"])}>
							{columns.map((column) => {
								const content = column.cellRenderer
									? column.cellRenderer(row)
									: String(row[column.field] ?? "");
								return column.rowHeader ? (
									<th key={column.field} scope="row">
										{content}
									</th>
								) : (
									<td key={column.field}>{content}</td>
								);
							})}
							<td>
								<a href={action.href(row)}>
									{action.buttonLabel}{" "}
									<span className="sr-only">
										{action.screenReaderLabel(row)}
									</span>
								</a>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</section>
	),
}));

const application: RPApplicationSummaryRead = {
	applicationInformationUuid: "application-information-uuid-1",
	canadaLoginEnvironment: "test",
	configurationName: "Partner test",
	partnerEnvironment: null,
	productionReviewStatus: null,
	registrationCompletedAt: null,
	registrationLastCompletedStep: "client-and-access",
	resumeTaskPath:
		"/workspaces/workspace-uuid-1/applications/application-information-uuid-1/rp-configurations/rp-application-uuid-1/registration/signing",
	role: "rp_admin",
	serviceNameEn: "Benefits Portal",
	serviceNameFr: "Portail des prestations",
	uuid: "rp-application-uuid-1",
	workspaceName: "Benefits Workspace",
	workspaceUuid: "workspace-uuid-1",
};

describe("RPApplicationSummaryTable", () => {
	it("renders registration and Production review as separate columns", () => {
		render(
			<RPApplicationSummaryTable
				applications={[application]}
				label="RP configurations - Benefits Portal"
			/>
		);

		const table = screen.getByRole("table", {
			name: "RP configurations - Benefits Portal",
		});
		expect(
			within(table)
				.getAllByRole("columnheader")
				.map((header) => header.textContent)
		).toEqual([
			"Name",
			"Partner environment",
			"CanadaLogin environment",
			"Registration",
			"Production review",
			"Action",
		]);
		expect(
			within(table).getByRole("cell", { name: "Partner test" })
		).toBeTruthy();
		expect(within(table).queryAllByRole("rowheader")).toHaveLength(0);
		expect(within(table).getByText("Not provided")).toBeTruthy();
		expect(table.getAttribute("data-filter")).toBe("false");
		expect(table.getAttribute("data-pagination")).toBe("false");
		expect(table.getAttribute("data-sort")).toBe("true");
		expect(screen.getByText("Showing 1 RP configuration.")).toBeTruthy();
	});

	it("gives an editable draft exactly one RP-configuration hub destination", () => {
		render(
			<RPApplicationSummaryTable
				applications={[application]}
				label="RP configurations"
			/>
		);

		const row = screen
			.getByRole("cell", { name: "Partner test" })
			.closest("tr");
		expect(row).not.toBeNull();
		const links = within(row as HTMLElement).getAllByRole("link");
		expect(links).toHaveLength(1);
		expect(links[0]?.textContent).toContain("View RP configuration");
		expect(links[0]?.getAttribute("href")).toBe(
			"/workspaces/workspace-uuid-1/applications/application-information-uuid-1/rp-configurations/rp-application-uuid-1"
		);
	});

	it("distinguishes an ambiguous historical review from no request", () => {
		render(
			<RPApplicationSummaryTable
				applications={[
					{
						...application,
						canadaLoginEnvironment: "production",
						productionReviewReconciliationRequired: true,
					},
				]}
				label="RP configurations"
			/>
		);

		expect(
			screen.getByText("Historical review requires reconciliation")
		).toBeTruthy();
	});

	it("gives a read-only draft the same permitted task-hub destination", () => {
		render(
			<RPApplicationSummaryTable
				applications={[
					{
						...application,
						resumeTaskPath: null,
						role: "read_only",
					},
				]}
				label="RP configurations"
			/>
		);

		const link = screen.getByRole("link", {
			name: "View RP configuration for Partner test",
		});
		expect(link.getAttribute("href")).toBe(
			"/workspaces/workspace-uuid-1/applications/application-information-uuid-1/rp-configurations/rp-application-uuid-1"
		);
	});

	it("adds references only for exact displayed name and both-environment duplicates", () => {
		render(
			<RPApplicationSummaryTable
				applications={[
					{
						...application,
						partnerEnvironment: "Partner QA",
						uuid: "11111111-0000-0000-0000-000000000001",
					},
					{
						...application,
						partnerEnvironment: "Partner QA",
						uuid: "22222222-0000-0000-0000-000000000002",
					},
					{
						...application,
						partnerEnvironment: "Partner QA blue",
						uuid: "33333333-0000-0000-0000-000000000003",
					},
				]}
				label="RP configurations"
			/>
		);

		expect(screen.getByText(/Reference: 11111111/)).toBeTruthy();
		expect(screen.getByText(/Reference: 22222222/)).toBeTruthy();
		expect(screen.queryByText(/Reference: 33333333/)).toBeNull();
	});

	it("extends colliding references in four-character increments", () => {
		render(
			<RPApplicationSummaryTable
				applications={[
					{
						...application,
						partnerEnvironment: "Partner QA",
						uuid: "abcdef12-3456-0000-0000-000000000001",
					},
					{
						...application,
						partnerEnvironment: "Partner QA",
						uuid: "abcdef12-7890-0000-0000-000000000002",
					},
				]}
				label="RP configurations"
			/>
		);

		expect(screen.getByText(/Reference: abcdef123456/)).toBeTruthy();
		expect(screen.getByText(/Reference: abcdef127890/)).toBeTruthy();
	});
});
