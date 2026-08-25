import {
	createElement,
	type PropsWithChildren,
	type ReactElement,
} from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApplicationRPConfigurationDetailPage } from "@/features/workspaces/pages/ApplicationRPConfigurationDetailPage";
import { useApplicationRPConfiguration } from "@/features/workspaces/hooks/use-application-rp-configurations";
import { useSession } from "@/hooks";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		i18n: { resolvedLanguage: "en" },
		t: (key: string): string => key,
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useParams: () => ({
		applicationInformationUuid: "application-information-uuid-1",
		rpConfigurationUuid: "rp-configuration-uuid-1",
		workspaceUuid: "workspace-uuid-1",
	}),
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		href,
	}: PropsWithChildren<{ href: string }>): ReactElement => (
		<a href={href}>{children}</a>
	),
	Card: ({
		cardTitle,
		href,
	}: {
		cardTitle: string;
		href: string;
	}): ReactElement => <a href={href}>{cardTitle}</a>,
	Grid: ({
		children,
		tag = "div",
	}: PropsWithChildren<{ tag?: string }>): ReactElement =>
		createElement(tag, undefined, children),
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
	Notice: ({ children }: PropsWithChildren): ReactElement => (
		<section>{children}</section>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/hooks", () => ({ useSession: vi.fn() }));
vi.mock(
	"@/features/workspaces/hooks/use-application-rp-configurations",
	() => ({
		useApplicationRPConfiguration: vi.fn(),
	})
);

describe("ApplicationRPConfigurationDetailPage", () => {
	it("links every permitted task through complete Application ancestry", () => {
		const basePath =
			"/workspaces/workspace-uuid-1/applications/application-information-uuid-1/rp-configurations/rp-configuration-uuid-1";
		vi.mocked(useSession).mockReturnValue({
			currentUser: {
				authorizationContext: {
					globalRole: null,
					partnerAccess: [
						{ role: "rp_admin", workspaceUuid: "workspace-uuid-1" },
					],
				},
			},
		} as unknown as ReturnType<typeof useSession>);
		vi.mocked(useApplicationRPConfiguration).mockReturnValue({
			configuration: {
				applicationInformationUuid: "application-information-uuid-1",
				canadaLoginEnvironment: "staging",
				configurationName: "Partner staging A",
				partnerEnvironment: null,
				onboardingState: "draft",
				promotionStatus: null,
				registrationLastCompletedStep: "basics",
				resumeTaskPath: `${basePath}/registration/endpoints`,
				role: "rp_admin",
				serviceNameEn: "Benefits Portal",
				serviceNameFr: "Portail des prestations",
				uuid: "rp-configuration-uuid-1",
				workspaceName: "Benefits Workspace",
				workspaceUuid: "workspace-uuid-1",
			},
			error: null,
			isLoading: false,
			refetch: vi.fn(async () => null),
		});

		render(<ApplicationRPConfigurationDetailPage />);

		expect(
			screen.getByRole("heading", { level: 1, name: "Partner staging A" })
		).toBeTruthy();
		expect(
			screen
				.getByRole("link", { name: "workspaces.rpOverviewConfigurationTitle" })
				.getAttribute("href")
		).toBe(`${basePath}/configuration`);
		expect(
			screen
				.getByRole("link", { name: "workspaces.rpOverviewUsageTitle" })
				.getAttribute("href")
		).toBe(`${basePath}/usage`);
		expect(
			screen
				.getByRole("link", { name: "workspaces.rpOverviewCredentialsTitle" })
				.getAttribute("href")
		).toBe(`${basePath}/manage-credentials`);
		expect(
			screen
				.getByRole("link", { name: "workspaces.applicationsAuditAction" })
				.getAttribute("href")
		).toBe(`${basePath}/audit`);
		expect(
			screen.queryByText("workspaces.rpOverviewRegistrationTitle")
		).toBeNull();
		expect(
			screen
				.getByRole("link", { name: "workspaces.rpOverviewSettingsTitle" })
				.getAttribute("href")
		).toBe(`${basePath}/settings`);
		expect(
			screen
				.getByRole("link", { name: "workspaces.rpCopyTaskTitle" })
				.getAttribute("href")
		).toBe(`${basePath}/copy`);
		expect(
			screen
				.getByRole("link", {
					name: "workspaces.rpConfigurationResumeSetupAction",
				})
				.getAttribute("href")
		).toBe(`${basePath}/registration/endpoints`);
		expect(screen.getByText("common.notProvided")).toBeTruthy();
		expect(
			screen
				.getByRole("link", {
					name: "workspaces.rpPartnerEnvironmentEditAction",
				})
				.getAttribute("href")
		).toBe(`${basePath}/partner-environment/edit`);
	});

	it("gives Read Only a configuration view without setup or mutation tasks", () => {
		vi.mocked(useSession).mockReturnValue({
			currentUser: {
				authorizationContext: {
					globalRole: null,
					partnerAccess: [
						{ role: "read_only", workspaceUuid: "workspace-uuid-1" },
					],
				},
			},
		} as unknown as ReturnType<typeof useSession>);
		vi.mocked(useApplicationRPConfiguration).mockReturnValue({
			configuration: {
				applicationInformationUuid: "application-information-uuid-1",
				canadaLoginEnvironment: "staging",
				configurationName: "Partner staging A",
				partnerEnvironment: "Partner staging",
				onboardingState: "draft",
				promotionStatus: null,
				registrationLastCompletedStep: "basics",
				resumeTaskPath:
					"/workspaces/workspace-uuid-1/applications/application-information-uuid-1/rp-configurations/rp-configuration-uuid-1/registration/endpoints",
				role: "read_only",
				serviceNameEn: "Benefits Portal",
				serviceNameFr: "Portail des prestations",
				uuid: "rp-configuration-uuid-1",
				workspaceName: "Benefits Workspace",
				workspaceUuid: "workspace-uuid-1",
			},
			error: null,
			isLoading: false,
			refetch: vi.fn(async () => null),
		});

		render(<ApplicationRPConfigurationDetailPage />);

		expect(
			screen.getByRole("link", {
				name: "workspaces.rpOverviewConfigurationTitle",
			})
		).toBeTruthy();
		expect(
			screen.queryByText("workspaces.rpOverviewRegistrationTitle")
		).toBeNull();
		expect(
			screen.queryByRole("link", {
				name: "workspaces.rpOverviewSettingsTitle",
			})
		).toBeNull();
		expect(
			screen.queryByRole("link", {
				name: "workspaces.rpPartnerEnvironmentEditAction",
			})
		).toBeNull();
		expect(
			screen.queryByRole("link", {
				name: "workspaces.rpConfigurationResumeSetupAction",
			})
		).toBeNull();
	});
});
