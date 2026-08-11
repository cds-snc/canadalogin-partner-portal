import { createElement, type PropsWithChildren, type ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { YourApplicationsPage } from "@/features/your-applications/pages/YourApplicationsPage";
import { useRoles, useSession } from "@/hooks";
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces";

const { mockedUseQuery } = vi.hoisted(() => ({
	mockedUseQuery: vi.fn(),
}));

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string, options?: Record<string, unknown>) => string } => ({
		t: (key: string, _options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"nav.organization": "Organization",
				"nav.roles": "Roles",
				"yourApplications.applicationsSectionTitle": "RP applications",
				"yourApplications.environmentLabel": "Environment",
				"yourApplications.environmentProduction": "Production",
				"yourApplications.environmentStaging": "Staging",
				"yourApplications.environmentTest": "Test",
				"yourApplications.emailLabel": "Email",
					"yourApplications.errorBody": "Your applications could not be loaded for this session.",
					"yourApplications.errorTitle": "Unable to load your applications",
				"yourApplications.lifecycleUnavailable": "Lifecycle status unavailable.",
				"yourApplications.loadingBody": "Loading your applications.",
				"yourApplications.loadingTitle": "Loading your applications",
				"yourApplications.nameLabel": "Name",
					"yourApplications.noDepartment": "No department assigned",
				"yourApplications.noRoles": "No roles assigned.",
				"yourApplications.noWorkspaces": "No accessible workspaces found.",
				"yourApplications.noRPApplications": "No RP applications found.",
				"yourApplications.onboardingStateApproved": "Approved",
				"yourApplications.onboardingStateDraft": "Draft",
				"yourApplications.onboardingStateLabel": "Onboarding status",
				"yourApplications.onboardingStateLaunched": "Launched",
				"yourApplications.onboardingStateSubmitted": "Submitted",
				"yourApplications.onboardingStateUnderReview": "Under review",
				"yourApplications.profileSectionTitle": "Profile summary",
				"yourApplications.productionReviewLabel": "Production review",
				"yourApplications.promotionStatusApproved": "Approved",
				"yourApplications.promotionStatusChangesRequested": "Changes requested",
				"yourApplications.promotionStatusLaunched": "Launched",
				"yourApplications.promotionStatusReviewTracked": "Review tracked",
				"yourApplications.roleContextUnavailable": "Your role labels are unavailable right now.",
				"yourApplications.rolesLoading": "Loading your role context.",
				"yourApplications.summary": "Review your profile, accessible workspaces, and RP applications.",
				"yourApplications.title": "Your applications",
				"yourApplications.unknownApplication": "Unknown application",
				"yourApplications.viewAllWorkspaces": "Review all workspaces",
				"yourApplications.workspacesErrorBody": "Your workspaces could not be loaded for this session.",
				"yourApplications.workspacesErrorTitle": "Unable to load your workspaces",
				"yourApplications.workspacesLoadingBody": "Loading your workspaces.",
				"yourApplications.workspacesLoadingTitle": "Loading your workspaces",
				"yourApplications.workspacesSectionTitle": "Accessible workspaces",
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-query", () => ({
	useQuery: mockedUseQuery,
}));

vi.mock("@/components/layout", () => ({
	Breadcrumbs: (): ReactElement => <nav>Breadcrumbs</nav>,
}));

