import type { PropsWithChildren, ReactElement, ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOnboardingOversightQueue } from "@/features/onboarding-oversight/hooks/use-onboarding-oversight-queue";
import { OnboardingOversightQueuePage } from "@/features/onboarding-oversight/pages/OnboardingOversightQueuePage";

const navigateMock = vi.fn();
const useSearchMock = vi.fn(() => ({}));
let resolvedLanguage = "en";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		i18n: { resolvedLanguage },
		t: (key: string): string =>
			({
				"onboardingOversight.queue.accessNoticeBody": "Metadata only.",
				"onboardingOversight.queue.accessNoticeTitle":
					"Oversight access is metadata-only",
				"onboardingOversight.queue.anyOption": "Any",
				"onboardingOversight.queue.applicationColumn":
					"Application and RP configuration",
				"onboardingOversight.queue.applyAction": "Apply filters",
				"onboardingOversight.queue.clearAction": "Clear filters",
				"onboardingOversight.queue.departmentColumn": "Department",
				"onboardingOversight.queue.emptyBody":
					"There are no Production-review requests.",
				"onboardingOversight.queue.emptyFilteredBody":
					"No requests match the filters.",
				"onboardingOversight.queue.emptyTitle": "No Production-review requests",
				"onboardingOversight.queue.externalReviewReferenceColumn":
					"External review reference",
				"onboardingOversight.queue.filtersDepartmentLabel": "Department",
				"onboardingOversight.queue.filtersReviewStatusLabel":
					"Production review status",
				"onboardingOversight.queue.filtersTitle": "Filter Production reviews",
				"onboardingOversight.queue.filtersWorkspaceLabel": "Workspace",
				"onboardingOversight.queue.lastActivityAtColumn":
					"Last review activity",
				"onboardingOversight.queue.loadingBody":
					"Loading Production-review requests.",
				"onboardingOversight.queue.loadingTitle": "Loading Production reviews",
				"onboardingOversight.queue.notApplicable": "Not applicable",
				"onboardingOversight.queue.pageTitle": "Production reviews",
				"onboardingOversight.queue.reviewerColumn": "Reviewer",
				"onboardingOversight.queue.reviewStatusColumn": "Review status",
				"onboardingOversight.queue.summary": "Review explicit requests.",
				"onboardingOversight.queue.tableTitle": "Production-review requests",
				"onboardingOversight.queue.viewAction": "View Production review",
				"onboardingOversight.queue.workspaceColumn": "Workspace",
				"workspaces.productionReviewStatusApproved": "Approved",
				"workspaces.productionReviewStatusPending": "Pending",
				"workspaces.productionReviewStatusRejected": "Rejected",
			})[key] ?? key,
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: (): typeof navigateMock => navigateMock,
	useSearch: (): ReturnType<typeof useSearchMock> => useSearchMock(),
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		onGcdsClick,
		type,
	}: PropsWithChildren<{
		onGcdsClick?: () => void;
		type: "button" | "link" | "reset" | "submit";
	}>): ReactElement => (
		<button onClick={onGcdsClick} type={type === "link" ? "button" : type}>
			{children}
		</button>
	),
	DataTable: ({
		action,
		columns,
		rows,
		title,
	}: {
		action: {
			buttonLabel: string;
			onAction: (row: Record<string, unknown>) => void;
		};
		columns: Array<{
			cellRenderer?: (row: Record<string, unknown>) => ReactNode;
			field: string;
			headerName: string;
		}>;
		rows: Array<Record<string, unknown>>;
		title: string;
	}): ReactElement => (
		<section>
			<h2>{title}</h2>
			{columns.map((column) => (
				<span key={column.field}>{column.headerName}</span>
			))}
			{rows.map((row) => (
				<div key={String(row["rpConfigurationUuid"])}>
					{columns.map((column) => (
						<span key={column.field}>
							{column.cellRenderer
								? column.cellRenderer(row)
								: String(row[column.field] ?? "")}
						</span>
					))}
					<button onClick={() => action.onAction(row)} type="button">
						{action.buttonLabel}
					</button>
				</div>
			))}
		</section>
	),
	Grid: ({ children }: PropsWithChildren): ReactElement => (
		<div>{children}</div>
	),
	Heading: ({
		children,
		tag,
	}: PropsWithChildren<{ tag?: string }>): ReactElement =>
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
			{label}
			<input
				id={inputId}
				value={value}
				onInput={(event) => onInput?.({ nativeEvent: event.nativeEvent })}
			/>
		</label>
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
			{label}
			<select
				id={selectId}
				value={value}
				onInput={(event) => onInput?.({ nativeEvent: event.nativeEvent })}
			>
				{children}
			</select>
		</label>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock(
	"@/features/onboarding-oversight/hooks/use-onboarding-oversight-queue",
	() => ({ useOnboardingOversightQueue: vi.fn() })
);

