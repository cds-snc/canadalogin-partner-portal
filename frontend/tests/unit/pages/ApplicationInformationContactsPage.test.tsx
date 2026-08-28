import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useApplicationInformationContacts } from "@/features/workspaces/hooks/use-application-information-contacts";
import { useWorkspaceApplicationInformation } from "@/features/workspaces/hooks/use-workspace-application-information";
import { ApplicationInformationContactsPage } from "@/features/workspaces/pages/ApplicationInformationContactsPage";
import { useSession } from "@/hooks";

const navigateMock = vi.fn(() => Promise.resolve());
const removeContactMock = vi.fn(() => Promise.resolve());

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		i18n: { resolvedLanguage: "en" },
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"common.notAvailable": "Not available",
				"workspaces.appInfoContactConfirmationComplete": "Confirmed",
				"workspaces.appInfoContactConfirmationRequired":
					"Confirmation required",
				"workspaces.appInfoContactConfirmationStatusLabel": "Identity status",
				"workspaces.appInfoContactDelete": "Delete contact",
				"workspaces.appInfoContactDeleteConfirmBody": `Delete contact ${String(options?.["name"] ?? "")}`,
				"workspaces.appInfoContactDeleteConfirmTitle":
					"Delete application contact",
				"workspaces.appInfoContactEdit": "Edit contact",
				"workspaces.appInfoContactEmailLabel": "Email",
				"workspaces.appInfoContactResponsibilityLabel": "Responsibility",
				"workspaces.appInfoContacts": "Application contacts",
				"workspaces.appInfoContactsBackToApplication": "Back to application",
				"workspaces.appInfoContactsPageTitle": `Application contacts - ${String(options?.["name"] ?? "")}`,
				"workspaces.appInfoContactsSummary":
					"Add, update, and remove contacts for this application.",
				"workspaces.appInfoCreateContact": "Create contact",
				"workspaces.appInfoErrorBody": "Contacts could not be loaded.",
				"workspaces.appInfoErrorTitle": "Unable to load contacts",
				"workspaces.appInfoNoContactsBody":
					"Add a contact for this application.",
				"workspaces.appInfoNoContactsTitle": "No contacts yet",
				"workspaces.cancelAction": "Cancel",
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => navigateMock,
	useParams: () => ({
		applicationInformationUuid: "application-information-uuid-1",
		workspaceUuid: "workspace-uuid-1",
	}),
	useSearch: () => ({}),
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		href,
		onGcdsClick,
		type,
	}: PropsWithChildren<{
		href?: string;
		onGcdsClick?: () => void;
		type?: "button" | "link";
	}>): ReactElement =>
		type === "link" ? (
			<a href={href}>{children}</a>
		) : (
			<button type="button" onClick={onGcdsClick}>
				{children}
			</button>
		),
	ConfirmDialog: ({
		cancelLabel,
		confirmLabel,
		description,
		isOpen,
		onClose,
		onConfirm,
		title,
	}: {
		cancelLabel: string;
		confirmLabel: string;
		description: string;
		isOpen: boolean;
		onClose: () => void;
		onConfirm: () => void;
		title: string;
	}): ReactElement | null =>
		isOpen ? (
			<div role="dialog" aria-label={title}>
				<p>{description}</p>
				<button type="button" onClick={onConfirm}>
					{confirmLabel}
				</button>
				<button type="button" onClick={onClose}>
					{cancelLabel}
				</button>
			</div>
		) : null,
	Heading: ({
		children,
		tag = "h2",
	}: PropsWithChildren<{ tag?: "h1" | "h2" | "h3" }>): ReactElement => {
		const Tag = tag;
		return <Tag>{children}</Tag>;
	},
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
	"@/features/workspaces/hooks/use-application-information-contacts",
	() => ({
		useApplicationInformationContacts: vi.fn(),
	})
);

vi.mock(
	"@/features/workspaces/hooks/use-workspace-application-information",
	() => ({
		useWorkspaceApplicationInformation: vi.fn(),
	})
);

vi.mock("@/hooks", () => ({
	useSession: vi.fn(),
}));

