import type { PropsWithChildren, ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApplicationReportsChooserPage } from "@/features/reports/pages/ApplicationReportsChooserPage";
import { WorkspaceReportsChooserPage } from "@/features/reports/pages/WorkspaceReportsChooserPage";
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces";
import { useSession } from "@/hooks";
import { useQuery } from "@tanstack/react-query";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		i18n: { language: "en", resolvedLanguage: "en" },
		t: (key: string, values?: Record<string, string>): string =>
			values ? `${key}:${Object.values(values).join(":")}` : key,
	}),
}));

vi.mock("@/hooks", () => ({ useSession: vi.fn() }));
vi.mock("@/features/workspaces/hooks/use-workspaces", () => ({
	useWorkspaces: vi.fn(),
}));
vi.mock("@tanstack/react-query", () => ({ useQuery: vi.fn() }));

vi.mock("@/components/ui", () => ({
	Button: ({ children }: PropsWithChildren): ReactElement => (
		<button type="button">{children}</button>
	),
	Heading: ({
		children,
		tag,
	}: PropsWithChildren<{ tag: "h1" | "h2" }>): ReactElement =>
		tag === "h1" ? <h1>{children}</h1> : <h2>{children}</h2>,
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

const setReadOnlySession = (): void => {
	vi.mocked(useSession).mockReturnValue({
		currentUser: {
			authorizationContext: {
				globalRole: null,
				partnerAccess: [
					{ role: "read_only", workspaceUuid: "workspace-uuid-1" },
				],
			},
			uuid: "user-uuid-1",
		},
	} as never);
};

describe("report chooser pages", () => {
	it("links only workspaces in an authorized aggregate-report scope", () => {
		setReadOnlySession();
		vi.mocked(useWorkspaces).mockReturnValue({
			error: null,
			isLoading: false,
			refetch: vi.fn(),
			workspaces: [
				{
					description: "Primary workspace",
					name: "Benefits Workspace",
					uuid: "workspace-uuid-1",
				},
				{
					description: "Stale result",
					name: "Other Workspace",
					uuid: "workspace-uuid-2",
				},
			],
		} as never);

		render(<WorkspaceReportsChooserPage />);

		expect(
			screen
				.getByRole("link", { name: "Benefits Workspace" })
				.getAttribute("href")
		).toBe("/workspaces/workspace-uuid-1/reports");
		expect(screen.queryByRole("link", { name: "Other Workspace" })).toBeNull();
		expect(
			screen
				.getByRole("link", { name: "reports.backToHub" })
				.getAttribute("href")
		).toBe("/reports");
	});

	it("links only RP configurations whose API role agrees with the current scoped role", () => {
		setReadOnlySession();
		vi.mocked(useQuery).mockReturnValue({
			data: [
				{
					applicationInformationUuid: "application-information-uuid-1",
					canadaLoginEnvironment: "test",
					configurationName: "Benefits test configuration",
					partnerEnvironment: null,
					role: "read_only",
					serviceNameEn: "Benefits app",
					serviceNameFr: "Application de prestations",
					uuid: "application-uuid-1",
					workspaceName: "Benefits Workspace",
					workspaceUuid: "workspace-uuid-1",
				},
				{
					applicationInformationUuid: "application-information-uuid-1",
					canadaLoginEnvironment: "test",
					configurationName: "Stale role configuration",
					partnerEnvironment: "Partner test",
					role: "rp_admin",
					serviceNameEn: "Stale role app",
					serviceNameFr: "Application périmée",
					uuid: "application-uuid-2",
					workspaceName: "Benefits Workspace",
					workspaceUuid: "workspace-uuid-1",
				},
			],
			error: null,
			isLoading: false,
			refetch: vi.fn(),
		} as never);

		render(<ApplicationReportsChooserPage />);

		expect(
			screen
				.getByRole("link", { name: "Benefits test configuration" })
				.getAttribute("href")
		).toBe(
			"/workspaces/workspace-uuid-1/applications/application-information-uuid-1/rp-configurations/application-uuid-1/usage"
		);
		expect(
			screen.queryByRole("link", { name: "Stale role configuration" })
		).toBeNull();
		expect(
			screen.getByText(
				"reports.applicationsChooser.partnerEnvironmentContext:common.notProvided"
			)
		).toBeTruthy();
	});

	it("adds stable public references when same-environment configuration names are exact duplicates", () => {
		setReadOnlySession();
		vi.mocked(useQuery).mockReturnValue({
			data: [
				{
					applicationInformationUuid: "application-information-uuid-1",
					canadaLoginEnvironment: "staging",
					configurationName: "Partner staging",
					partnerEnvironment: "Partner staging blue",
					role: "read_only",
					serviceNameEn: "Benefits app",
					serviceNameFr: "Application de prestations",
					uuid: "12345678-aaaa-4000-8000-000000000001",
					workspaceName: "Benefits Workspace",
					workspaceUuid: "workspace-uuid-1",
				},
				{
					applicationInformationUuid: "application-information-uuid-1",
					canadaLoginEnvironment: "staging",
					configurationName: "Partner staging",
					partnerEnvironment: "Partner staging blue",
					role: "read_only",
					serviceNameEn: "Benefits app",
					serviceNameFr: "Application de prestations",
					uuid: "87654321-bbbb-4000-8000-000000000002",
					workspaceName: "Benefits Workspace",
					workspaceUuid: "workspace-uuid-1",
				},
			],
			error: null,
			isLoading: false,
			refetch: vi.fn(),
		} as never);

		render(<ApplicationReportsChooserPage />);

		expect(
			screen.getByText("reports.applicationsChooser.referenceContext:12345678")
		).toBeTruthy();
		expect(
			screen.getByText("reports.applicationsChooser.referenceContext:87654321")
		).toBeTruthy();
	});

	it("shows an empty state when no authorized workspace remains", () => {
		setReadOnlySession();
		vi.mocked(useWorkspaces).mockReturnValue({
			error: null,
			isLoading: false,
			refetch: vi.fn(),
			workspaces: [
				{
					name: "Other Workspace",
					uuid: "workspace-uuid-2",
				},
			],
		} as never);

		render(<WorkspaceReportsChooserPage />);

		expect(
			screen.getByRole("heading", {
				name: "reports.workspacesChooser.emptyTitle",
			})
		).toBeTruthy();
	});

	it("shows a recoverable error without exposing stale application results", () => {
		setReadOnlySession();
		vi.mocked(useQuery).mockReturnValue({
			data: undefined,
			error: new Error("Unavailable"),
			isLoading: false,
			refetch: vi.fn(),
		} as never);

		render(<ApplicationReportsChooserPage />);

		expect(
			screen.getByRole("heading", {
				name: "reports.applicationsChooser.errorTitle",
			})
		).toBeTruthy();
		expect(
			screen.getByRole("button", {
				name: "reports.applicationsChooser.retryAction",
			})
		).toBeTruthy();
	});
});
