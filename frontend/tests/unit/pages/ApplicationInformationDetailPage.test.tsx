import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictRequestError } from "@/fetch";
import { ApplicationInformationDetailPage } from "@/features/workspaces/pages/ApplicationInformationDetailPage";
import { useApplicationInformationContacts } from "@/features/workspaces/hooks/use-application-information-contacts";
import { useApplicationInformationManagement } from "@/features/workspaces/hooks/use-application-information-management";
import { useWorkspaceApplicationInformation } from "@/features/workspaces/hooks/use-workspace-application-information";

const addContactMock = vi.fn(() =>
	Promise.resolve({
		applicationInformationId: 17,
		createdAt: "2026-07-30T15:15:00Z",
		createdBy: 42,
		deletedAt: null,
		email: "contact@example.gc.ca",
		id: 3,
		isDeleted: false,
		nameEn: "Jane Doe",
		nameFr: "Jeanne Doe",
		phoneNumber: "555-555-5555",
		responsibilityEn: "Product owner",
		responsibilityFr: "Responsable du produit",
		updatedAt: null,
		uuid: "contact-uuid-1",
	})
);
const updateContactMock = vi.fn(() =>
	Promise.resolve({
		applicationInformationId: 17,
		createdAt: "2026-07-30T15:15:00Z",
		createdBy: 42,
		deletedAt: null,
		email: "contact@example.gc.ca",
		id: 3,
		isDeleted: false,
		nameEn: "Jane Doe",
		nameFr: "Jeanne Doe",
		phoneNumber: "555-555-5555",
		responsibilityEn: "Updated responsibility",
		responsibilityFr: "Responsabilite mise a jour",
		updatedAt: "2026-07-30T15:20:00Z",
		uuid: "contact-uuid-1",
	})
);
const removeContactMock = vi.fn(() => Promise.resolve());
const deleteApplicationInformationMock = vi.fn(() => Promise.resolve());
const navigateMock = vi.fn(() => Promise.resolve());
let searchState: { created?: "1"; updated?: "1" } = { created: "1" };

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string, options?: Record<string, unknown>) => string } => ({
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"common.notAvailable": "Not available",
				"errors.conflictBody": "The action could not be completed because related records still need attention.",
				"errors.conflictTitle": "Resolve the conflict",
				"workspaces.appInfoBackToList": "Back to application information",
				"workspaces.appInfoContactDelete": "Delete contact",
				"workspaces.appInfoContactDeleteConfirmTitle": "Delete application contact",
				"workspaces.appInfoContactCreatedSuccess": "Application contact created successfully",
				"workspaces.appInfoContactEdit": "Edit contact",
				"workspaces.appInfoContactEmailLabel": "Email",
				"workspaces.appInfoContactModalTitle": "Add application contact",
				"workspaces.appInfoContactNameEnLabel": "Contact name (English)",
				"workspaces.appInfoContactNameFrLabel": "Contact name (French)",
				"workspaces.appInfoContactNameLabel": "Contact name",
				"workspaces.appInfoContactPhoneNumberLabel": "Phone number",
				"workspaces.appInfoContactResponsibilityEnLabel": "Responsibility (English)",
				"workspaces.appInfoContactResponsibilityFrLabel": "Responsibility (French)",
				"workspaces.appInfoContactResponsibilityLabel": "Responsibility",
				"workspaces.appInfoContactSaveAction": "Save contact",
				"workspaces.appInfoContactUpdatedSuccess": "Application contact updated successfully",
				"workspaces.appInfoContactDeletedSuccess": "Application contact deleted successfully",
				"workspaces.appInfoContacts": "Application contacts",
				"workspaces.appInfoContactsSummary": "Add, update, and remove contacts for this application information record.",
				"workspaces.appInfoCreateContact": "Create contact",
				"workspaces.appInfoCreatedSuccess": "Application information created successfully",
				"workspaces.appInfoDelete": "Delete application information",
				"workspaces.appInfoDeleteConfirmTitle": "Delete application information",
				"workspaces.appInfoDetailSummary": "Review canonical bilingual application details and manage related contacts.",
				"workspaces.appInfoEdit": "Edit application information",
				"workspaces.appInfoEditContactModalTitle": "Edit application contact",
				"workspaces.appInfoMigrationOrTransitionPlanLabel": "Migration or transition plan",
				"workspaces.appInfoOverviewLabel": "Overview",
				"workspaces.appInfoSavingContactAction": "Saving contact...",
				"workspaces.appInfoSecurityAndPrivacyLabel": "Security and privacy",
				"workspaces.appInfoSectionTitle": "Application Information",
				"workspaces.appInfoServiceNameEnLabel": "Service name (English)",
				"workspaces.appInfoServiceNameFrLabel": "Service name (French)",
				"workspaces.appInfoTechnologyAndProtocolLabel": "Technology and protocol",
				"workspaces.appInfoUsageLabel": "Usage",
				"workspaces.cancelAction": "Cancel",
			};

			if (key === "workspaces.appInfoDetailTitle") {
				return `Application information - ${String(options?.["name"] ?? "")}`;
			}

			if (key === "workspaces.appInfoDeleteConfirmBody") {
				return `Delete ${String(options?.["name"] ?? "")}`;
			}

			if (key === "workspaces.appInfoContactDeleteConfirmBody") {
				return `Delete contact ${String(options?.["name"] ?? "")}`;
			}

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: (): typeof navigateMock => navigateMock,
	useParams: (): { applicationInformationUuid: string; workspaceUuid: string } => ({
		applicationInformationUuid: "application-information-uuid-1",
		workspaceUuid: "workspace-uuid-1",
	}),
	useSearch: (): { created?: "1"; updated?: "1" } => searchState,
}));

