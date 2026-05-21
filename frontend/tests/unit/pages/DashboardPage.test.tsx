import type { PropsWithChildren, ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { useRoles, useSession } from "@/hooks";

const { mockedUseQuery } = vi.hoisted(() => ({
	mockedUseQuery: vi.fn(),
}));

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string, options?: Record<string, unknown>) => string } => ({
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"dashboard.department": `Department: ${options?.["value"] ?? ""}`,
				"dashboard.email": `Email: ${options?.["value"] ?? ""}`,
				"dashboard.loadingBody": "Loading your profile, department, and roles.",
				"dashboard.loadingTitle": "Loading dashboard",
				"dashboard.name": `Name: ${options?.["value"] ?? ""}`,
				"dashboard.noDepartment": "No department assigned",
				"dashboard.noRPApplications": "No RP applications found.",
				"dashboard.noRoles": "No roles assigned",
				"dashboard.noWorkspaces": "No workspaces found.",
				"dashboard.profileEyebrow": "Signed-in profile",
				"dashboard.resourcesEyebrow": "Service resources",
				"dashboard.resourcesSummary": "Jump into the areas you use most often from one place.",
				"dashboard.resourcesTitle": "Workspaces and RP applications",
				"dashboard.rpApplicationsDescription": "Review RP applications across your workspaces.",
				"dashboard.rpApplicationsListTitle": "RP Applications",
				"dashboard.roles": "Roles",
				"dashboard.summary": "Overview of your account.",
				"dashboard.title": "Dashboard",
				"dashboard.workspacesDescription": "View the workspaces you can access.",
				"dashboard.workspacesListTitle": "Workspaces",
				"dashboard.workspaceApplicationItem": `${options?.["application"] ?? ""} (${options?.["workspace"] ?? ""})`,
				"nav.home": "Home",
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
	CenteredPageLayout: ({ children }: PropsWithChildren): ReactElement => (
		<div>{children}</div>
	),
}));

vi.mock("@/components/ui", () => ({
	Grid: ({ children }: PropsWithChildren): ReactElement => <section>{children}</section>,
	Heading: ({ children }: PropsWithChildren): ReactElement => <h1>{children}</h1>,
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
	useRoles: vi.fn(),
	useSession: vi.fn(),
}));

const mockedUseSession = vi.mocked(useSession);
const mockedUseRoles = vi.mocked(useRoles);

describe("DashboardPage", () => {
	it("shows the current user profile plus workspace and RP application lists", () => {
		mockedUseQuery
			.mockReturnValueOnce({
				data: {
					abbreviation: "HC",
					name: "Health Canada",
					uuid: "department-uuid-1",
				},
				error: null,
				isLoading: false,
			})
			.mockReturnValueOnce({
				data: [
					{ name: "Health Workspace", uuid: "workspace-uuid-1" },
					{ name: "Service Workspace", uuid: "workspace-uuid-2" },
				],
				error: null,
				isLoading: false,
			})
			.mockReturnValueOnce({
				data: [
					{
						name: "Benefits Portal",
						uuid: "application-uuid-1",
						workspaceName: "Health Workspace",
						workspaceUuid: "workspace-uuid-1",
					},
					{
						name: "Claims Service",
						uuid: "application-uuid-2",
						workspaceName: "Service Workspace",
						workspaceUuid: "workspace-uuid-2",
					},
				],
				error: null,
				isLoading: false,
			});

		mockedUseSession.mockReturnValue({
			currentUser: {
				authProvider: "gc-sso",
				authSubject: "subject-123",
				departmentUuid: "department-uuid-1",
				email: "jane@example.com",
				name: "Jane Doe",
				profileImageUrl: null,
				roleUuids: ["role-uuid-1", "role-uuid-2"],
				tierUuid: null,
				uuid: "user-uuid-1",
			},
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(async () => undefined),
			refreshSession: vi.fn(async () => null),
		});
		mockedUseRoles.mockReturnValue({
			error: null,
			isLoading: false,
			itemsPerPage: 1000,
			page: 1,
			refetch: vi.fn(async () => undefined),
			response: null,
			roles: [
				{ created_at: "2024-01-01T00:00:00Z", uuid: "role-uuid-1", name: "Administrator" },
				{ created_at: "2024-01-01T00:00:00Z", uuid: "role-uuid-2", name: "Editor" },
			],
		});

		render(<DashboardPage />);

		expect(screen.getByRole("heading", { name: /dashboard/i })).toBeTruthy();
		expect(screen.getByText(/name: jane doe/i)).toBeTruthy();
		expect(screen.getByText(/email: jane@example.com/i)).toBeTruthy();
		expect(screen.getByText(/department: hc - health canada/i)).toBeTruthy();
		expect(screen.getByText(/^roles$/i)).toBeTruthy();
		expect(screen.getByText(/administrator/i)).toBeTruthy();
		expect(screen.getByText(/editor/i)).toBeTruthy();
		expect(screen.getByRole("heading", { name: /workspaces and rp applications/i })).toBeTruthy();
		expect(screen.getByRole("heading", { name: /^workspaces$/i })).toBeTruthy();
		expect(screen.getByRole("link", { name: /^health workspace$/i })).toBeTruthy();
		expect(screen.getByRole("link", { name: /^service workspace$/i })).toBeTruthy();
		expect(screen.getByRole("heading", { name: /^rp applications$/i })).toBeTruthy();
		expect(screen.getByText(/benefits portal \(health workspace\)/i)).toBeTruthy();
		expect(screen.getByText(/claims service \(service workspace\)/i)).toBeTruthy();
		expect(
			screen.getByRole("link", {
				name: /benefits portal \(health workspace\)/i,
			})
			.getAttribute("href")
		).toBe("/rp-applications/mine/application-uuid-1");
	});
});
