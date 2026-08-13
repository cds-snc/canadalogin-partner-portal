import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceApplicationAuditPage } from "@/features/workspaces/pages/WorkspaceApplicationAuditPage";
import { ConflictRequestError } from "@/fetch";
import {
	useWorkspaceRPApplication,
	useWorkspaceRPApplicationAuditTrail,
} from "@/features/workspaces/hooks/use-workspace-rp-applications";

const loadMoreMock = vi.fn(() => Promise.resolve());

vi.mock("react-i18next", () => ({
	useTranslation: (): {
		t: (key: string, options?: Record<string, unknown>) => string;
	} => ({
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"errors.conflictTitle": "Resolve the conflict",
				"workspaces.applicationsAuditAction": "Review audit activity",
				"workspaces.applicationsAuditApplyAction": "Apply date",
				"workspaces.applicationsAuditCountryColumn": "Country",
				"workspaces.applicationsAuditDateLabel": "Audit date",
				"workspaces.applicationsAuditLoadMore": "Load more events",
				"workspaces.applicationsAuditMoreAvailable":
					"More audit events are available for the selected day.",
				"workspaces.applicationsAuditOriginColumn": "Origin",
				"workspaces.applicationsAuditResultColumn": "Result",
				"workspaces.applicationsAuditSummary":
					"Review bounded audit activity for this workspace-scoped RP application.",
				"workspaces.applicationsAuditTimestampColumn": "Timestamp",
				"workspaces.applicationsAuditUserColumn": "User",
				"workspaces.applicationsBackToList": "Back to RP applications",
				"workspaces.applicationsUsageAction": "Review usage summary",
				"workspaces.applicationsUsageApplyAction": "Apply date",
				"workspaces.applicationsUsageDateLabel": "Usage date",
				"workspaces.applicationsUsageFailedLabel": "Failed sign-ins",
				"workspaces.applicationsUsageSucceededLabel": "Successful sign-ins",
				"workspaces.applicationsUsageSummary":
					"Review the usage totals for this workspace-scoped RP application on a selected day.",
				"workspaces.applicationsUsageTotalLabel": "Total sign-ins",
				"workspaces.loadingApplications": "Loading applications...",
			};

			if (key === "workspaces.applicationsUsagePageTitle") {
				return `Usage summary - ${String(options?.["name"] ?? "")}`;
			}

			if (key === "workspaces.applicationsAuditPageTitle") {
				return `Audit activity - ${String(options?.["name"] ?? "")}`;
			}

			if (key === "workspaces.applicationsAuditShowing") {
				return `Showing ${String(options?.["shown"] ?? "0")} of ${String(options?.["total"] ?? "0")} audit events.`;
			}

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useParams: (): { rpApplicationUuid: string; workspaceUuid: string } => ({
		rpApplicationUuid: "rp-application-uuid-1",
		workspaceUuid: "workspace-uuid-1",
	}),
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		onGcdsClick,
		type,
	}: PropsWithChildren<{
		onGcdsClick?: () => void;
		type: string;
	}>): ReactElement =>
		type === "button" ? (
			<button onClick={onGcdsClick} type="button">
				{children}
			</button>
		) : (
			<a href="#">{children}</a>
		),
	DataTable: ({ rows }: { rows: Array<{ user: string }> }): ReactElement => (
		<section>
			{rows.map((row, index) => (
				<div key={`${row.user}-${index}`}>{row.user}</div>
			))}
		</section>
	),
	DateInput: ({
		legend,
		onInput,
		value,
	}: {
		legend: string;
		onInput?: (event: { target: { value: string } }) => void;
		value?: string;
	}): ReactElement => (
		<label>
			<span>{legend}</span>
			<input
				value={value}
				onInput={(event): void => {
					onInput?.({
						target: { value: (event.target as HTMLInputElement).value },
					});
				}}
			/>
		</label>
	),
	Heading: ({ children }: PropsWithChildren): ReactElement => (
		<h1>{children}</h1>
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

vi.mock("@/features/workspaces/hooks/use-workspace-rp-applications", () => ({
	useWorkspaceRPApplication: vi.fn(),
	useWorkspaceRPApplicationAuditTrail: vi.fn(),
}));
vi.mock(
	"@/features/workspaces/hooks/use-application-rp-configurations",
	() => ({
		useApplicationRPConfiguration: () => ({
			configuration: null,
			error: null,
			isLoading: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
		}),
	})
);

describe("Workspace application operations pages", () => {
	it("renders audit results and loads more events", () => {
		vi.mocked(useWorkspaceRPApplication).mockReturnValue({
			application: {
				createdAt: "2026-07-31T10:05:00Z",
				createdBy: 7,
				dnrAppName: "Benefits Portal",
				id: 21,
				isDeleted: false,
				status: "active",
				uuid: "rp-application-uuid-1",
				workspaceId: 9,
			},
			error: null,
			isLoading: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
		});
		vi.mocked(useWorkspaceRPApplicationAuditTrail).mockReturnValue({
			error: null,
			events: [
				{
					country: "CA",
					ipVersion: 4,
					origin: "partner-portal",
					originDisplay: "Partner portal",
					result: "success",
					timeSeconds: 1775548800,
					username: "user@example.gc.ca",
					usernameDisplay: "user@example.gc.ca",
					usernameKnown: true,
				},
			],
			isLoading: false,
			isLoadingMore: false,
			loadMore: loadMoreMock,
			next: "1775548800,event-2",
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
			total: 50,
		});

		render(<WorkspaceApplicationAuditPage />);

		expect(screen.getByText("user@example.gc.ca")).toBeTruthy();
		fireEvent.click(screen.getByRole("button", { name: /load more events/i }));
		expect(loadMoreMock).toHaveBeenCalled();
	});

	it("shows the audit conflict detail when telemetry is unavailable", () => {
		vi.mocked(useWorkspaceRPApplication).mockReturnValue({
			application: {
				createdAt: "2026-07-31T10:05:00Z",
				createdBy: 7,
				dnrAppName: "Benefits Portal",
				id: 21,
				isDeleted: false,
				status: "active",
				uuid: "rp-application-uuid-1",
				workspaceId: 9,
			},
			error: null,
			isLoading: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
		});
		vi.mocked(useWorkspaceRPApplicationAuditTrail).mockReturnValue({
			error: new ConflictRequestError({
				detail:
					"Link the RP application to an IBM Security Verify application before viewing audit telemetry.",
			}),
			events: [],
			isLoading: false,
			isLoadingMore: false,
			loadMore: loadMoreMock,
			next: null,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
			total: null,
		});

		render(<WorkspaceApplicationAuditPage />);

		expect(
			screen.getByRole("heading", { name: /resolve the conflict/i })
		).toBeTruthy();
		expect(
			screen.getByText(
				/link the rp application to an ibm security verify application before viewing audit telemetry/i
			)
		).toBeTruthy();
	});
});
