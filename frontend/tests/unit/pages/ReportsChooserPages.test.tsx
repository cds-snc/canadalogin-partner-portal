import type { PropsWithChildren, ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApplicationReportsChooserPage } from "@/features/reports/pages/ApplicationReportsChooserPage";
import { useQuery } from "@tanstack/react-query";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		i18n: { language: "en", resolvedLanguage: "en" },
		t: (key: string, values?: Record<string, string>): string =>
			values ? `${key}:${Object.values(values).join(":")}` : key,
	}),
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

describe("report chooser pages", () => {
	it("renders the server-scoped MAU destinations without browser authorization filtering", () => {
		vi.mocked(useQuery).mockReturnValue({
			data: [
				{
					applicationInformationUuid: "application-information-uuid-1",
					applicationNameEn: "Benefits app",
					applicationNameFr: "Application de prestations",
					canadaLoginEnvironment: "test",
					configurationName: "Benefits test configuration",
					partnerEnvironment: null,
					uuid: "application-uuid-1",
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
			screen.getByText(
				"reports.applicationsChooser.partnerEnvironmentContext:common.notProvided"
			)
		).toBeTruthy();
	});

	it("adds stable public references when same-environment configuration names are exact duplicates", () => {
		vi.mocked(useQuery).mockReturnValue({
			data: [
				{
					applicationInformationUuid: "application-information-uuid-1",
					applicationNameEn: "Benefits app",
					applicationNameFr: "Application de prestations",
					canadaLoginEnvironment: "staging",
					configurationName: "Partner staging",
					partnerEnvironment: "Partner staging blue",
					uuid: "12345678-aaaa-4000-8000-000000000001",
					workspaceName: "Benefits Workspace",
					workspaceUuid: "workspace-uuid-1",
				},
				{
					applicationInformationUuid: "application-information-uuid-1",
					applicationNameEn: "Benefits app",
					applicationNameFr: "Application de prestations",
					canadaLoginEnvironment: "staging",
					configurationName: "Partner staging",
					partnerEnvironment: "Partner staging blue",
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

	it("shows a recoverable error without exposing stale application results", () => {
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
