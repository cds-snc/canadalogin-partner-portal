import {
	createElement,
	type PropsWithChildren,
	type ReactElement,
} from "react";
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useApplicationRPConfigurations } from "@/features/workspaces/hooks/use-application-rp-configurations";
import { useWorkspaceApplicationInformation } from "@/features/workspaces/hooks/use-workspace-application-information";
import { ApplicationInformationRPConfigurationsPage } from "@/features/workspaces/pages/ApplicationInformationRPConfigurationsPage";

vi.mock("@tanstack/react-router", () => ({
	useParams: () => ({
		applicationInformationUuid: "application-information-uuid-1",
		workspaceUuid: "workspace-uuid-1",
	}),
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

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		i18n: { language: "en", resolvedLanguage: "en" },
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"workspaces.appInfoBackToApplication": "Back to application",
				"workspaces.rpConfigurationsApplicationLabel": "Application",
				"workspaces.rpConfigurationCreateAction": "Create RP configuration",
				"workspaces.rpConfigurationCreateFirstAction":
					"Create first RP configuration",
				"workspaces.rpConfigurationsEmptyBody":
					"No RP configurations have been created yet.",
				"workspaces.rpConfigurationsEmptyTitle": "No RP configurations yet",
				"workspaces.rpConfigurationsSummary":
					"Review named configurations and their status.",
				"workspaces.rpConfigurationsTitle": "RP configurations",
				"yourApplications.environmentLabel": "CanadaLogin environment",
				"yourApplications.environmentStaging": "Staging",
			};
			if (key === "workspaces.rpConfigurationsPageTitle") {
				return `RP configurations - ${String(options?.["name"] ?? "")}`;
			}
			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		href,
	}: PropsWithChildren<{ href: string }>): ReactElement => (
		<a className="primary" href={href}>
			{children}
		</a>
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
	}: PropsWithChildren<{ noticeTitle?: string }>): ReactElement => (
		<section>
			{noticeTitle ? <h2>{noticeTitle}</h2> : null}
			{children}
		</section>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock(
	"@/features/workspaces/hooks/use-application-rp-configurations",
	() => ({ useApplicationRPConfigurations: vi.fn() })
);

vi.mock(
	"@/features/workspaces/hooks/use-workspace-application-information",
	() => ({ useWorkspaceApplicationInformation: vi.fn() })
);

vi.mock(
	"@/features/rp-applications/components/RPApplicationSummaryCard",
	() => ({
		RPApplicationSummaryTable: ({
			applications,
			label,
		}: {
			applications: Array<{
				configurationName: string;
				uuid: string;
			}>;
			label: string;
		}): ReactElement => (
			<table>
				<caption>{label}</caption>
				<tbody>
					{applications.map((configuration) => (
						<tr key={configuration.uuid}>
							<th scope="row">{configuration.configurationName}</th>
						</tr>
					))}
				</tbody>
			</table>
		),
	})
);

describe("ApplicationInformationRPConfigurationsPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(useWorkspaceApplicationInformation).mockReturnValue({
			applicationInformation: {
				serviceNameEn: "Benefits Portal",
				serviceNameFr: "Portail des prestations",
			} as never,
			error: null,
			isLoading: false,
			refetch: vi.fn(() => Promise.resolve()),
		});
		vi.mocked(useApplicationRPConfigurations).mockReturnValue({
			configurations: [
				{
					applicationInformationUuid: "application-information-uuid-1",
					canadaLoginEnvironment: "staging",
					configurationName: "Partner staging A",
					productionReviewStatus: null,
					registrationCompletedAt: null,
					role: "rp_admin",
					serviceNameEn: "Benefits Portal",
					serviceNameFr: "Portail des prestations",
					uuid: "rp-configuration-uuid-1",
					workspaceName: "Benefits Workspace",
					workspaceUuid: "workspace-uuid-1",
				},
			],
			error: null,
			isLoading: false,
			refetch: vi.fn(() => Promise.resolve()),
		});
	});

	it("renders a parent-scoped semantic configuration list", () => {
		render(<ApplicationInformationRPConfigurationsPage />);

		expect(
			screen.getByRole("heading", {
				level: 1,
				name: "RP configurations - Benefits Portal",
			})
		).toBeTruthy();
		const table = screen.getByRole("table", {
			name: "RP configurations - Benefits Portal",
		});
		expect(
			within(table).getByRole("rowheader", { name: "Partner staging A" })
		).toBeTruthy();
		expect(
			screen
				.getByRole("link", { name: "Create RP configuration" })
				.getAttribute("href")
		).toBe(
			"/workspaces/workspace-uuid-1/applications/application-information-uuid-1/rp-configurations/new"
		);
		expect(
			screen
				.getByRole("link", { name: "Back to application" })
				.getAttribute("href")
		).toBe(
			"/workspaces/workspace-uuid-1/applications/application-information-uuid-1"
		);
	});

	it("renders a clear empty state", () => {
		vi.mocked(useApplicationRPConfigurations).mockReturnValue({
			configurations: [],
			error: null,
			isLoading: false,
			refetch: vi.fn(() => Promise.resolve()),
		});

		render(<ApplicationInformationRPConfigurationsPage />);

		expect(screen.getByText("No RP configurations yet")).toBeTruthy();
		expect(
			screen.getByText("No RP configurations have been created yet.")
		).toBeTruthy();
		expect(
			screen
				.getAllByRole("link", { name: "Create RP configuration" })[0]
				?.getAttribute("href")
		).toContain("/rp-configurations/new");
		expect(
			screen.getAllByRole("link", { name: "Create RP configuration" })
		).toHaveLength(2);
	});
});
