import { createElement, type PropsWithChildren, type ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceApplicationConfigurationPage } from "@/features/workspaces/pages/WorkspaceApplicationConfigurationPage";
import { useWorkspaceRPApplicationManagement } from "@/features/workspaces/hooks/use-workspace-rp-application-management";
import { useWorkspaceRPApplicationConfiguration } from "@/features/workspaces/hooks/use-workspace-rp-applications";
import { useSession } from "@/hooks";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: Record<string, unknown>): string =>
			key === "workspaces.rpConfigurationPageTitle"
				? `Configuration - ${String(options?.["name"] ?? "")}`
				: key,
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => vi.fn(),
	useParams: () => ({
		rpApplicationUuid: "rp-application-uuid-1",
		workspaceUuid: "workspace-uuid-1",
	}),
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		href,
	}: PropsWithChildren<{ href?: string }>): ReactElement =>
		href ? <a href={href}>{children}</a> : <button type="button">{children}</button>,
	ConfirmDialog: (): null => null,
	Grid: ({ children, tag = "div" }: PropsWithChildren<{ tag?: string }>): ReactElement =>
		createElement(tag, undefined, children),
	Heading: ({
		children,
		tag = "h1",
	}: PropsWithChildren<{ tag?: string }>): ReactElement =>
		createElement(tag, undefined, children),
	Link: ({ children, href }: PropsWithChildren<{ href: string }>): ReactElement => (
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
vi.mock("@/features/workspaces/hooks/use-workspace-rp-applications", () => ({
	useWorkspaceRPApplicationConfiguration: vi.fn(),
}));
vi.mock(
	"@/features/workspaces/hooks/use-workspace-rp-application-management",
	() => ({ useWorkspaceRPApplicationManagement: vi.fn() })
);

const configuration = {
	canadaLoginEnvironment: "staging" as const,
	offlinePublicKeyProvided: true,
	onboardingState: "draft",
	promotionStatus: null,
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
		vi.mocked(useWorkspaceRPApplicationConfiguration).mockReturnValue({
			configuration,
			error: null,
			isLoading: false,
			refetch: vi.fn(async () => null),
		});
		vi.mocked(useWorkspaceRPApplicationManagement).mockReturnValue({
			deleteRPApplication: vi.fn(),
			isDeleting: false,
			isUpdating: false,
			updateRPApplication: vi.fn(),
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

		expect(screen.getByRole("heading", { level: 1, name: "Configuration - Benefits Portal" })).toBeTruthy();
		expect(screen.getByText("workspaces.environmentStaging")).toBeTruthy();
		expect(screen.getByText("https://benefits.canada.ca")).toBeTruthy();
		expect(screen.getByText("workspaces.rpConfigurationPublicKeyProvided")).toBeTruthy();
		expect(document.body.textContent).not.toContain("BEGIN CERTIFICATE");
		expect(screen.getByRole("link", { name: "workspaces.rpConfigurationResumeAction" }).getAttribute("href")).toBe(
			"/workspaces/workspace-uuid-1/applications/rp-application-uuid-1/registration/client-and-access"
		);
		expect(screen.getByRole("link", { name: "workspaces.applicationsEditAction" })).toBeTruthy();
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
		expect(screen.queryByRole("link", { name: "workspaces.rpConfigurationResumeAction" })).toBeNull();
		expect(screen.queryByRole("link", { name: "workspaces.applicationsEditAction" })).toBeNull();
		expect(screen.queryByRole("button", { name: "workspaces.deleteApplication" })).toBeNull();
	});
});
