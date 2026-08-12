import {
	createElement,
	type PropsWithChildren,
	type ReactElement,
} from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { YourApplicationsPage } from "@/features/your-applications/pages/YourApplicationsPage";
import { accessibleRPApplicationsQueryKey } from "@/features/your-applications/query-keys";
import { useSession } from "@/hooks";
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces";

const { mockedUseQuery } = vi.hoisted(() => ({
	mockedUseQuery: vi.fn(),
}));

vi.mock("react-i18next", () => ({
	useTranslation: (): {
		i18n: { language: string; resolvedLanguage: string };
		t: (key: string, options?: Record<string, unknown>) => string;
	} => ({
		i18n: { language: "en", resolvedLanguage: "en" },
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"authorization.roles.rpAdmin": "RP Admin",
				"yourApplications.applicationsSectionTitle": "RP applications",
				"yourApplications.environmentLabel": "Environment",
				"yourApplications.environmentProduction": "Production",
				"yourApplications.environmentStaging": "Staging",
				"yourApplications.environmentTest": "Test",
				"yourApplications.errorBody":
					"Your applications could not be loaded for this session.",
				"yourApplications.errorTitle": "Unable to load your applications",
				"yourApplications.lifecycleUnavailable":
					"Lifecycle status unavailable.",
				"yourApplications.loadingBody": "Loading your applications.",
				"yourApplications.loadingTitle": "Loading your applications",
				"yourApplications.noWorkspaces": "No accessible workspaces found.",
				"yourApplications.noRPApplications": "No RP applications found.",
				"yourApplications.onboardingStateApproved": "Approved",
				"yourApplications.onboardingStateDraft": "Draft",
				"yourApplications.onboardingStateLabel": "Onboarding status",
				"yourApplications.onboardingStateLaunched": "Launched",
				"yourApplications.onboardingStateSubmitted": "Submitted",
				"yourApplications.onboardingStateUnderReview": "Under review",
				"yourApplications.productionReviewLabel": "Production review",
				"yourApplications.promotionStatusApproved": "Approved",
				"yourApplications.promotionStatusChangesRequested": "Changes requested",
				"yourApplications.promotionStatusLaunched": "Launched",
				"yourApplications.promotionStatusReviewTracked": "Review tracked",
				"yourApplications.retryApplications": "Retry applications",
				"yourApplications.retryWorkspaces": "Retry workspaces",
				"yourApplications.summary":
					"Review your accessible RP applications and workspaces, then resume the work you need to complete.",
				"yourApplications.title": "Your applications",
				"yourApplications.unknownApplication": "Unknown application",
				"yourApplications.viewAllWorkspaces": "Review all workspaces",
				"yourApplications.workspacesErrorBody":
					"Your workspaces could not be loaded for this session.",
				"yourApplications.workspacesErrorTitle":
					"Unable to load your workspaces",
				"yourApplications.workspacesLoadingBody": "Loading your workspaces.",
				"yourApplications.workspacesLoadingTitle": "Loading your workspaces",
				"yourApplications.workspacesSectionTitle": "Accessible workspaces",
			};
			if (key === "authorization.workspaceRoleNameContext") {
				return `${String(options?.["role"])} — ${String(options?.["workspaceName"])}`;
			}

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
	Button: ({
		children,
		onGcdsClick,
	}: PropsWithChildren<{ onGcdsClick?: () => void }>): ReactElement => (
		<button onClick={onGcdsClick} type="button">
			{children}
		</button>
	),
	Card: ({
		cardTitle,
		href,
		description,
	}: {
		cardTitle?: string;
		description?: string;
		href?: string;
	}): ReactElement =>
		href ? (
			<a href={href}>
				<span>{cardTitle}</span>
				{description ? <span>{description}</span> : null}
			</a>
		) : (
			<div>{cardTitle}</div>
		),
	Container: ({ children }: PropsWithChildren): ReactElement => (
		<section>{children}</section>
	),
	Heading: ({
		children,
		tag = "h1",
	}: PropsWithChildren<{ tag?: string }>): ReactElement =>
		createElement(tag, undefined, children),
	Link: ({
		children,
		href,
	}: PropsWithChildren<{ href: string }>): ReactElement => (
		<a href={href}>{children}</a>
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

vi.mock("@/hooks", () => ({
	useSession: vi.fn(),
}));

vi.mock("@/features/workspaces/hooks/use-workspaces", () => ({
	useWorkspaces: vi.fn(),
}));

const mockedUseSession = vi.mocked(useSession);
const mockedUseWorkspaces = vi.mocked(useWorkspaces);

describe("YourApplicationsPage", () => {
	it("renders the loading state while the session is hydrating", () => {
		mockedUseQuery.mockReturnValue({
			data: null,
			error: null,
			isLoading: false,
			refetch: vi.fn(async () => null),
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
		expect(mockedUseQuery).toHaveBeenCalledWith(
			expect.objectContaining({
				queryKey: accessibleRPApplicationsQueryKey,
			})
		);

		expect(
			screen.getByRole("heading", { name: /loading your applications/i })
		).toBeTruthy();
		expect(screen.getByText(/loading your applications\./i)).toBeTruthy();
	});

	it("renders focused workspace and application sections without a profile summary", () => {
		mockedUseQuery.mockReturnValue({
			data: [
				{
					canadaLoginEnvironment: "production",
					onboardingState: "under_review",
					promotionStatus: "review_tracked",
					role: "rp_admin",
					serviceNameEn: "Benefits Portal",
					serviceNameFr: "Portail des prestations",
					uuid: "application-uuid-1",
					workspaceName: "Benefits Workspace",
					workspaceUuid: "workspace-uuid-1",
				},
				{
					canadaLoginEnvironment: "staging",
					onboardingState: "submitted",
					role: "rp_admin",
					serviceNameEn: "Claims Service",
					serviceNameFr: "Service des réclamations",
					uuid: "application-uuid-2",
					workspaceName: "Benefits Workspace",
					workspaceUuid: "workspace-uuid-1",
				},
			],
			error: null,
			isLoading: false,
			refetch: vi.fn(async () => null),
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
				acceptedTermsAt: "2026-06-11T12:00:00Z",
				authorizationContext: {
					globalRole: null,
					partnerAccess: [
						{ role: "rp_admin", workspaceUuid: "workspace-uuid-1" },
					],
				},
				departmentAbbreviation: "ESDC",
				departmentUuid: "department-uuid-1",
				email: "jane@example.com",
				name: "Jane Doe",
				profileImageUrl: "",
				termsVersion: "2026-01",
				tierUuid: null,
				uuid: "user-uuid-1",
				username: "jane@example.com",
			},
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(async () => undefined),
			refreshSession: vi.fn(async () => null),
		});

		render(<YourApplicationsPage />);

		expect(
			screen.queryByRole("heading", { name: /profile summary/i })
		).toBeNull();
		expect(screen.queryByText(/jane@example.com/i)).toBeNull();
		expect(
			screen.getByRole("link", { name: /review all workspaces/i })
		).toBeTruthy();
		expect(
			screen.getByRole("link", {
				name: /^Benefits WorkspacePrimary workspace$/i,
			})
		).toBeTruthy();
		expect(screen.getByRole("link", { name: /benefits portal/i })).toBeTruthy();
		expect(screen.getByRole("link", { name: /claims service/i })).toBeTruthy();
		expect(
			screen
				.getByRole("link", {
					name: /^Benefits WorkspacePrimary workspace$/i,
				})
				.getAttribute("href")
		).toBe("/workspaces/workspace-uuid-1");
		expect(
			screen.getByRole("heading", { name: /your applications/i })
		).toBeTruthy();
		expect(screen.getByRole("link", { name: /benefits portal/i })).toBeTruthy();
		expect(screen.getByRole("link", { name: /claims service/i })).toBeTruthy();
		expect(
			screen.getByRole("link", {
				name: /benefits portal.*Environment: Production\. Onboarding status: Under review\. Production review: Review tracked.*RP Admin — Benefits Workspace/i,
			})
		).toBeTruthy();
		expect(
			screen.getByRole("link", {
				name: /claims service.*Environment: Staging\. Onboarding status: Submitted.*RP Admin — Benefits Workspace/i,
			})
		).toBeTruthy();
	});

	it("renders empty workspace and application states", () => {
		mockedUseQuery.mockReturnValue({
			data: [],
			error: null,
			isLoading: false,
			refetch: vi.fn(async () => null),
		});
		mockedUseWorkspaces.mockReturnValue({
			error: null,
			isLoading: false,
			refetch: vi.fn(async () => null),
			workspaces: [],
		});
		mockedUseSession.mockReturnValue({
			currentUser: {
				acceptedTermsAt: "2026-06-11T12:00:00Z",
				authorizationContext: { globalRole: null, partnerAccess: [] },
				departmentAbbreviation: null,
				departmentUuid: null,
				email: "jane@example.com",
				name: "Jane Doe",
				profileImageUrl: "",
				termsVersion: "2026-01",
				tierUuid: null,
				uuid: "user-uuid-1",
				username: "jane@example.com",
			},
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(async () => undefined),
			refreshSession: vi.fn(async () => null),
		});

		render(<YourApplicationsPage />);

		expect(screen.getByText(/no accessible workspaces found\./i)).toBeTruthy();
		expect(screen.getByText(/no rp applications found\./i)).toBeTruthy();
	});

	it("keeps workspace and role context when lifecycle metadata is unavailable", () => {
		mockedUseQuery.mockReturnValue({
			data: [
				{
					role: "read_only",
					serviceNameEn: "Benefits Portal",
					serviceNameFr: "Portail des prestations",
					uuid: "application-uuid-1",
					workspaceName: "Benefits Workspace",
					workspaceUuid: "workspace-uuid-1",
				},
			],
			error: null,
			isLoading: false,
			refetch: vi.fn(async () => null),
		});
		mockedUseWorkspaces.mockReturnValue({
			error: null,
			isLoading: false,
			refetch: vi.fn(async () => null),
			workspaces: [],
		});
		mockedUseSession.mockReturnValue({
			currentUser: {
				acceptedTermsAt: "2026-06-11T12:00:00Z",
				authorizationContext: { globalRole: null, partnerAccess: [] },
				departmentAbbreviation: null,
				departmentUuid: null,
				email: "jane@example.com",
				name: "Jane Doe",
				profileImageUrl: "",
				termsVersion: "2026-01",
				tierUuid: null,
				uuid: "user-uuid-1",
				username: "jane@example.com",
			},
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(async () => undefined),
			refreshSession: vi.fn(async () => null),
		});

		render(<YourApplicationsPage />);

		expect(
			screen.getByRole("link", {
				name: /benefits portal.*Benefits Workspace/i,
			})
		).toBeTruthy();
	});

	it("renders independently retryable workspace and application errors", () => {
		const refetchApplications = vi.fn(async () => null);
		const refetchWorkspaces = vi.fn(async () => null);
		mockedUseQuery.mockReturnValue({
			data: [],
			error: new Error("Applications request failed"),
			isLoading: false,
			refetch: refetchApplications,
		});
		mockedUseWorkspaces.mockReturnValue({
			error: new Error("Workspaces request failed"),
			isLoading: false,
			refetch: refetchWorkspaces,
			workspaces: [],
		});
		mockedUseSession.mockReturnValue({
			currentUser: {
				acceptedTermsAt: "2026-06-11T12:00:00Z",
				authorizationContext: { globalRole: null, partnerAccess: [] },
				departmentAbbreviation: null,
				departmentUuid: null,
				email: "jane@example.com",
				name: "Jane Doe",
				profileImageUrl: "",
				termsVersion: "2026-01",
				tierUuid: null,
				uuid: "user-uuid-1",
				username: "jane@example.com",
			},
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(async () => undefined),
			refreshSession: vi.fn(async () => null),
		});

		render(<YourApplicationsPage />);

		expect(
			screen.getByRole("heading", { name: /unable to load your workspaces/i })
		).toBeTruthy();
		expect(
			screen.getByRole("heading", { name: /unable to load your applications/i })
		).toBeTruthy();

		fireEvent.click(
			screen.getByRole("button", { name: /retry applications/i })
		);
		fireEvent.click(screen.getByRole("button", { name: /retry workspaces/i }));
		expect(refetchApplications).toHaveBeenCalledOnce();
		expect(refetchWorkspaces).toHaveBeenCalledOnce();
	});

	it("keeps accessible application work visible when the workspace section fails", () => {
		mockedUseQuery.mockReturnValue({
			data: [
				{
					canadaLoginEnvironment: "test",
					onboardingState: "draft",
					role: "rp_user_edit",
					serviceNameEn: "Invitation-backed service",
					serviceNameFr: "Service sur invitation",
					uuid: "application-uuid-invited",
					workspaceName: "Benefits Workspace",
					workspaceUuid: "workspace-uuid-1",
				},
			],
			error: null,
			isLoading: false,
			refetch: vi.fn(async () => null),
		});
		mockedUseWorkspaces.mockReturnValue({
			error: new Error("Workspaces request failed"),
			isLoading: false,
			refetch: vi.fn(async () => null),
			workspaces: [],
		});
		mockedUseSession.mockReturnValue({
			currentUser: {
				acceptedTermsAt: "2026-06-11T12:00:00Z",
				authorizationContext: {
					globalRole: null,
					partnerAccess: [
						{ role: "rp_user_edit", workspaceUuid: "workspace-uuid-1" },
					],
				},
				departmentAbbreviation: "TBS",
				departmentUuid: "department-uuid-1",
				email: "invited@example.com",
				name: "Invited Editor",
				profileImageUrl: "",
				termsVersion: "2026-01",
				tierUuid: null,
				uuid: "user-uuid-invited",
				username: "invited@example.com",
			},
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(async () => undefined),
			refreshSession: vi.fn(async () => null),
		});

		render(<YourApplicationsPage />);

		expect(
			screen.getByRole("link", { name: /invitation-backed service/i })
		).toBeTruthy();
		expect(
			screen.getByRole("heading", { name: /unable to load your workspaces/i })
		).toBeTruthy();
	});
});
