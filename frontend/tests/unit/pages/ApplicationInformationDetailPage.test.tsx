import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictRequestError } from "@/fetch";
import { ApplicationInformationDetailPage } from "@/features/workspaces/pages/ApplicationInformationDetailPage";
import { useApplicationInformationContacts } from "@/features/workspaces/hooks/use-application-information-contacts";
import { useApplicationInformationManagement } from "@/features/workspaces/hooks/use-application-information-management";
import { useApplicationInformationReview } from "@/features/workspaces/hooks/use-application-information-review";
import { useWorkspaceApplicationInformation } from "@/features/workspaces/hooks/use-workspace-application-information";
import { useSession } from "@/hooks";

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
const addReviewNoteMock = vi.fn(() =>
	Promise.resolve({
		applicationInformationId: 17,
		authorEmail: "admin@example.gc.ca",
		authorName: "CL Admin",
		authorUserUuid: "user-uuid-1",
		body: "Ready for external review once evidence is linked",
		createdAt: "2026-08-11T12:45:00Z",
		id: 4,
		updatedAt: null,
		uuid: "review-note-uuid-1",
	})
);
const saveReviewChecklistMock = vi.fn(() =>
	Promise.resolve({
		applicationInformationId: 17,
		applicationInformationStatus: "complete",
		contactsStatus: "complete",
		createdAt: "2026-08-11T12:10:00Z",
		evidenceReferenceStatus: "incomplete",
		environmentRegistrationStatus: "complete",
		id: 3,
		processLinksStatus: "complete",
		promotionMetadataStatus: "incomplete",
		rationale: "Ready for external review once evidence is linked",
		reviewDisposition: "ready_for_next_step",
		reviewedByName: "CL Admin",
		reviewedByUserUuid: "user-uuid-1",
		updatedAt: "2026-08-11T12:45:00Z",
		uuid: "review-checklist-uuid-1",
	} as const)
);
const navigateMock = vi.fn(() => Promise.resolve());
let searchState: { created?: "1"; updated?: "1" } = { created: "1" };

