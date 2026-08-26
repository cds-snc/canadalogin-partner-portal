import type { PropsWithChildren, ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useApplicationInformationContacts } from "@/features/workspaces/hooks/use-application-information-contacts";
import { useApplicationRPConfigurations } from "@/features/workspaces/hooks/use-application-rp-configurations";
import { useWorkspaceApplicationInformation } from "@/features/workspaces/hooks/use-workspace-application-information";
import { ApplicationInformationDetailPage } from "@/features/workspaces/pages/ApplicationInformationDetailPage";
import { useSession } from "@/hooks";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		i18n: { resolvedLanguage: "en" },
		t: (key: string): string => {
			const translations: Record<string, string> = {
				"workspaces.appInfoContacts": "Application contacts",
				"workspaces.appInfoContactsConfirmationCountLabel":
					"Contacts requiring identity confirmation",
				"workspaces.appInfoContactsCountLabel": "Contact records",
				"workspaces.appInfoContactsManagementHint":
					"Manage application contacts on their dedicated page.",
				"workspaces.appInfoHubDetailsDescription": "Review full details.",
				"workspaces.appInfoHubDetailsTitle": "Application details",
				"workspaces.appInfoHubOverviewTitle": "Application summary",
				"workspaces.appInfoHubChecklistDescription":
					"Review checklist and evidence.",
				"workspaces.appInfoHubRpConfigurationsDescription":
					"Review named RP configurations.",
				"workspaces.appInfoHubSummary":
					"Review important status and choose a focused area.",
				"workspaces.appInfoHubTasksTitle": "Application tasks",
				"workspaces.appInfoChecklistTitle": "Checklist and evidence",
				"workspaces.appInfoRpConfigurationCountLabel": "RP configurations",
				"workspaces.appInfoDelete": "Delete application",
				"workspaces.appInfoManagementTitle": "Application management",
				"workspaces.rpConfigurationsTitle": "RP configurations",
				"workspaces.rpConfigurationCreateFirstAction":
					"Create first RP configuration",
				"workspaces.rpConfigurationCreateFirstDescription":
					"Start the first configuration.",
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useParams: () => ({
		applicationInformationUuid: "application-information-uuid-1",
		workspaceUuid: "workspace-uuid-1",
	}),
	useSearch: () => ({}),
}));

