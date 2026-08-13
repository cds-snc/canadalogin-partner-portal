import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicationInformationListPage } from "@/features/workspaces/pages/ApplicationInformationListPage";
import { useWorkspace } from "@/features/workspaces/hooks/use-workspace";
import { useWorkspaceApplicationInformationList } from "@/features/workspaces/hooks/use-workspace-application-information";

const navigateMock = vi.fn(() => Promise.resolve());
const i18nState = vi.hoisted(() => ({ resolvedLanguage: "en" }));

vi.mock("react-i18next", () => ({
	useTranslation: (): {
		i18n: { language: string; resolvedLanguage: string };
		t: (key: string, options?: Record<string, unknown>) => string;
	} => ({
		i18n: {
			language: i18nState.resolvedLanguage,
			resolvedLanguage: i18nState.resolvedLanguage,
		},
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"common.notAvailable": "Not available",
				"workspaces.appInfoCreateButton": "Create application information",
				"workspaces.appInfoDeletedSuccess":
					"Application information deleted successfully",
				"workspaces.appInfoListSummary":
					"Create, review, and update canonical bilingual application details for this workspace.",
				"workspaces.appInfoSectionTitle": "Application Information",
				"workspaces.appInfoServiceNameLabel":
					i18nState.resolvedLanguage.startsWith("fr") ? "Nom" : "Name",
				"workspaces.appInfoViewAction": "View application",
				"workspaces.onboardingStateColumn": "Onboarding status",
				"workspaces.onboardingStateUnderReview": "Under review",
				"workspaces.rpConfigurationAddAction": "Add RP configuration",
			};

			if (key === "workspaces.appInfoListTitle") {
				return `Application information - ${String(options?.["name"] ?? "")}`;
			}

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: (): typeof navigateMock => navigateMock,
	useParams: (): { workspaceUuid: string } => ({
		workspaceUuid: "workspace-uuid-1",
	}),
	useSearch: (): { deleted?: "1" } => ({ deleted: "1" }),
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
	Button: ({
		children,
		href,
		onGcdsClick,
		type,
	}: PropsWithChildren<{
		href?: string;
		onGcdsClick?: () => void;
		type: string;
	}>): ReactElement =>
		type === "link" ? (
			<a href={href}>{children}</a>
		) : (
			<button onClick={onGcdsClick} type="button">
				{children}
			</button>
		),
	DataTable: ({
		action,
		columns,
		primaryAction,
		rows,
	}: {
		action: Array<{
			buttonLabel: string;
			isVisible?: () => boolean;
			onAction: (row: {
				name: string;
				onboardingState: string;
				uuid: string;
			}) => void;
			screenReaderLabel: (row: {
				name: string;
				onboardingState: string;
				uuid: string;
			}) => string;
		}>;
		columns: Array<{ field: string; headerName: string; rowHeader?: boolean }>;
		primaryAction: { buttonLabel: string; onAction: () => void };
		rows: Array<{
			name: string;
			onboardingState: string;
			uuid: string;
		}>;
	}): ReactElement => (
		<section>
			<button onClick={primaryAction.onAction} type="button">
				{primaryAction.buttonLabel}
			</button>
			<table>
				<thead>
					<tr>
						{columns.map((column) => (
							<th key={column.field}>{column.headerName}</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row) => (
						<tr key={row.uuid}>
							{columns.map((column) => (
								<td key={column.field}>
									{String(row[column.field as keyof typeof row])}
								</td>
							))}
							<td>
								{action
									.filter((item) => !item.isVisible || item.isVisible())
									.map((item) => (
										<button
											key={item.buttonLabel}
											onClick={() => item.onAction(row)}
											type="button"
										>
											{item.buttonLabel}{" "}
											<span className="sr-only">
												{item.screenReaderLabel(row)}
											</span>
										</button>
									))}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</section>
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

vi.mock("@/features/workspaces/hooks/use-workspace", () => ({
	useWorkspace: vi.fn(),
}));

vi.mock(
	"@/features/workspaces/hooks/use-workspace-application-information",
	() => ({
		useWorkspaceApplicationInformationList: vi.fn(),
	})
);

describe("ApplicationInformationListPage", () => {
	beforeEach(() => {
		i18nState.resolvedLanguage = "en";
		navigateMock.mockClear();
	});

	it("renders the delete success notice and navigates to detail and create routes", () => {
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
				slug: "benefits-workspace",
				updatedAt: null,
				uuid: "workspace-uuid-1",
			},
		});
		vi.mocked(useWorkspaceApplicationInformationList).mockReturnValue({
			applicationInformationRecords: [
				{
					createdAt: "2026-07-30T15:00:00Z",
					createdBy: 42,
					deletedAt: null,
					id: 17,
					isDeleted: false,
					migrationOrTransitionPlan: "Phased transition",
					overview: "Overview text",
					onboardingState: "under_review",
					securityAndPrivacy: "Protected B controls apply",
					serviceNameEn: "Example service",
					serviceNameFr: "Service exemple",
					submittedAt: null,
					technologyAndProtocol: "OIDC with backend mediation",
					underReviewAt: null,
					updatedAt: null,
					usage: "Partner onboarding usage",
					uuid: "application-information-uuid-1",
					workspaceId: 9,
					approvedAt: null,
					launchedAt: null,
				},
			],
			error: null,
			isLoading: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
		});

		render(<ApplicationInformationListPage />);
		expect(screen.getByRole("cell", { name: "Example service" })).toBeTruthy();
		expect(screen.queryByText("Service exemple")).toBeNull();
		expect(screen.getAllByRole("columnheader")).toHaveLength(2);
		expect(screen.getByRole("columnheader", { name: "Name" })).toBeTruthy();
		expect(screen.queryAllByRole("rowheader")).toHaveLength(0);
		expect(screen.getByText(/under review/i)).toBeTruthy();

		expect(
			screen.getByRole("heading", {
				name: /application information deleted successfully/i,
			})
		).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: /view application/i }));
		expect(navigateMock).toHaveBeenCalledWith({
			params: {
				applicationInformationUuid: "application-information-uuid-1",
				workspaceUuid: "workspace-uuid-1",
			},
			to: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid",
		});

		fireEvent.click(
			screen.getByRole("button", { name: /add rp configuration/i })
		);
		expect(navigateMock).toHaveBeenCalledWith({
			params: {
				applicationInformationUuid: "application-information-uuid-1",
				workspaceUuid: "workspace-uuid-1",
			},
			to: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/new",
		});

		fireEvent.click(
			screen.getByRole("button", { name: /create application information/i })
		);
		expect(navigateMock).toHaveBeenCalledWith({
			params: { workspaceUuid: "workspace-uuid-1" },
			to: "/workspaces/$workspaceUuid/applications/new",
		});
	});

	it("shows only the French Application name for a French interface", () => {
		i18nState.resolvedLanguage = "fr-CA";
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
				slug: "benefits-workspace",
				updatedAt: null,
				uuid: "workspace-uuid-1",
			},
		});
		vi.mocked(useWorkspaceApplicationInformationList).mockReturnValue({
			applicationInformationRecords: [
				{
					approvedAt: null,
					createdAt: "2026-07-30T15:00:00Z",
					createdBy: 42,
					deletedAt: null,
					id: 17,
					isDeleted: false,
					launchedAt: null,
					migrationOrTransitionPlan: "Phased transition",
					onboardingState: "under_review",
					overview: "Overview text",
					securityAndPrivacy: "Protected B controls apply",
					serviceNameEn: "Example service",
					serviceNameFr: "Service exemple",
					submittedAt: null,
					technologyAndProtocol: "OIDC with backend mediation",
					underReviewAt: null,
					updatedAt: null,
					usage: "Partner onboarding usage",
					uuid: "application-information-uuid-1",
					workspaceId: 9,
				},
			],
			error: null,
			isLoading: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
		});

		render(<ApplicationInformationListPage />);

		expect(screen.getByRole("cell", { name: "Service exemple" })).toBeTruthy();
		expect(screen.queryByText("Example service")).toBeNull();
		expect(screen.getByRole("columnheader", { name: "Nom" })).toBeTruthy();
		expect(screen.queryAllByRole("rowheader")).toHaveLength(0);
		expect(
			screen.getByRole("button", {
				name: "View application Service exemple",
			})
		).toBeTruthy();
	});
});
