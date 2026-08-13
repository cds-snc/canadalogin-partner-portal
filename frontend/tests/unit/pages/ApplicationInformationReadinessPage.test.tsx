import type { PropsWithChildren, ReactElement } from "react";
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useApplicationInformationContacts } from "@/features/workspaces/hooks/use-application-information-contacts";
import { useWorkspaceApplicationInformation } from "@/features/workspaces/hooks/use-workspace-application-information";
import { ApplicationInformationReadinessPage } from "@/features/workspaces/pages/ApplicationInformationReadinessPage";
import { useSession } from "@/hooks";

vi.mock("@tanstack/react-router", () => ({
	useParams: () => ({
		applicationInformationUuid: "application-information-uuid-1",
		workspaceUuid: "workspace-uuid-1",
	}),
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"workspaces.appInfoReadinessAttentionRequired": "Attention required",
				"workspaces.appInfoReadinessBusinessContextLabel":
					"Business and user context",
				"workspaces.appInfoReadinessBusinessContextNextStep":
					"Complete the overview and usage sections.",
				"workspaces.appInfoReadinessContactsLabel": "Contacts",
				"workspaces.appInfoReadinessContactsNextStep":
					"Add at least one complete bilingual contact record.",
				"workspaces.appInfoReadinessExternalInfoBody":
					"External guidance remains advisory.",
				"workspaces.appInfoReadinessExternalInfoTitle":
					"External production checks",
				"workspaces.appInfoReadinessMigrationPlanningLabel":
					"Migration or transition planning",
				"workspaces.appInfoReadinessSecurityPostureLabel": "Security posture",
				"workspaces.appInfoReadinessServiceIdentityLabel": "Service identity",
				"workspaces.appInfoReadinessStatusComplete": "Complete",
				"workspaces.appInfoReadinessStatusIncomplete": "Incomplete",
				"workspaces.appInfoReadinessStatusNotStarted": "Not started",
				"workspaces.appInfoReadinessTechnicalIntegrationLabel":
					"Technical integration details",
			};
			if (key === "workspaces.appInfoReadinessOverallCount") {
				return `${String(options?.["completed"])} of ${String(options?.["total"])} areas complete`;
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
		<a href={href}>{children}</a>
	),
	Details: ({
		children,
		detailsTitle,
	}: PropsWithChildren<{ detailsTitle: string }>): ReactElement => (
		<details>
			<summary>{detailsTitle}</summary>
			{children}
		</details>
	),
	Heading: ({ children }: PropsWithChildren): ReactElement => (
		<h1>{children}</h1>
	),
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
	"@/features/workspaces/hooks/use-application-information-contacts",
	() => ({ useApplicationInformationContacts: vi.fn() })
);
vi.mock(
	"@/features/workspaces/hooks/use-workspace-application-information",
	() => ({ useWorkspaceApplicationInformation: vi.fn() })
);

const applicationInformation = {
	approvedAt: null,
	createdAt: "2026-08-13T00:00:00Z",
	createdBy: 42,
	deletedAt: null,
	id: 17,
	isDeleted: false,
	launchedAt: null,
	migrationOrTransitionPlan: "Plan",
	onboardingState: "draft",
	overview: "",
	securityAndPrivacy: "Protected B",
	serviceNameEn: "Example service",
	serviceNameFr: "Service exemple",
	submittedAt: null,
	technologyAndProtocol: "OIDC",
	underReviewAt: null,
	updatedAt: null,
	usage: "",
	uuid: "application-information-uuid-1",
	workspaceId: 9,
};

describe("ApplicationInformationReadinessPage", () => {
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
		vi.mocked(useApplicationInformationContacts).mockReturnValue({
			addContact: vi.fn(),
			contacts: [],
			error: null,
			isAdding: false,
			isDeleting: false,
			isLoading: false,
			isUpdating: false,
			refetch: vi.fn(() => Promise.resolve()),
			removeContact: vi.fn(),
			updateContact: vi.fn(),
		});
	});

	it("shows one textual overall count and direct editable next steps", () => {
		const { container } = render(<ApplicationInformationReadinessPage />);

		expect(
			screen.getByText(
				(_content, element) =>
					element?.tagName === "P" &&
					element.textContent?.includes(
						"Attention required — 4 of 6 areas complete"
					) === true
			)
		).toBeTruthy();
		const items = screen.getAllByRole("listitem");
		expect(items).toHaveLength(6);
		const businessRow = items.find((item) =>
			within(item).queryByText("Business and user context")
		);
		expect(
			within(businessRow as HTMLElement)
				.getByRole("link", {
					name: "Complete the overview and usage sections.",
				})
				.getAttribute("href")
		).toContain("/details/edit");
		const contactsRow = items.find((item) =>
			within(item).queryByText("Contacts")
		);
		expect(
			within(contactsRow as HTMLElement)
				.getByRole("link", {
					name: "Add at least one complete bilingual contact record.",
				})
				.getAttribute("href")
		).toContain("/contacts");
		expect(
			screen.getByText("External production checks").closest("details")
		).toBeTruthy();
		expect(container.querySelectorAll("[data-notice='true']")).toHaveLength(0);
	});

	it("sends a read-only user to the permitted Details view", () => {
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

		render(<ApplicationInformationReadinessPage />);

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