vi.mock("@/components/ui", () => ({
	Button: ({ children, href, onGcdsClick, type }: PropsWithChildren<{ href?: string; onGcdsClick?: () => void; type: string }>): ReactElement =>
		type === "link" ? (
			<a href={href}>{children}</a>
		) : (
			<button onClick={onGcdsClick} type="button">
				{children}
			</button>
		),
	ConfirmDialog: ({ confirmLabel, description, isOpen, onClose, onConfirm, title }: { confirmLabel: string; description: string; isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string }): ReactElement | null =>
		isOpen ? (
			<section>
				<h2>{title}</h2>
				<p>{description}</p>
				<button onClick={onClose} type="button">
					Cancel
				</button>
				<button onClick={onConfirm} type="button">
					{confirmLabel}
				</button>
			</section>
		) : null,
	DataTable: ({ action, rows }: { action: Array<{ buttonLabel: string; onAction: (row: { email: string; name: string; phoneNumber: string; responsibility: string; uuid: string }) => void }>; rows: Array<{ email: string; name: string; phoneNumber: string; responsibility: string; uuid: string }> }): ReactElement => (
		<section>
			{rows.map((row) => (
				<div key={row.uuid}>
					<span>{row.name}</span>
					{action.map((item) => (
						<button key={`${row.uuid}-${item.buttonLabel}`} onClick={() => item.onAction(row)} type="button">
							{item.buttonLabel}
						</button>
					))}
				</div>
			))}
		</section>
	),
	Heading: ({ children, tag }: PropsWithChildren<{ tag?: string }>): ReactElement =>
		tag === "h2" ? <h2>{children}</h2> : tag === "h3" ? <h3>{children}</h3> : <h1>{children}</h1>,
	Input: ({ inputId, label, onInput, value }: { inputId: string; label: string; onInput?: (event: { target: { value: string } }) => void; value?: string }): ReactElement => (
		<label htmlFor={inputId}>
			<span>{label}</span>
			<input
				id={inputId}
				value={value}
				onInput={(event): void => {
					onInput?.({ target: { value: (event.target as HTMLInputElement).value } });
				}}
			/>
		</label>
	),
	Notice: ({ children, noticeTitle }: PropsWithChildren<{ noticeTitle: string }>): ReactElement => (
		<section>
			<h2>{noticeTitle}</h2>
			{children}
		</section>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/features/workspaces/hooks/use-workspace-application-information", () => ({
	useWorkspaceApplicationInformation: vi.fn(),
}));

vi.mock("@/features/workspaces/hooks/use-application-information-contacts", () => ({
	useApplicationInformationContacts: vi.fn(),
}));

vi.mock("@/features/workspaces/hooks/use-application-information-management", () => ({
	useApplicationInformationManagement: vi.fn(),
}));

describe("ApplicationInformationDetailPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		searchState = {};
	});

	it("manages contacts and deletes application information", async () => {
		searchState = { created: "1" };
		vi.mocked(useWorkspaceApplicationInformation).mockReturnValue({
			applicationInformation: {
				createdAt: "2026-07-30T15:00:00Z",
				createdBy: 42,
				deletedAt: null,
				id: 17,
				isDeleted: false,
				migrationOrTransitionPlan: "Phased transition",
				overview: "Overview text",
				securityAndPrivacy: "Protected B controls apply",
				serviceNameEn: "Example service",
				serviceNameFr: "Service exemple",
				technologyAndProtocol: "OIDC with backend mediation",
				updatedAt: null,
				usage: "Partner onboarding usage",
				uuid: "application-information-uuid-1",
				workspaceId: 9,
			},
			error: null,
			isLoading: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
		});
		vi.mocked(useApplicationInformationContacts).mockReturnValue({
			addContact: addContactMock,
			contacts: [
				{
					applicationInformationId: 17,
					createdAt: "2026-07-30T15:15:00Z",
					createdBy: 42,
					deletedAt: null,
					email: "contact@example.gc.ca",
					id: 3,
					isDeleted: false,
					nameEn: "Jane Doe",
					nameFr: "Jeanne Doe",
					phoneNumber: "555-555-5555",
					responsibilityEn: "Product owner",
					responsibilityFr: "Responsable du produit",
					updatedAt: null,
					uuid: "contact-uuid-1",
				},
			],
			error: null,
			isAdding: false,
			isDeleting: false,
			isLoading: false,
			isUpdating: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
			removeContact: removeContactMock,
			updateContact: updateContactMock,
		});
		vi.mocked(useApplicationInformationManagement).mockReturnValue({
			createApplicationInformation: vi.fn(),
			deleteApplicationInformation: deleteApplicationInformationMock,
			isCreating: false,
			isDeleting: false,
			isUpdating: false,
			updateApplicationInformation: vi.fn(),
		});

		render(<ApplicationInformationDetailPage />);

		expect(
			screen.getByRole("heading", { name: /application information created successfully/i })
		).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: /create contact/i }));
		fireEvent.input(screen.getByLabelText(/contact name \(english\)/i), {
			target: { value: "Jane Doe" },
		});
		fireEvent.input(screen.getByLabelText(/contact name \(french\)/i), {
			target: { value: "Jeanne Doe" },
		});
		fireEvent.input(screen.getByLabelText(/responsibility \(english\)/i), {
			target: { value: "Product owner" },
		});
		fireEvent.input(screen.getByLabelText(/responsibility \(french\)/i), {
			target: { value: "Responsable du produit" },
		});
		fireEvent.input(screen.getByLabelText(/^email$/i), {
			target: { value: "contact@example.gc.ca" },
		});
		fireEvent.input(screen.getByLabelText(/phone number/i), {
			target: { value: "555-555-5555" },
		});
		fireEvent.click(screen.getByRole("button", { name: /^create contact$/i }));

		await waitFor(() => {
			expect(addContactMock).toHaveBeenCalledWith({
				email: "contact@example.gc.ca",
				nameEn: "Jane Doe",
				nameFr: "Jeanne Doe",
				phoneNumber: "555-555-5555",
				responsibilityEn: "Product owner",
				responsibilityFr: "Responsable du produit",
			});
		});

		fireEvent.click(screen.getByRole("button", { name: /edit contact/i }));
		fireEvent.input(screen.getByLabelText(/responsibility \(english\)/i), {
			target: { value: "Updated responsibility" },
		});
		fireEvent.input(screen.getByLabelText(/responsibility \(french\)/i), {
			target: { value: "Responsabilite mise a jour" },
		});
		fireEvent.click(screen.getByRole("button", { name: /save contact/i }));

		await waitFor(() => {
			expect(updateContactMock).toHaveBeenCalledWith("contact-uuid-1", {
				email: "contact@example.gc.ca",
				nameEn: "Jane Doe",
				nameFr: "Jeanne Doe",
				phoneNumber: "555-555-5555",
				responsibilityEn: "Updated responsibility",
				responsibilityFr: "Responsabilite mise a jour",
			});
		});

		fireEvent.click(screen.getByRole("button", { name: /delete contact/i }));
		fireEvent.click(screen.getAllByRole("button", { name: /delete contact/i })[1]!);

		await waitFor(() => {
			expect(removeContactMock).toHaveBeenCalledWith("contact-uuid-1");
		});

		fireEvent.click(
			screen.getByRole("button", { name: /delete application information/i })
		);
		fireEvent.click(
			screen.getAllByRole("button", { name: /delete application information/i })[1]!
		);

		await waitFor(() => {
			expect(deleteApplicationInformationMock).toHaveBeenCalledWith(
				"workspace-uuid-1",
				"application-information-uuid-1"
			);
			expect(navigateMock).toHaveBeenCalledWith({
				params: { workspaceUuid: "workspace-uuid-1" },
				replace: true,
				search: { deleted: "1" },
				to: "/workspaces/$workspaceUuid/application-information",
			});
		});
	});

	it("shows the linked-application conflict detail when deletion is blocked", async () => {
		deleteApplicationInformationMock.mockRejectedValueOnce(
			new ConflictRequestError({
				detail:
					"Linked RP applications must be unlinked or removed before deleting application information",
			})
		);
		vi.mocked(useWorkspaceApplicationInformation).mockReturnValue({
			applicationInformation: {
				createdAt: "2026-07-30T15:00:00Z",
				createdBy: 42,
				deletedAt: null,
				id: 17,
				isDeleted: false,
				migrationOrTransitionPlan: "Phased transition",
				overview: "Overview text",
				securityAndPrivacy: "Protected B controls apply",
				serviceNameEn: "Example service",
				serviceNameFr: "Service exemple",
				technologyAndProtocol: "OIDC with backend mediation",
				updatedAt: null,
				usage: "Partner onboarding usage",
				uuid: "application-information-uuid-1",
				workspaceId: 9,
			},
			error: null,
			isLoading: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
		});
		vi.mocked(useApplicationInformationContacts).mockReturnValue({
			addContact: addContactMock,
			contacts: [],
			error: null,
			isAdding: false,
			isDeleting: false,
			isLoading: false,
			isUpdating: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
			removeContact: removeContactMock,
			updateContact: updateContactMock,
		});
		vi.mocked(useApplicationInformationManagement).mockReturnValue({
			createApplicationInformation: vi.fn(),
			deleteApplicationInformation: deleteApplicationInformationMock,
			isCreating: false,
			isDeleting: false,
			isUpdating: false,
			updateApplicationInformation: vi.fn(),
		});

		render(<ApplicationInformationDetailPage />);

		fireEvent.click(
			screen.getByRole("button", { name: /delete application information/i })
		);
		fireEvent.click(
			screen.getAllByRole("button", { name: /delete application information/i })[1]!
		);

		await waitFor(() => {
			expect(deleteApplicationInformationMock).toHaveBeenCalledWith(
				"workspace-uuid-1",
				"application-information-uuid-1"
			);
		});

		expect(navigateMock).not.toHaveBeenCalled();
		expect(
			screen.getByRole("heading", { name: /resolve the conflict/i })
		).toBeTruthy();
		expect(
			screen.getByText(
				/linked rp applications must be unlinked or removed before deleting application information/i
			)
		).toBeTruthy();
	});
});