describe("OnboardingOversightQueuePage", () => {
	beforeEach(() => {
		resolvedLanguage = "en";
	});

	it("renders honest loading and empty states", () => {
		vi.mocked(useOnboardingOversightQueue)
			.mockReturnValueOnce({
				error: null,
				isLoading: true,
				isRefetching: false,
				queueRows: [],
			})
			.mockReturnValueOnce({
				error: null,
				isLoading: false,
				isRefetching: false,
				queueRows: [],
			});
		const { rerender } = render(<OnboardingOversightQueuePage />);
		expect(
			screen.getByRole("heading", { name: "Loading Production reviews" })
		).toBeTruthy();
		rerender(<OnboardingOversightQueuePage />);
		expect(
			screen.getByRole("heading", { name: "No Production-review requests" })
		).toBeTruthy();
	});

	it("applies only approved filters and opens the selected review", () => {
		vi.mocked(useOnboardingOversightQueue).mockReturnValue({
			error: null,
			isLoading: false,
			isRefetching: false,
			queueRows: [
				{
					applicationInformationUuid: "application-uuid-1",
					applicationNameEn: "Benefits Portal",
					applicationNameFr: "Portail des prestations",
					configurationName: "Production A",
					departmentName: "Employment and Social Development Canada",
					departmentUuid: "department-uuid-1",
					detailPath:
						"/workspaces/workspace-uuid-1/applications/application-uuid-1/rp-configurations/rp-uuid-1/production-review",
					externalReviewReference: "CAB-123",
					requestedAt: "2026-08-11T12:30:00Z",
					reviewStatus: "pending",
					rpConfigurationUuid: "rp-uuid-1",
					workspaceName: "Benefits Workspace",
					workspaceUuid: "workspace-uuid-1",
				},
			],
		});
		const { rerender } = render(<OnboardingOversightQueuePage />);
		expect(screen.getByText("Benefits Portal")).toBeTruthy();

		fireEvent.input(screen.getByLabelText(/^workspace$/i), {
			target: { value: "Benefits" },
		});
		fireEvent.input(screen.getByLabelText(/^department$/i), {
			target: { value: "Employment" },
		});
		fireEvent.input(screen.getByLabelText(/production review status/i), {
			target: { value: "pending" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
		expect(navigateMock).toHaveBeenCalledWith({
			search: {
				department: "Employment",
				reviewStatus: "pending",
				workspace: "Benefits",
			},
			to: "/onboarding-oversight/queue",
		});
		fireEvent.click(
			screen.getByRole("button", { name: "View Production review" })
		);
		expect(navigateMock).toHaveBeenLastCalledWith({
			to: "/workspaces/workspace-uuid-1/applications/application-uuid-1/rp-configurations/rp-uuid-1/production-review",
		});

		resolvedLanguage = "fr";
		rerender(<OnboardingOversightQueuePage />);
		expect(screen.getByText("Portail des prestations")).toBeTruthy();
	});
});