vi.mock("@/components/ui", () => ({
	Card: ({
		cardTitle,
		description,
		href,
	}: {
		cardTitle: string;
		description: string;
		href: string;
	}): ReactElement => (
		<article>
			<h3>{cardTitle}</h3>
			<p>{description}</p>
			<a href={href}>{cardTitle}</a>
		</article>
	),
	Grid: ({ children }: PropsWithChildren): ReactElement => (
		<div>{children}</div>
	),
	Link: ({
		children,
		href,
	}: PropsWithChildren<{ href: string }>): ReactElement => (
		<a href={href}>{children}</a>
	),
	Heading: ({
		children,
		tag = "h2",
	}: PropsWithChildren<{ tag?: "h1" | "h2" | "h3" }>): ReactElement => {
		const Tag = tag;
		return <Tag>{children}</Tag>;
	},
	Notice: ({ children }: PropsWithChildren): ReactElement => (
		<section>{children}</section>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock(
	"@/features/workspaces/hooks/use-application-information-contacts",
	() => ({
		useApplicationInformationContacts: vi.fn(),
	})
);

vi.mock(
	"@/features/workspaces/hooks/use-application-rp-configurations",
	() => ({
		useApplicationRPConfigurations: vi.fn(),
	})
);

vi.mock(
	"@/features/workspaces/hooks/use-workspace-application-information",
	() => ({
		useWorkspaceApplicationInformation: vi.fn(),
	})
);

vi.mock("@/hooks", () => ({ useSession: vi.fn() }));

const applicationInformation = {
	createdAt: "2026-08-13T00:00:00Z",
	createdBy: 42,
	deletedAt: null,
	id: 17,
	isDeleted: false,
	migrationOrTransitionPlan: "Plan",
	overview: "A concise service overview.",
	securityAndPrivacy: "Protected B",
	serviceNameEn: "Example service",
	serviceNameFr: "Service exemple",
	technologyAndProtocol: "OIDC",
	updatedAt: null,
	usage: "Usage",
	uuid: "application-information-uuid-1",
	workspaceId: 9,
};

const contact = {
	applicationInformationId: 17,
	createdAt: "2026-08-13T00:00:00Z",
	createdBy: 42,
	deletedAt: null,
	email: "jane.doe@example.gc.ca",
	firstName: "Jane",
	id: 3,
	identityConfirmationRequired: false,
	isDeleted: false,
	lastName: "Doe",
	nameEn: null,
	nameFr: null,
	phoneNumber: null,
	responsibilityEn: "Product owner",
	responsibilityFr: "Responsable du produit",
	updatedAt: null,
	uuid: "contact-uuid-1",
};

describe("ApplicationInformationDetailPage", () => {
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
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(() => Promise.resolve()),
			refreshSession: vi.fn(() => Promise.resolve(null)),
		});
		vi.mocked(useWorkspaceApplicationInformation).mockReturnValue({
			applicationInformation,
			error: null,
			isLoading: false,
			refetch: vi.fn(() => Promise.resolve()),
		});
		vi.mocked(useApplicationInformationContacts).mockReturnValue({
			addContact: vi.fn(),
			contacts: [contact],
			error: null,
			isAdding: false,
			isDeleting: false,
			isLoading: false,
			isUpdating: false,
			refetch: vi.fn(() => Promise.resolve()),
			removeContact: vi.fn(),
			updateContact: vi.fn(),
		});
		vi.mocked(useApplicationRPConfigurations).mockReturnValue({
			configurations: [
				{ uuid: "configuration-1" },
				{ uuid: "configuration-2" },
			] as never,
			error: null,
			isLoading: false,
			refetch: vi.fn(() => Promise.resolve()),
		});
	});

	it("renders a compact summary and focused task destinations", () => {
		render(<ApplicationInformationDetailPage />);

		expect(
			screen.getByRole("heading", { level: 1, name: "Example service" })
		).toBeTruthy();
		expect(screen.getByText("A concise service overview.")).toBeTruthy();
		expect(screen.getByText("Contact records")).toBeTruthy();
		expect(
			screen.getByText("Contacts requiring identity confirmation")
		).toBeTruthy();
		expect(
			screen
				.getByRole("link", { name: "Application details" })
				.getAttribute("href")
		).toContain("/details");
		expect(
			screen
				.getByRole("link", { name: "Checklist and evidence" })
				.getAttribute("href")
		).toContain("/checklist-and-evidence");
		expect(
			screen
				.getByRole("link", { name: "Application contacts" })
				.getAttribute("href")
		).toContain("/contacts");
		expect(
			screen
				.getByRole("link", { name: "RP configurations" })
				.getAttribute("href")
		).toContain("/rp-configurations");
		const rpCountLabel = screen
			.getAllByText("RP configurations")
			.find((element) => element.tagName === "STRONG");
		expect(rpCountLabel?.closest("dt")?.nextElementSibling?.textContent).toBe(
			"2"
		);
		expect(
			screen
				.getByRole("link", { name: "Delete application" })
				.getAttribute("href")
		).toContain("/delete");
		expect(
			screen.getByRole("heading", { level: 2, name: "Application management" })
		).toBeTruthy();
		expect(screen.queryByText("Submission readiness")).toBeNull();
	});

	it("does not expose Internal review to a platform reviewer", () => {
		vi.mocked(useSession).mockReturnValue({
			currentUser: {
				authorizationContext: {
					globalRole: "cl_admin",
					partnerAccess: [],
				},
			} as never,
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(() => Promise.resolve()),
			refreshSession: vi.fn(() => Promise.resolve(null)),
		});

		render(<ApplicationInformationDetailPage />);

		expect(screen.queryByRole("link", { name: "Internal review" })).toBeNull();
		expect(
			screen.queryByRole("link", { name: "Application contacts" })
		).toBeNull();
		expect(screen.queryByText("Contact records")).toBeNull();
		expect(useApplicationInformationContacts).toHaveBeenLastCalledWith(
			"workspace-uuid-1",
			"application-information-uuid-1",
			false
		);
		expect(
			screen.queryByRole("link", { name: "Delete application" })
		).toBeNull();
	});

	it("links an authorized empty Application directly to its first RP configuration", () => {
		vi.mocked(useApplicationRPConfigurations).mockReturnValue({
			configurations: [],
			error: null,
			isLoading: false,
			refetch: vi.fn(() => Promise.resolve()),
		});

		render(<ApplicationInformationDetailPage />);

		expect(
			screen
				.getByRole("link", { name: "Create first RP configuration" })
				.getAttribute("href")
		).toBe(
			"/workspaces/workspace-uuid-1/applications/application-information-uuid-1/rp-configurations/new"
		);
		expect(
			screen.queryByRole("link", { name: "RP configurations" })
		).toBeNull();
	});
});