const applicationInformation = {
	createdAt: "2026-08-13T00:00:00Z",
	createdBy: 42,
	deletedAt: null,
	id: 17,
	isDeleted: false,
	migrationOrTransitionPlan: "Plan",
	overview: "Overview",
	securityAndPrivacy: "Protected B",
	serviceNameEn: "Example service",
	serviceNameFr: "Service exemple",
	technologyAndProtocol: "OIDC",
	updatedAt: null,
	usage: "Usage",
	uuid: "application-information-uuid-1",
	workspaceId: 9,
};

const legacyContact = {
	applicationInformationId: 17,
	createdAt: "2026-08-13T00:00:00Z",
	createdBy: 42,
	deletedAt: null,
	email: "jane.doe@example.gc.ca",
	firstName: null,
	id: 3,
	identityConfirmationRequired: true,
	isDeleted: false,
	lastName: null,
	nameEn: "Jane Mary Doe",
	nameFr: "Jeanne Marie Doe",
	phoneNumber: null,
	responsibilityEn: "Product owner",
	responsibilityFr: "Responsable du produit",
	updatedAt: null,
	uuid: "contact-uuid-1",
};

describe("ApplicationInformationContactsPage", () => {
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
			contacts: [legacyContact],
			error: null,
			isAdding: false,
			isDeleting: false,
			isLoading: false,
			isUpdating: false,
			refetch: vi.fn(() => Promise.resolve()),
			removeContact: removeContactMock,
			updateContact: vi.fn(),
		});
	});

	it("lists retained contacts and keeps actions inside their card", async () => {
		render(<ApplicationInformationContactsPage />);

		expect(screen.getByRole("heading", { name: "Jane Mary Doe" })).toBeTruthy();
		expect(screen.getByText("Confirmation required")).toBeTruthy();
		expect(screen.getByText("Product owner")).toBeTruthy();
		expect(
			screen.getByRole("link", { name: /create contact/i }).getAttribute("href")
		).toContain("/contacts/new");
		expect(
			screen.getByRole("link", { name: /edit contact/i }).getAttribute("href")
		).toContain("/contacts/contact-uuid-1/edit");

		fireEvent.click(screen.getByRole("button", { name: /delete contact/i }));
		fireEvent.click(
			screen.getAllByRole("button", { name: /delete contact/i })[1]!
		);

		await waitFor(() => {
			expect(removeContactMock).toHaveBeenCalledWith("contact-uuid-1");
		});
	});

	it("does not expose mutation actions to a read-only workspace member", () => {
		vi.mocked(useSession).mockReturnValue({
			currentUser: {
				authorizationContext: {
					globalRole: null,
					partnerAccess: [
						{ role: "read_only", workspaceUuid: "workspace-uuid-1" },
					],
				},
			} as never,
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(() => Promise.resolve()),
			refreshSession: vi.fn(() => Promise.resolve(null)),
		});

		render(<ApplicationInformationContactsPage />);

		expect(screen.queryByRole("link", { name: /create contact/i })).toBeNull();
		expect(screen.queryByRole("link", { name: /edit contact/i })).toBeNull();
		expect(
			screen.queryByRole("button", { name: /delete contact/i })
		).toBeNull();
	});

	it("shows a useful empty state", () => {
		vi.mocked(useApplicationInformationContacts).mockReturnValue({
			addContact: vi.fn(),
			contacts: [],
			error: null,
			isAdding: false,
			isDeleting: false,
			isLoading: false,
			isUpdating: false,
			refetch: vi.fn(() => Promise.resolve()),
			removeContact: removeContactMock,
			updateContact: vi.fn(),
		});

		render(<ApplicationInformationContactsPage />);

		expect(
			screen.getByRole("heading", { name: "No contacts yet" })
		).toBeTruthy();
		expect(
			screen.getByText("Add a contact for this application.")
		).toBeTruthy();
	});

	it("shows a request error without rendering an empty state", () => {
		vi.mocked(useApplicationInformationContacts).mockReturnValue({
			addContact: vi.fn(),
			contacts: [],
			error: new Error("request failed"),
			isAdding: false,
			isDeleting: false,
			isLoading: false,
			isUpdating: false,
			refetch: vi.fn(() => Promise.resolve()),
			removeContact: removeContactMock,
			updateContact: vi.fn(),
		});

		render(<ApplicationInformationContactsPage />);

		expect(screen.getByText("Unable to load contacts")).toBeTruthy();
		expect(screen.queryByText("No contacts yet")).toBeNull();
	});
});
