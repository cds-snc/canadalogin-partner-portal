import type { PropsWithChildren, ReactElement } from "react";
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useApplicationInformationChecklist } from "@/features/workspaces/hooks/use-application-information-checklist";
import { useWorkspaceApplicationInformation } from "@/features/workspaces/hooks/use-workspace-application-information";
import { ApplicationInformationChecklistPage } from "@/features/workspaces/pages/ApplicationInformationChecklistPage";
import { useSession } from "@/hooks";

vi.mock("@tanstack/react-router", () => ({
	useParams: () => ({
		applicationInformationUuid: "application-information-uuid-1",
		workspaceUuid: "workspace-uuid-1",
	}),
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		i18n: { resolvedLanguage: "en" },
		t: (key: string): string => {
			const translations: Record<string, string> = {
				"workspaces.appInfoChecklistApplicationLabel": "Application:",
				"workspaces.appInfoChecklistBusinessContextLabel":
					"Business and user context",
				"workspaces.appInfoChecklistBusinessContextNextStep":
					"Complete the overview and usage sections.",
				"workspaces.appInfoChecklistCatsMechanismBody":
					"The evidence mechanism is still to be decided.",
				"workspaces.appInfoChecklistCatsStatusLabel": "Evidence record status:",
				"workspaces.appInfoChecklistCatsStatusPendingMechanism":
					"No CATS evidence record is configured in Partner Portal",
				"workspaces.appInfoChecklistCatsTitle": "CATS evidence",
				"workspaces.appInfoChecklistConfigurationsLink":
					"Review RP configurations and Production review tasks",
				"workspaces.appInfoChecklistContactsLabel": "Contacts",
				"workspaces.appInfoChecklistContactsLink":
					"Review Application contacts",
				"workspaces.appInfoChecklistContactsNextStep":
					"Add or confirm the Application contact records.",
				"workspaces.appInfoChecklistDetailsLink": "Review Application details",
				"workspaces.appInfoChecklistExternalProcessBody":
					"Use the approved external onboarding channel.",
				"workspaces.appInfoChecklistInputsBody":
					"Each row reports only its directly sourced input.",
				"workspaces.appInfoChecklistInputsTitle": "Required Application inputs",
				"workspaces.appInfoChecklistMigrationPlanningLabel":
					"Migration or transition planning",
				"workspaces.appInfoChecklistProcessLinksBody":
					"Use these contextual destinations.",
				"workspaces.appInfoChecklistProcessLinksTitle":
					"Onboarding process links",
				"workspaces.appInfoChecklistSecurityPostureLabel": "Security posture",
				"workspaces.appInfoChecklistServiceIdentityLabel": "Service identity",
				"workspaces.appInfoChecklistStatusAttentionRequired": "Needs attention",
				"workspaces.appInfoChecklistStatusMissing": "Missing",
				"workspaces.appInfoChecklistStatusProvided": "Provided",
				"workspaces.appInfoChecklistSummary":
					"Review inputs without overall readiness.",
				"workspaces.appInfoChecklistTechnicalIntegrationLabel":
					"Technical integration details",
				"workspaces.appInfoChecklistTitle": "Checklist and evidence",
			};
			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		href,
	}: PropsWithChildren<{ href: string }>): ReactElement => (
		<a href={href}>{children}</a>
	),
	Heading: ({
		children,
		id,
		tag = "h1",
	}: PropsWithChildren<{
		id?: string;
		tag?: "h1" | "h2" | "h3";
	}>): ReactElement => {
		const Tag = tag;
		return <Tag id={id}>{children}</Tag>;
	},
	Link: ({
		children,
		href,
	}: PropsWithChildren<{ href: string }>): ReactElement => (
		<a href={href}>{children}</a>
	),
	Notice: ({ children }: PropsWithChildren): ReactElement => (
		<section data-notice="true">{children}</section>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/hooks", () => ({ useSession: vi.fn() }));
vi.mock(
	"@/features/workspaces/hooks/use-application-information-checklist",
	() => ({ useApplicationInformationChecklist: vi.fn() })
);
vi.mock(
	"@/features/workspaces/hooks/use-workspace-application-information",
	() => ({ useWorkspaceApplicationInformation: vi.fn() })
);

const applicationInformation = {
	createdAt: "2026-08-13T00:00:00Z",
	createdBy: 42,
	deletedAt: null,
	id: 17,
	isDeleted: false,
	migrationOrTransitionPlan: "Plan",
	overview: "",
	securityAndPrivacy: "Protected B",
	serviceNameEn: "Example service",
	serviceNameFr: "Service exemple",
	technologyAndProtocol: "OIDC",
	updatedAt: null,
	usage: "",
	uuid: "application-information-uuid-1",
	workspaceId: 9,
};

describe("ApplicationInformationChecklistPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(useSession).mockReturnValue({
			currentUser: {
				authorizationContext: {
					globalRole: null,
					partnerAccess: [
						{ role: "rp_admin", workspaceUuid: "workspace-uuid-1" },
					],
				},
			} as never,
		} as never);
		vi.mocked(useWorkspaceApplicationInformation).mockReturnValue({
			applicationInformation,
			error: null,
			isLoading: false,
			refetch: vi.fn(() => Promise.resolve()),
		});
		vi.mocked(useApplicationInformationChecklist).mockReturnValue({
			checklist: {
				applicationInformationUuid: "application-information-uuid-1",
				applicationNameEn: "Example service",
				applicationNameFr: "Service exemple",
				catsEvidenceStatus: "not_configured",
				items: [
					{ key: "service_identity", status: "provided" },
					{ key: "business_context", status: "missing" },
					{ key: "technical_integration", status: "provided" },
					{ key: "security_posture", status: "provided" },
					{ key: "migration_planning", status: "provided" },
					{ key: "contacts", status: "missing" },
				],
			},
			error: null,
			isLoading: false,
			refetch: vi.fn(() => Promise.resolve()),
		});
	});

	it("shows item-level missing inputs and a mechanism-neutral CATS status", () => {
		render(<ApplicationInformationChecklistPage />);

		const checklistSection = screen
			.getByRole("heading", { name: "Required Application inputs" })
			.closest("section");
		expect(checklistSection).toBeTruthy();
		expect(
			within(checklistSection as HTMLElement).getAllByRole("listitem")
		).toHaveLength(6);
		expect(
			within(checklistSection as HTMLElement).getAllByText("Missing")
		).toHaveLength(2);
		expect(
			screen.getByText(
				"No CATS evidence record is configured in Partner Portal"
			)
		).toBeTruthy();
		expect(screen.getByText("Application: Example service")).toBeTruthy();
		expect(screen.queryByText(/areas complete/i)).toBeNull();
		expect(screen.queryByText(/submit-ready/i)).toBeNull();
		expect(
			screen
				.getByRole("link", {
					name: "Complete the overview and usage sections.",
				})
				.getAttribute("href")
		).toContain("/details/edit");
	});

	it("shows status without a contact-record destination to CL Admin", () => {
		vi.mocked(useSession).mockReturnValue({
			currentUser: {
				authorizationContext: {
					globalRole: "cl_admin",
					partnerAccess: [],
				},
			} as never,
		} as never);

		render(<ApplicationInformationChecklistPage />);

		expect(screen.getByText("Application: Example service")).toBeTruthy();
		expect(screen.getAllByText("Missing")).toHaveLength(2);
		expect(
			screen.queryByRole("link", { name: "Review Application contacts" })
		).toBeNull();
	});

	it("uses the permitted Details view for a read-only user", () => {
		vi.mocked(useSession).mockReturnValue({
			currentUser: {
				authorizationContext: {
					globalRole: null,
					partnerAccess: [
						{ role: "read_only", workspaceUuid: "workspace-uuid-1" },
					],
				},
			} as never,
		} as never);

		render(<ApplicationInformationChecklistPage />);

		expect(
			screen
				.getByRole("link", {
					name: "Complete the overview and usage sections.",
				})
				.getAttribute("href")
		).toBe(
			"/workspaces/workspace-uuid-1/applications/application-information-uuid-1/details"
		);
	});
});