vi.mock("@/components/ui", () => ({
	Card: ({
		cardTitle,
		href,
		description,
	}: {
		cardTitle?: string;
		description?: string;
		href?: string;
	}): ReactElement => (
		href ? (
			<a href={href}>
				<span>{cardTitle}</span>
				{description ? <span>{description}</span> : null}
			</a>
		) : (
			<div>{cardTitle}</div>
		)
	),
	Container: ({ children }: PropsWithChildren): ReactElement => (
		<section>{children}</section>
	),
	Grid: ({ children }: PropsWithChildren): ReactElement => <div>{children}</div>,
	Heading: ({ children, tag = "h1" }: PropsWithChildren<{ tag?: string }>): ReactElement =>
		createElement(tag, undefined, children),
	Link: ({ children, href }: PropsWithChildren<{ href: string }>): ReactElement => (
		<a href={href}>{children}</a>
	),
	Notice: ({ children, noticeTitle }: PropsWithChildren<{ noticeTitle: string }>): ReactElement => (
		<section>
			<h2>{noticeTitle}</h2>
			{children}
		</section>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/hooks", () => ({
	useSession: vi.fn(),
	useRoles: vi.fn(),
}));

vi.mock("@/features/workspaces/hooks/use-workspaces", () => ({
	useWorkspaces: vi.fn(),
}));

const mockedUseSession = vi.mocked(useSession);
const mockedUseRoles = vi.mocked(useRoles);
const mockedUseWorkspaces = vi.mocked(useWorkspaces);

describe("YourApplicationsPage", () => {
	it("renders the loading state while the session is hydrating", () => {
		mockedUseQuery.mockReturnValue({
			data: null,
			error: null,
			isLoading: false,
		});
		mockedUseRoles.mockReturnValue({
			error: null,
			isLoading: false,
			itemsPerPage: 1000,
			page: 1,
			refetch: vi.fn(async () => null),
			response: null,
			roles: [],
		});
		mockedUseWorkspaces.mockReturnValue({
			error: null,
			isLoading: false,
			refetch: vi.fn(async () => null),
			workspaces: [],
		});
		mockedUseSession.mockReturnValue({
			currentUser: null,
			isAuthenticated: false,
			isLoading: true,
			login: vi.fn(),
			logout: vi.fn(async () => undefined),
			refreshSession: vi.fn(async () => null),
		});

		render(<YourApplicationsPage />);

		expect(screen.getByRole("heading", { name: /loading your applications/i })).toBeTruthy();
		expect(screen.getByText(/loading your applications\./i)).toBeTruthy();
	});

	it("renders populated profile, workspace, and application sections", () => {
		mockedUseQuery
			.mockReturnValueOnce({
				data: { name: "Employment and Social Development Canada" },
				error: null,
				isLoading: false,
			})
			.mockReturnValueOnce({
			data: [
				{
					canadaLoginEnvironment: "production",
					dnrAppName: "Benefits Portal",
					onboardingState: "under_review",
					promotionStatus: "review_tracked",
					uuid: "application-uuid-1",
				},
				{
					canadaLoginEnvironment: "staging",
					dnrAppName: "Claims Service",
					onboardingState: "submitted",
					uuid: "application-uuid-2",
				},
			],
			error: null,
			isLoading: false,
		});
		mockedUseRoles.mockReturnValue({
			error: null,
			isLoading: false,
			itemsPerPage: 1000,
			page: 1,
			refetch: vi.fn(async () => null),
			response: {
				data: [
					{ created_at: "2026-08-10T00:00:00Z", name: "RP Admin", uuid: "role-uuid-1" },
				],
				has_more: false,
				items_per_page: 1000,
				page: 1,
				total_count: 1,
			},
			roles: [
				{ created_at: "2026-08-10T00:00:00Z", name: "RP Admin", uuid: "role-uuid-1" },
			],
		});
		mockedUseWorkspaces.mockReturnValue({
			error: null,
			isLoading: false,
			refetch: vi.fn(async () => null),
			workspaces: [
				{
					createdAt: "2026-08-10T00:00:00Z",
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
			],
		});

		mockedUseSession.mockReturnValue({
			currentUser: {
				authProvider: "gc-sso",
				authSubject: "subject-123",
				departmentUuid: "department-uuid-1",
				email: "jane@example.com",
				name: "Jane Doe",
				profileImageUrl: null,
				roleUuids: ["role-uuid-1"],
				tierUuid: null,
				uuid: "user-uuid-1",
			},
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(async () => undefined),
			refreshSession: vi.fn(async () => null),
		});

		render(<YourApplicationsPage />);

				expect(screen.getByRole("heading", { name: /profile summary/i })).toBeTruthy();
				expect(screen.getByText(/name: jane doe/i)).toBeTruthy();
				expect(screen.getByText(/email: jane@example.com/i)).toBeTruthy();
				expect(screen.getByText(/organization: employment and social development canada/i)).toBeTruthy();
				expect(screen.getByText(/^rp admin$/i)).toBeTruthy();
				expect(screen.getByRole("link", { name: /review all workspaces/i })).toBeTruthy();
				expect(screen.getByRole("link", { name: /benefits workspace/i })).toBeTruthy();
				expect(screen.getByRole("link", { name: /benefits portal/i })).toBeTruthy();
				expect(screen.getByRole("link", { name: /claims service/i })).toBeTruthy();
				expect(
					screen.getByRole("link", { name: /benefits workspace/i }).getAttribute("href")
				).toBe("/workspaces/workspace-uuid-1");
		expect(screen.getByRole("heading", { name: /your applications/i })).toBeTruthy();
		expect(screen.getByRole("link", { name: /benefits portal/i })).toBeTruthy();
		expect(screen.getByRole("link", { name: /claims service/i })).toBeTruthy();
		expect(
			screen.getByRole("link", {
				name: /benefits portal.*Environment: Production\. Onboarding status: Under review\. Production review: Review tracked/i,
			})
		).toBeTruthy();
		expect(
			screen.getByRole("link", {
				name: /claims service.*Environment: Staging\. Onboarding status: Submitted/i,
			})
		).toBeTruthy();
			});

			it("renders empty workspace and application states", () => {
				mockedUseQuery
					.mockReturnValueOnce({
						data: null,
						error: null,
						isLoading: false,
					})
					.mockReturnValueOnce({
						data: [],
						error: null,
						isLoading: false,
					});
				mockedUseRoles.mockReturnValue({
					error: null,
					isLoading: false,
					itemsPerPage: 1000,
					page: 1,
					refetch: vi.fn(async () => null),
					response: { data: [], has_more: false, items_per_page: 1000, page: 1, total_count: 0 },
					roles: [],
				});
				mockedUseWorkspaces.mockReturnValue({
					error: null,
					isLoading: false,
					refetch: vi.fn(async () => null),
					workspaces: [],
				});
				mockedUseSession.mockReturnValue({
					currentUser: {
						authProvider: "gc-sso",
						authSubject: "subject-123",
						departmentUuid: null,
						email: "jane@example.com",
						name: "Jane Doe",
						profileImageUrl: null,
						roleUuids: [],
						tierUuid: null,
						uuid: "user-uuid-1",
					},
					isAuthenticated: true,
					isLoading: false,
					login: vi.fn(),
					logout: vi.fn(async () => undefined),
					refreshSession: vi.fn(async () => null),
				});

				render(<YourApplicationsPage />);

				expect(screen.getByText(/no roles assigned\./i)).toBeTruthy();
				expect(screen.getByText(/no accessible workspaces found\./i)).toBeTruthy();
				expect(screen.getByText(/no rp applications found\./i)).toBeTruthy();
			});

			it("renders a neutral lifecycle placeholder when current-user application status is unavailable", () => {
				mockedUseQuery
					.mockReturnValueOnce({
						data: null,
						error: null,
						isLoading: false,
					})
					.mockReturnValueOnce({
						data: [{ dnrAppName: "Benefits Portal", uuid: "application-uuid-1" }],
						error: null,
						isLoading: false,
					});
				mockedUseRoles.mockReturnValue({
					error: null,
					isLoading: false,
					itemsPerPage: 1000,
					page: 1,
					refetch: vi.fn(async () => null),
					response: { data: [], has_more: false, items_per_page: 1000, page: 1, total_count: 0 },
					roles: [],
				});
				mockedUseWorkspaces.mockReturnValue({
					error: null,
					isLoading: false,
					refetch: vi.fn(async () => null),
					workspaces: [],
				});
				mockedUseSession.mockReturnValue({
					currentUser: {
						authProvider: "gc-sso",
						authSubject: "subject-123",
						departmentUuid: null,
						email: "jane@example.com",
						name: "Jane Doe",
						profileImageUrl: null,
						roleUuids: [],
						tierUuid: null,
						uuid: "user-uuid-1",
					},
					isAuthenticated: true,
					isLoading: false,
					login: vi.fn(),
					logout: vi.fn(async () => undefined),
					refreshSession: vi.fn(async () => null),
				});

				render(<YourApplicationsPage />);

				expect(screen.getByText(/lifecycle status unavailable\./i)).toBeTruthy();
			});

			it("renders workspace and application error notices", () => {
				mockedUseQuery
					.mockReturnValueOnce({
						data: null,
						error: null,
						isLoading: false,
					})
					.mockReturnValueOnce({
						data: [],
						error: new Error("Applications request failed"),
						isLoading: false,
					});
				mockedUseRoles.mockReturnValue({
					error: null,
					isLoading: false,
					itemsPerPage: 1000,
					page: 1,
					refetch: vi.fn(async () => null),
					response: { data: [], has_more: false, items_per_page: 1000, page: 1, total_count: 0 },
					roles: [],
				});
				mockedUseWorkspaces.mockReturnValue({
					error: new Error("Workspaces request failed"),
					isLoading: false,
					refetch: vi.fn(async () => null),
					workspaces: [],
				});
				mockedUseSession.mockReturnValue({
					currentUser: {
						authProvider: "gc-sso",
						authSubject: "subject-123",
						departmentUuid: null,
						email: "jane@example.com",
						name: "Jane Doe",
						profileImageUrl: null,
						roleUuids: [],
						tierUuid: null,
						uuid: "user-uuid-1",
					},
					isAuthenticated: true,
					isLoading: false,
					login: vi.fn(),
					logout: vi.fn(async () => undefined),
					refreshSession: vi.fn(async () => null),
				});

				render(<YourApplicationsPage />);

				expect(screen.getByRole("heading", { name: /unable to load your workspaces/i })).toBeTruthy();
				expect(screen.getByRole("heading", { name: /unable to load your applications/i })).toBeTruthy();
	});
});