vi.mock("react-i18next", () => ({
	useTranslation: (): {
		t: (key: string, options?: Record<string, unknown>) => string;
	} => ({
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"workspaces.approvedAtLabel": "Approved",
				"workspaces.appInfoInternalReviewApplicationInformationLabel":
					"Application information sections",
				"workspaces.appInfoInternalReviewChecklistSaveAction":
					"Save checklist outcome",
				"workspaces.appInfoInternalReviewChecklistSavedSuccess":
					"Internal review checklist updated successfully",
				"workspaces.appInfoInternalReviewChecklistSavingAction":
					"Saving checklist outcome...",
				"workspaces.appInfoInternalReviewChecklistTitle": "Checklist outcome",
				"workspaces.appInfoInternalReviewDispositionChangesRequested":
					"Changes requested",
				"workspaces.appInfoInternalReviewDispositionLabel":
					"Review disposition",
				"workspaces.appInfoInternalReviewDispositionPending": "Pending review",
				"workspaces.appInfoInternalReviewDispositionReadyForNextStep":
					"Ready for next workflow step",
				"workspaces.appInfoInternalReviewEnvironmentRegistrationLabel":
					"Environment registration coverage",
				"workspaces.appInfoInternalReviewErrorBody":
					"Internal review details could not be loaded for this record.",
				"workspaces.appInfoInternalReviewErrorTitle":
					"Unable to load internal review details",
				"workspaces.appInfoInternalReviewEvidenceReferenceLabel":
					"External evidence reference status",
				"workspaces.appInfoInternalReviewLoadingBody":
					"Loading internal review notes and checklist outcomes.",
				"workspaces.appInfoInternalReviewLoadingTitle":
					"Loading internal review",
				"workspaces.appInfoInternalReviewNoChecklistBody":
					"No checklist outcome has been recorded yet for this application information record.",
				"workspaces.appInfoInternalReviewNoChecklistTitle":
					"No checklist outcome yet",
				"workspaces.appInfoInternalReviewNoNotesBody":
					"No internal review note has been recorded yet.",
				"workspaces.appInfoInternalReviewNoNotesTitle": "No review notes yet",
				"workspaces.appInfoInternalReviewNoteLabel": "Internal review note",
				"workspaces.appInfoInternalReviewNoteSaveAction": "Save review note",
				"workspaces.appInfoInternalReviewNoteSavedSuccess":
					"Internal review note saved successfully",
				"workspaces.appInfoInternalReviewNoteSavingAction":
					"Saving review note...",
				"workspaces.appInfoInternalReviewNotesTitle": "Review notes",
				"workspaces.appInfoInternalReviewProcessLinksLabel":
					"External process-link readiness",
				"workspaces.appInfoInternalReviewPromotionMetadataLabel":
					"Production promotion metadata",
				"workspaces.appInfoInternalReviewRationaleLabel": "Reviewer rationale",
				"workspaces.appInfoInternalReviewReadOnlyBody":
					"Checklist outcomes and notes can only be updated while this record is submitted or under review.",
				"workspaces.appInfoInternalReviewReadOnlyTitle":
					"Internal review is read-only for this lifecycle state",
				"workspaces.appInfoInternalReviewReviewedByLabel": "Reviewed by",
				"workspaces.appInfoInternalReviewSummary":
					"Record internal checklist outcomes and notes for platform-admin review on submitted and under-review records.",
				"workspaces.appInfoInternalReviewTitle": "Internal review",
				"workspaces.appInfoInternalReviewUpdatedAtLabel": "Last updated",
				"workspaces.appInfoReadinessAttentionRequired": "Attention required",
				"workspaces.appInfoReadinessBusinessContextLabel":
					"Business and user context",
				"workspaces.appInfoReadinessBusinessContextNextStep":
					"Complete the overview and usage sections.",
				"workspaces.appInfoReadinessContactsLabel": "Contacts",
				"workspaces.appInfoReadinessContactsNextStep":
					"Add at least one complete bilingual contact record.",
				"workspaces.appInfoReadinessExternalInfoBody":
					"Checklist, evidence, and review-path tracking remain advisory and are completed outside Partner Portal for MVP2.",
				"workspaces.appInfoReadinessExternalInfoTitle":
					"External production checks stay outside Partner Portal",
				"workspaces.appInfoReadinessMigrationPlanningLabel":
					"Migration or transition planning",
				"workspaces.appInfoReadinessMigrationPlanningNextStep":
					"Add the migration or transition plan.",
				"workspaces.appInfoReadinessReady": "Ready",
				"workspaces.appInfoReadinessSecurityPostureLabel": "Security posture",
				"workspaces.appInfoReadinessSecurityPostureNextStep":
					"Add the security and privacy summary.",
				"workspaces.appInfoReadinessServiceIdentityLabel": "Service identity",
				"workspaces.appInfoReadinessServiceIdentityNextStep":
					"Add both English and French service names.",
				"workspaces.appInfoReadinessStatusComplete": "Complete",
				"workspaces.appInfoReadinessStatusIncomplete": "Incomplete",
				"workspaces.appInfoReadinessStatusNotStarted": "Not started",
				"workspaces.appInfoReadinessSummaryLabel": "Submission readiness",
				"workspaces.appInfoReadinessTechnicalIntegrationLabel":
					"Technical integration details",
				"workspaces.appInfoReadinessTechnicalIntegrationNextStep":
					"Add the technology and protocol summary.",
				"workspaces.appInfoReadinessTitle": "Readiness summary",
				"workspaces.appInfoReadinessWarningBody":
					"This record can still be saved or submitted, but the section summaries below still need attention.",
				"workspaces.appInfoReadinessWarningTitle":
					"Submission readiness still needs attention",
				"common.notAvailable": "Not available",
				"errors.conflictBody":
					"The action could not be completed because related records still need attention.",
				"errors.conflictTitle": "Resolve the conflict",
				"workspaces.appInfoBackToList": "Back to application information",
				"workspaces.appInfoContactDelete": "Delete contact",
				"workspaces.appInfoContactDeleteConfirmTitle":
					"Delete application contact",
				"workspaces.appInfoContactCreatedSuccess":
					"Application contact created successfully",
				"workspaces.appInfoContactEdit": "Edit contact",
				"workspaces.appInfoContactEmailLabel": "Email",
				"workspaces.appInfoContactModalTitle": "Add application contact",
				"workspaces.appInfoContactNameEnLabel": "Contact name (English)",
				"workspaces.appInfoContactNameFrLabel": "Contact name (French)",
				"workspaces.appInfoContactNameLabel": "Contact name",
				"workspaces.appInfoContactPhoneNumberLabel": "Phone number",
				"workspaces.appInfoContactResponsibilityEnLabel":
					"Responsibility (English)",
				"workspaces.appInfoContactResponsibilityFrLabel":
					"Responsibility (French)",
				"workspaces.appInfoContactResponsibilityLabel": "Responsibility",
				"workspaces.appInfoContactSaveAction": "Save contact",
				"workspaces.appInfoContactUpdatedSuccess":
					"Application contact updated successfully",
				"workspaces.appInfoContactDeletedSuccess":
					"Application contact deleted successfully",
				"workspaces.appInfoContacts": "Application contacts",
				"workspaces.appInfoContactsSummary":
					"Add, update, and remove contacts for this application information record.",
				"workspaces.appInfoCreateContact": "Create contact",
				"workspaces.appInfoCreatedSuccess":
					"Application information created successfully",
				"workspaces.appInfoDelete": "Delete application information",
				"workspaces.appInfoDeleteConfirmTitle":
					"Delete application information",
				"workspaces.appInfoDetailSummary":
					"Review canonical bilingual application details and manage related contacts.",
				"workspaces.appInfoEdit": "Edit application information",
				"workspaces.appInfoEditContactModalTitle": "Edit application contact",
				"workspaces.launchedAtLabel": "Launched",
				"workspaces.appInfoMigrationOrTransitionPlanLabel":
					"Migration or transition plan",
				"workspaces.onboardingStateLabel": "Onboarding status",
				"workspaces.onboardingStateUnderReview": "Under review",
				"workspaces.appInfoOverviewLabel": "Overview",
				"workspaces.appInfoSavingContactAction": "Saving contact...",
				"workspaces.appInfoSecurityAndPrivacyLabel": "Security and privacy",
				"workspaces.appInfoSectionTitle": "Application Information",
				"workspaces.appInfoServiceNameEnLabel": "Service name (English)",
				"workspaces.appInfoServiceNameFrLabel": "Service name (French)",
				"workspaces.appInfoTechnologyAndProtocolLabel":
					"Technology and protocol",
				"workspaces.appInfoUsageLabel": "Usage",
				"workspaces.cancelAction": "Cancel",
				"workspaces.submittedAtLabel": "Submitted",
				"workspaces.underReviewAtLabel": "Under review",
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
	useParams: (): {
		applicationInformationUuid: string;
		workspaceUuid: string;
	} => ({
		applicationInformationUuid: "application-information-uuid-1",
		workspaceUuid: "workspace-uuid-1",
	}),
	useSearch: (): { created?: "1"; updated?: "1" } => searchState,
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		disabled,
		href,
		onGcdsClick,
		type,
	}: PropsWithChildren<{
		disabled?: boolean;
		href?: string;
		onGcdsClick?: () => void;
		type: string;
	}>): ReactElement =>
		type === "link" ? (
			<a href={href}>{children}</a>
		) : (
			<button disabled={disabled} onClick={onGcdsClick} type="button">
				{children}
			</button>
		),
	ConfirmDialog: ({
		confirmLabel,
		description,
		isOpen,
		onClose,
		onConfirm,
		title,
	}: {
		confirmLabel: string;
		description: string;
		isOpen: boolean;
		onClose: () => void;
		onConfirm: () => void;
		title: string;
	}): ReactElement | null =>
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
	DataTable: ({
		action,
		rows,
	}: {
		action: Array<{
			buttonLabel: string;
			onAction: (row: {
				email: string;
				name: string;
				phoneNumber: string;
				responsibility: string;
				uuid: string;
			}) => void;
		}>;
		rows: Array<{
			email: string;
			name: string;
			phoneNumber: string;
			responsibility: string;
			uuid: string;
		}>;
	}): ReactElement => (
		<section>
			{rows.map((row) => (
				<div key={row.uuid}>
					<span>{row.name}</span>
					{action.map((item) => (
						<button
							key={`${row.uuid}-${item.buttonLabel}`}
							onClick={() => item.onAction(row)}
							type="button"
						>
							{item.buttonLabel}
						</button>
					))}
				</div>
			))}
		</section>
	),
	Heading: ({
		children,
		tag,
	}: PropsWithChildren<{ tag?: string }>): ReactElement =>
		tag === "h2" ? (
			<h2>{children}</h2>
		) : tag === "h3" ? (
			<h3>{children}</h3>
		) : (
			<h1>{children}</h1>
		),
	Input: ({
		inputId,
		label,
		onInput,
		value,
	}: {
		inputId: string;
		label: string;
		onInput?: (event: { target: { value: string } }) => void;
		value?: string;
	}): ReactElement => (
		<label htmlFor={inputId}>
			<span>{label}</span>
			<input
				id={inputId}
				value={value}
				onInput={(event): void => {
					onInput?.({
						target: { value: (event.target as HTMLInputElement).value },
					});
				}}
			/>
		</label>
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
	Select: ({
		children,
		label,
		onInput,
		selectId,
		value,
	}: PropsWithChildren<{
		label: string;
		onInput?: (event: { target: { value: string } }) => void;
		selectId: string;
		value?: string;
	}>): ReactElement => (
		<label htmlFor={selectId}>
			<span>{label}</span>
			<select
				id={selectId}
				value={value}
				onChange={(event): void => {
					onInput?.({
						target: { value: (event.target as HTMLSelectElement).value },
					});
				}}
			>
				{children}
			</select>
		</label>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
	Textarea: ({
		label,
		onInput,
		textareaId,
		value,
	}: {
		label: string;
		onInput?: (event: { target: { value: string } }) => void;
		textareaId: string;
		value?: string;
	}): ReactElement => (
		<label htmlFor={textareaId}>
			<span>{label}</span>
			<textarea
				id={textareaId}
				value={value}
				onInput={(event): void => {
					onInput?.({
						target: { value: (event.target as HTMLTextAreaElement).value },
					});
				}}
			/>
		</label>
	),
}));

vi.mock("@/hooks", () => ({
	useSession: vi.fn(),
}));

vi.mock(
	"@/features/workspaces/hooks/use-workspace-application-information",
	() => ({
		useWorkspaceApplicationInformation: vi.fn(),
	})
);

vi.mock(
	"@/features/workspaces/hooks/use-application-information-contacts",
	() => ({
		useApplicationInformationContacts: vi.fn(),
	})
);

vi.mock(
	"@/features/workspaces/hooks/use-application-information-management",
	() => ({
		useApplicationInformationManagement: vi.fn(),
	})
);

vi.mock(
	"@/features/workspaces/hooks/use-application-information-review",
	() => ({
		useApplicationInformationReview: vi.fn(),
	})
);

describe("ApplicationInformationDetailPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		searchState = {};
		vi.mocked(useSession).mockReturnValue({
			currentUser: {
				authorizationContext: {
					globalRole: null,
					partnerAccess: [
						{ role: "rp_admin", workspaceUuid: "workspace-uuid-1" },
					],
				},
				email: "workspace-admin@example.gc.ca",
				name: "Workspace Admin",
				uuid: "user-uuid-2",
			} as never,
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(() => Promise.resolve()),
			refreshSession: vi.fn(() => Promise.resolve(null)),
		});
		vi.mocked(useApplicationInformationReview).mockReturnValue({
			addNote: addReviewNoteMock,
			checklistSummary: null,
			error: null,
			isAddingNote: false,
			isLoading: false,
			isSavingChecklist: false,
			notes: [],
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
			saveChecklistSummary: saveReviewChecklistMock,
		});
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
				onboardingState: "under_review",
				securityAndPrivacy: "Protected B controls apply",
				serviceNameEn: "Example service",
				serviceNameFr: "Service exemple",
				submittedAt: "2026-08-10T10:00:00Z",
				technologyAndProtocol: "OIDC with backend mediation",
				underReviewAt: "2026-08-11T10:00:00Z",
				updatedAt: null,
				usage: "Partner onboarding usage",
				uuid: "application-information-uuid-1",
				workspaceId: 9,
				approvedAt: null,
				launchedAt: null,
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
		expect(screen.getByText(/onboarding status: under review/i)).toBeTruthy();
		expect(screen.getByText(/submission readiness/i)).toBeTruthy();
		expect(screen.getByText(/^ready$/i)).toBeTruthy();
		expect(
			screen.getByRole("heading", {
				name: /external production checks stay outside partner portal/i,
			})
		).toBeTruthy();
		expect(
			screen.queryByRole("heading", { name: /internal review/i })
		).toBeNull();

		expect(
			screen.getByRole("heading", {
				name: /application information created successfully/i,
			})
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
		fireEvent.click(
			screen.getAllByRole("button", { name: /delete contact/i })[1]!
		);

		await waitFor(() => {
			expect(removeContactMock).toHaveBeenCalledWith("contact-uuid-1");
		});

		fireEvent.click(
			screen.getByRole("button", { name: /delete application information/i })
		);
		fireEvent.click(
			screen.getAllByRole("button", {
				name: /delete application information/i,
			})[1]!
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
				onboardingState: "submitted",
				securityAndPrivacy: "Protected B controls apply",
				serviceNameEn: "Example service",
				serviceNameFr: "Service exemple",
				submittedAt: "2026-08-10T10:00:00Z",
				technologyAndProtocol: "OIDC with backend mediation",
				underReviewAt: null,
				updatedAt: null,
				usage: "Partner onboarding usage",
				uuid: "application-information-uuid-1",
				workspaceId: 9,
				approvedAt: null,
				launchedAt: null,
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
			screen.getAllByRole("button", {
				name: /delete application information/i,
			})[1]!
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

	it("shows advisory readiness warnings when sections or contacts are incomplete", () => {
		vi.mocked(useWorkspaceApplicationInformation).mockReturnValue({
			applicationInformation: {
				createdAt: "2026-07-30T15:00:00Z",
				createdBy: 42,
				deletedAt: null,
				id: 17,
				isDeleted: false,
				migrationOrTransitionPlan: "",
				overview: "",
				onboardingState: "draft",
				securityAndPrivacy: "Protected B controls apply",
				serviceNameEn: "Example service",
				serviceNameFr: "",
				submittedAt: null,
				technologyAndProtocol: "OIDC with backend mediation",
				underReviewAt: null,
				updatedAt: null,
				usage: "Partner onboarding usage",
				uuid: "application-information-uuid-1",
				workspaceId: 9,
				approvedAt: null,
				launchedAt: null,
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

		expect(
			screen.getByRole("heading", {
				name: /submission readiness still needs attention/i,
			})
		).toBeTruthy();
		expect(
			screen.getByText(
				(_, element) =>
					element?.tagName.toLowerCase() === "p" &&
					(element.textContent?.includes("Service identity: Incomplete") ??
						false)
			)
		).toBeTruthy();
		expect(
			screen.getByText(
				(_, element) =>
					element?.tagName.toLowerCase() === "p" &&
					(element.textContent?.includes(
						"Business and user context: Incomplete"
					) ??
						false)
			)
		).toBeTruthy();
		expect(
			screen.getByText(
				(_, element) =>
					element?.tagName.toLowerCase() === "p" &&
					(element.textContent?.includes("Contacts: Not started") ?? false)
			)
		).toBeTruthy();
	});

	it("shows the internal review panel for superusers and saves notes and checklist outcomes", async () => {
		vi.mocked(useSession).mockReturnValue({
			currentUser: {
				authorizationContext: {
					globalRole: "cl_admin",
					partnerAccess: [],
				},
				email: "admin@example.gc.ca",
				name: "CL Admin",
				uuid: "user-uuid-1",
			} as never,
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(() => Promise.resolve()),
			refreshSession: vi.fn(() => Promise.resolve(null)),
		});
		vi.mocked(useWorkspaceApplicationInformation).mockReturnValue({
			applicationInformation: {
				createdAt: "2026-07-30T15:00:00Z",
				createdBy: 42,
				deletedAt: null,
				id: 17,
				isDeleted: false,
				migrationOrTransitionPlan: "Phased transition",
				overview: "Overview text",
				onboardingState: "under_review",
				securityAndPrivacy: "Protected B controls apply",
				serviceNameEn: "Example service",
				serviceNameFr: "Service exemple",
				submittedAt: "2026-08-10T10:00:00Z",
				technologyAndProtocol: "OIDC with backend mediation",
				underReviewAt: "2026-08-11T10:00:00Z",
				updatedAt: null,
				usage: "Partner onboarding usage",
				uuid: "application-information-uuid-1",
				workspaceId: 9,
				approvedAt: null,
				launchedAt: null,
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
		vi.mocked(useApplicationInformationReview).mockReturnValue({
			addNote: addReviewNoteMock,
			checklistSummary: {
				applicationInformationId: 17,
				applicationInformationStatus: "complete",
				contactsStatus: "incomplete",
				createdAt: "2026-08-11T12:10:00Z",
				evidenceReferenceStatus: "incomplete",
				environmentRegistrationStatus: "complete",
				id: 3,
				processLinksStatus: "complete",
				promotionMetadataStatus: "not_started",
				rationale: "Need evidence reference before approval",
				reviewDisposition: "changes_requested",
				reviewedByName: "CL Admin",
				reviewedByUserUuid: "user-uuid-1",
				updatedAt: "2026-08-11T12:35:00Z",
				uuid: "review-checklist-uuid-1",
			},
			error: null,
			isAddingNote: false,
			isLoading: false,
			isSavingChecklist: false,
			notes: [
				{
					applicationInformationId: 17,
					authorEmail: "admin@example.gc.ca",
					authorName: "CL Admin",
					authorUserUuid: "user-uuid-1",
					body: "Need evidence reference before approval",
					createdAt: "2026-08-11T12:35:00Z",
					id: 2,
					updatedAt: null,
					uuid: "review-note-uuid-1",
				},
			],
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
			saveChecklistSummary: saveReviewChecklistMock,
		});

		render(<ApplicationInformationDetailPage />);

		expect(
			screen.getByRole("heading", { name: /internal review/i })
		).toBeTruthy();
		expect(
			screen.getByText(/review disposition: changes requested/i)
		).toBeTruthy();
		expect(screen.getByText(/cl admin - 2026-08-11t12:35:00z/i)).toBeTruthy();

		fireEvent.change(screen.getByLabelText(/review disposition/i), {
			target: { value: "ready_for_next_step" },
		});
		fireEvent.change(screen.getByLabelText(/contacts/i), {
			target: { value: "complete" },
		});
		fireEvent.change(
			screen.getByLabelText(/external evidence reference status/i),
			{
				target: { value: "incomplete" },
			}
		);
		fireEvent.input(screen.getByLabelText(/reviewer rationale/i), {
			target: { value: "Ready for external review once evidence is linked" },
		});
		fireEvent.click(
			screen.getByRole("button", { name: /save checklist outcome/i })
		);

		await waitFor(() => {
			expect(saveReviewChecklistMock).toHaveBeenCalledWith({
				applicationInformationStatus: "complete",
				contactsStatus: "complete",
				environmentRegistrationStatus: "complete",
				evidenceReferenceStatus: "incomplete",
				processLinksStatus: "complete",
				promotionMetadataStatus: "not_started",
				rationale: "Ready for external review once evidence is linked",
				reviewDisposition: "ready_for_next_step",
			});
		});

		fireEvent.input(screen.getByLabelText(/internal review note/i), {
			target: { value: "Ready for external review once evidence is linked" },
		});
		fireEvent.click(screen.getByRole("button", { name: /save review note/i }));

		await waitFor(() => {
			expect(addReviewNoteMock).toHaveBeenCalledWith({
				body: "Ready for external review once evidence is linked",
			});
		});
	});
});
