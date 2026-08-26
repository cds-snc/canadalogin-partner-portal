import {
	createElement,
	type PropsWithChildren,
	type ReactElement,
} from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceApplicationConfigurationPage } from "@/features/workspaces/pages/WorkspaceApplicationConfigurationPage";
import { useApplicationRPConfigurationConfiguration } from "@/features/workspaces/hooks/use-application-rp-configurations";
import { useSession } from "@/hooks";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: Record<string, unknown>): string =>
			key === "workspaces.rpConfigurationPageTitle"
				? `Configuration - ${String(options?.["name"] ?? "")}`
				: key,
	}),
}));

const routeParams = vi.hoisted(() => ({
	applicationInformationUuid: "application-information-uuid-1",
	rpApplicationUuid: "",
	rpConfigurationUuid: "rp-application-uuid-1",
	workspaceUuid: "workspace-uuid-1",
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => vi.fn(),
	useParams: () => routeParams,
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		href,
	}: PropsWithChildren<{ href?: string }>): ReactElement =>
		href ? (
			<a href={href}>{children}</a>
		) : (
			<button type="button">{children}</button>
		),
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

vi.mock("@/hooks", () => ({ useSession: vi.fn() }));
vi.mock(
	"@/features/workspaces/hooks/use-application-rp-configurations",
	() => ({
		useApplicationRPConfigurationConfiguration: vi.fn(),
	})
);
const configuration = {
	canadaLoginEnvironment: "staging" as const,
	partnerEnvironment: "Partner staging",
	offlinePublicKeyProvided: true,
	productionReviewStatus: null,
	registrationCompletedAt: null,
	registrationAnswers: {
		applicationEnvironmentUrlEn: "https://benefits.canada.ca",
		applicationEnvironmentUrlFr: "https://prestations.canada.ca",
		offlineJwkOrCertificate: null,
		redirectUris: ["https://benefits.canada.ca/callback"],
		serviceNameEn: "Benefits Portal",
		serviceNameFr: "Portail des prestations",
	},
	registrationDraftVersion: 4,
	registrationLastCompletedStep: "endpoints" as const,
	rpApplicationUuid: "rp-application-uuid-1",
	serviceNameEn: "Benefits Portal",
	serviceNameFr: "Portail des prestations",
	workspaceUuid: "workspace-uuid-1",
};

describe("WorkspaceApplicationConfigurationPage", () => {
	beforeEach(() => {
		routeParams.applicationInformationUuid = "application-information-uuid-1";
		routeParams.rpApplicationUuid = "";
		routeParams.rpConfigurationUuid = "rp-application-uuid-1";
		vi.mocked(useApplicationRPConfigurationConfiguration).mockReturnValue({
			configuration: {
				...configuration,
				applicationInformationUuid: "application-information-uuid-1",
				configurationName: "Benefits Portal",
			},
			error: null,
			isLoading: false,
			refetch: vi.fn(async () => null),
		});
	});

	it("renders portal-owned configuration and a safe public-key presence summary", () => {
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

		render(<WorkspaceApplicationConfigurationPage />);

		expect(
			screen.getByRole("heading", {
				level: 1,
				name: "Configuration - Benefits Portal",
			})
		).toBeTruthy();
		expect(screen.getByText("workspaces.environmentStaging")).toBeTruthy();
		expect(screen.getByText("Partner staging")).toBeTruthy();
		expect(screen.getByText("https://benefits.canada.ca")).toBeTruthy();
		expect(
			screen.getByText("workspaces.rpConfigurationPublicKeyProvided")
		).toBeTruthy();
		expect(document.body.textContent).not.toContain("BEGIN CERTIFICATE");
		expect(
			screen
				.getByRole("link", { name: "workspaces.rpConfigurationResumeAction" })
				.getAttribute("href")
		).toBe(
			"/workspaces/workspace-uuid-1/applications/application-information-uuid-1/rp-configurations/rp-application-uuid-1/registration/client-and-access"
		);
	});

	it("localizes a missing retained Partner environment without blocking the view", () => {
		vi.mocked(useApplicationRPConfigurationConfiguration).mockReturnValue({
			configuration: {
				...configuration,
				applicationInformationUuid: "application-information-uuid-1",
				configurationName: "Retained configuration",
				partnerEnvironment: null,
			},
			error: null,
			isLoading: false,
			refetch: vi.fn(async () => null),
		});
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

		render(<WorkspaceApplicationConfigurationPage />);

		expect(screen.getByText("common.notProvided")).toBeTruthy();
		expect(
			screen.queryByRole("link", {
				name: "workspaces.rpConfigurationResumeAction",
			})
		).toBeNull();
	});

	it("keeps the same configuration read-only for Read Only", () => {
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

		render(<WorkspaceApplicationConfigurationPage />);

		expect(screen.getByText("https://benefits.canada.ca")).toBeTruthy();
		expect(
			screen.queryByRole("link", {
				name: "workspaces.rpConfigurationResumeAction",
			})
		).toBeNull();
	});

	it("renders the nested Configuration view with Application ancestry", () => {
		routeParams.applicationInformationUuid = "application-information-uuid-1";
		routeParams.rpApplicationUuid = "";
		routeParams.rpConfigurationUuid = "rp-application-uuid-1";
		vi.mocked(useApplicationRPConfigurationConfiguration).mockReturnValue({
			configuration: {
				...configuration,
				applicationInformationUuid: "application-information-uuid-1",
				configurationName: "Partner staging A",
			},
			error: null,
			isLoading: false,
			refetch: vi.fn(async () => null),
		});
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

		render(<WorkspaceApplicationConfigurationPage />);

		expect(
			screen.getByRole("heading", {
				level: 1,
				name: "Configuration - Partner staging A",
			})
		).toBeTruthy();
		expect(
			screen
				.getByRole("link", { name: "workspaces.manageApplicationInformation" })
				.getAttribute("href")
		).toBe(
			"/workspaces/workspace-uuid-1/applications/application-information-uuid-1"
		);
		expect(
			screen.queryByRole("link", { name: "workspaces.applicationsEditAction" })
		).toBeNull();
		expect(
			screen.queryByRole("button", { name: "workspaces.deleteApplication" })
		).toBeNull();
	});
});
