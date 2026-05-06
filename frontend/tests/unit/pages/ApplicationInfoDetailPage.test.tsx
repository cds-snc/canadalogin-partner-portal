import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApplicationInfoDetailPage } from "@/features/workspaces/pages/ApplicationInfoDetailPage";
import { useSession } from "@/features/auth/hooks/use-session";

const successToast = vi.fn();
const errorToast = vi.fn();
const mockDeleteApplicationInfo = vi.fn(
	async (_workspaceUuid: string, _applicationInfoUuid: string) => ({
		message: "application info deleted",
	})
);
const mockDeleteApplicationContact = vi.fn(
	async (
		_workspaceUuid: string,
		_applicationInfoUuid: string,
		_applicationContactUuid: string
	) => ({ message: "application contact deleted" })
);

const mockNavigate = vi.fn();
const invalidateQueries = vi.fn(async () => undefined);
const { mockedUseQuery } = vi.hoisted(() => ({
	mockedUseQuery: vi.fn(),
}));

vi.mock("react-i18next", () => ({
	useTranslation: (): {
		t: (key: string, options?: Record<string, unknown>) => string;
		i18n: { language: string };
	} => ({
		i18n: { language: "en" },
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"common.cancel": "Cancel",
				"nav.home": "Home",
				"common.notProvided": "Not provided",
				"workspaces.appInfoApplicationDescriptionLabel": "Application description",
				"workspaces.appInfoApplicationUrlLabel": "Application URL",
				"workspaces.appInfoApplicationNameLabel": "Application name",
				"workspaces.appInfoAuthenticationProtocolLabel": "Authentication protocol",
				"workspaces.appInfoConsolidatorUsedLabel": "Consolidator used",
				"workspaces.appInfoContacts": "Application contacts",
				"workspaces.appInfoContactsManagementHint": "Manage application contacts on their dedicated page.",
				"workspaces.appInfoContactsEmpty": "No application contacts yet",
				"workspaces.appInfoCreateContact": "Add contact",
				"workspaces.appInfoCurrentMfaOptionsLabel": "Current MFA options",
				"workspaces.appInfoCurrentSignInOptionsLabel": "Current sign-in options",
				"workspaces.appInfoDelete": "Delete application information",
				"workspaces.appInfoDeleteConfirmBody": `Delete ${options?.["name"] ?? ""}`,
				"workspaces.appInfoDeleteConfirmTitle": "Delete application information",
				"workspaces.appInfoDetailTitle": `Application Information - ${options?.["name"] ?? ""}`,
				"workspaces.appInfoEdit": "Edit application information",
				"workspaces.appInfoManageContacts": "Manage contacts",
				"workspaces.appInfoSectionTitle": "Application information",
				"workspaces.appInfoStepAbout": "About the application",
				"workspaces.appInfoStepSecurity": "Security",
				"workspaces.appInfoStepTechnology": "Technology",
				"workspaces.appInfoStepTransition": "For transitioning applications",
				"workspaces.appInfoStepUsage": "Usage",
				"workspaces.appInfoDeletedSuccess": "Application information deleted",
				"workspaces.appInfoAboutLabel": "About the application",
				"workspaces.appInfoAuthorityLabel": "Authority",
				"workspaces.appInfoCalLabel": "Credential assurance level",
				"workspaces.appInfoCurrentSignInOptionsOtherLabel": "Current sign-in options other",
				"workspaces.appInfoHasAccessManagementLayerLabel": "Access management layer",
				"workspaces.appInfoHasAccountRecoveryLabel": "Account recovery",
				"workspaces.appInfoHasPrivacyNoticeLabel": "Privacy notice",
				"workspaces.appInfoIalLabel": "Identity assurance level",
				"workspaces.appInfoIdentityProofingLabel": "Identity proofing",
				"workspaces.appInfoIsCbasLabel": "CBAS",
				"workspaces.appInfoMonthlyActiveUsersLabel": "Monthly active users",
				"workspaces.appInfoOtherLabel": "Other",
				"workspaces.appInfoPeakUsagePeriodsLabel": "Peak usage periods",
				"workspaces.appInfoPersonalInformationCollectedLabel": "Personal information collected",
				"workspaces.appInfoPersonalInformationOtherLabel": "Other personal information",
				"workspaces.appInfoPlannedOidcDateLabel": "Planned OIDC implementation date",
				"workspaces.appInfoPortalNameLabel": "Portal name",
				"workspaces.appInfoProgramLineOfBusinessLabel": "Program / Line of business",
				"workspaces.appInfoRequestsProfileDataPushesLabel": "Profile data pushes",
				"workspaces.appInfoRollbackStrategyLabel": "Rollback strategy",
				"workspaces.appInfoScheduleBlackoutPeriodsLabel": "Maintenance blackout periods",
				"workspaces.appInfoTechnologyLabel": "Technology",
				"workspaces.appInfoTechStackLabel": "Tech stack",
				"workspaces.appInfoTransitionMitigationsLabel": "Mitigations",
				"workspaces.appInfoTransitionRationaleLabel": "Migration rationale",
				"workspaces.appInfoTransitionRisksLabel": "Transition risks",
				"workspaces.appInfoContactDelete": "Delete contact",
				"workspaces.appInfoContactDeleteConfirmBody": `Delete contact ${options?.["name"] ?? ""}`,
				"workspaces.appInfoContactDeleteConfirmTitle": "Delete application contact",
				"workspaces.appInfoContactDeletedSuccess": "Application contact deleted",
				"workspaces.appInfoContactEdit": "Edit contact",
				"workspaces.appInfoUsesCanadaloginMigrationLabel": "Uses Canada Login migration",
				"workspaces.backToWorkspace": "Back to Workspace",
				"workspaces.delete": "Delete",
				"workspaces.department": "Department",
				"workspaces.optionAuthenticationProtocolBoth": "Both OIDC and SAML",
				"workspaces.optionConsolidatorSigninCanada": "Signin Canada",
				"workspaces.optionMfaMfaas3": "MFAaaS 3.0 (auth app, email, SMS/voice, part of GCKey)",
				"workspaces.optionSignInGcKey": "GCKey",
				"workspaces.optionSignInInteract": "Interac sign in",
				"workspaces.optionUserTypeBusinesses": "Organizations or businesses",
				"workspaces.optionUserTypePublic": "Members of the public",
				"workspaces.optionYes": "Yes",
				"workspaces.title": "Workspaces",
				"workspaces.workspaceName": "Workspace name",
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-query", () => ({
	useQuery: mockedUseQuery,
	useQueryClient: (): { invalidateQueries: typeof invalidateQueries } => ({
		invalidateQueries,
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: vi.fn(() => mockNavigate),
	useParams: vi.fn(() => ({
		applicationInfoUuid: "application-info-uuid-1",
		workspaceUuid: "workspace-uuid-1",
	})),
}));

vi.mock("@/components/layout", () => ({
	Breadcrumbs: (): ReactElement => <nav>Breadcrumbs</nav>,
	CenteredPageLayout: ({ children }: PropsWithChildren): ReactElement => <div>{children}</div>,
}));

vi.mock("@/components/ui", () => ({
	ConfirmDialog: ({ cancelLabel, confirmLabel, description, isOpen, title, onClose, onConfirm }: { cancelLabel: string; confirmLabel: string; description: string; isOpen: boolean; title: string; onClose: () => void; onConfirm: () => void }): ReactElement | null => isOpen ? <section><h2>{title}</h2><p>{description}</p><button type="button" onClick={onClose}>{cancelLabel}</button><button type="button" onClick={onConfirm}>{confirmLabel}</button></section> : null,
	Button: ({ children, onGcdsClick }: PropsWithChildren<{ onGcdsClick?: () => void }>): ReactElement => (
		<button type="button" onClick={onGcdsClick}>{children}</button>
	),
	Heading: ({ children }: PropsWithChildren): ReactElement => <h1>{children}</h1>,
	Notice: ({ children }: PropsWithChildren): ReactElement => <section>{children}</section>,
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
	DataTable: ({ rows, columns, action }: { rows?: Array<Record<string, unknown> & { uuid: string }>; columns?: Array<{ field: string; headerName: string }>; action?: Array<{ buttonLabel: string; onAction: (row: { uuid: string }) => void }>; }): ReactElement => (
		<section>
			{rows?.map((row) => (
				<div key={row.uuid}>
					{columns?.map((column) => <p key={column.field}>{String(row[column.field] ?? "")}</p>)}
				</div>
			))}
			{action?.map((item) => rows?.[0] ? <button key={item.buttonLabel} type="button" onClick={() => item.onAction(rows[0] as { uuid: string })}>{item.buttonLabel}</button> : null)}
		</section>
	),
}));

vi.mock("@/components/ui/Toast", () => ({
	useToast: () => ({ error: errorToast, success: successToast }),
}));

vi.mock("@/features/workspaces/components/ApplicationInfoModal", () => ({
	ApplicationInfoModal: ({ isOpen }: { isOpen: boolean }): ReactElement | null => isOpen ? <section>application-info-modal</section> : null,
}));

vi.mock("@/fetch/application-info", () => ({
	workspaceApplicationInfoQueryKey: (
		workspaceUuid: string
	): readonly [string, string] => ["workspace-application-info", workspaceUuid],
	deleteWorkspaceApplicationContact: (
		workspaceUuid: string,
		applicationInfoUuid: string,
		applicationContactUuid: string
	) =>
		mockDeleteApplicationContact(
			workspaceUuid,
			applicationInfoUuid,
			applicationContactUuid
		),
	deleteWorkspaceApplicationInfo: (
		workspaceUuid: string,
		applicationInfoUuid: string
	) => mockDeleteApplicationInfo(workspaceUuid, applicationInfoUuid),
	getWorkspaceApplicationContacts: vi.fn(async () => []),
	getWorkspaceApplicationInfos: vi.fn(async () => []),
}));

vi.mock("@/fetch/departments", () => ({
	getDepartmentById: vi.fn(async () => null),
}));

vi.mock("@/fetch/workspaces", () => ({
	getWorkspaces: vi.fn(async () => []),
	getWorkspaceMembers: vi.fn(async () => []),
}));

vi.mock("@/features/auth/hooks/use-session", () => ({
	useSession: vi.fn(),
}));

const mockedUseSession = vi.mocked(useSession);

describe("ApplicationInfoDetailPage", () => {
	it("shows application information and nested contacts", async () => {
		successToast.mockReset();
		errorToast.mockReset();
		mockDeleteApplicationInfo.mockClear();
		mockDeleteApplicationContact.mockClear();
		mockedUseQuery.mockImplementation(({ queryKey }: { queryKey: Array<string> }) => {
			if (queryKey[0] === "workspace") {
				return { data: { departmentId: 7, name: "Health Workspace", uuid: "workspace-uuid-1" }, isError: false, isLoading: false, error: null };
			}
			if (queryKey[0] === "workspace-application-info") {
				return {
					data: [{
						aboutApplication: "Benefits service",
						applicationDescription: "Benefits access for citizens",
						applicationName: "Benefits Portal",
						applicationUrl: "https://benefits.example.gc.ca",
						authorityToCollectPersonalInformation: "Department act",
						authenticationProtocol: "BOTH_OIDC_AND_SAML",
						consolidatorUsed: "SIGNIN_CANADA",
						credentialAssuranceLevel: "2",
						currentMfaOptions: "MFAAS_3",
						currentSignInOptions: ["GC_KEY", "INTERAC_SIGN_IN"],
						hasAccessManagementLayer: true,
						hasAccountRecovery: true,
						hasPrivacyNotice: true,
						identityAssuranceLevel: "2",
						identityProofingMethod: "EXTERNAL_ID_PROVIDER",
						isCbas: true,
						monthlyActiveUsers: 12000,
						personalInformationCollected: ["EMAIL_ADDRESS"],
						plannedOidcImplementationDate: "2026-06-01",
						portalName: "Benefits Portal Suite",
						programLineOfBusiness: "Benefits",
						requestsProfileDataPushes: false,
						rollbackStrategy: "Blue-green rollback",
						techStack: "FastAPI + React",
						technology: "Web portal",
						userTypes: ["PUBLIC", "ORGANIZATIONS_AND_BUSINESSES"],
						usesCanadaloginMigration: true,
						uuid: "application-info-uuid-1",
					}],
					isError: false,
					isLoading: false,
					error: null,
				};
			}
			if (queryKey[0] === "application-info-contacts") {
				return {
					data: [{ email: "alex@example.gc.ca", firstName: "Alex", lastName: "Martin", titleRole: "Product owner", uuid: "contact-uuid-1" }],
					isError: false,
					isLoading: false,
					error: null,
					refetch: vi.fn(async () => undefined),
				};
			}
			if (queryKey[0] === "workspace-members") {
				return { data: [{ role: "workspace_admin", userUuid: "user-uuid-1" }], isError: false, isLoading: false, error: null };
			}
			if (queryKey[0] === "department") {
				return { data: { name: "Health Canada", nameFr: "Sante Canada" }, isError: false, isLoading: false, error: null };
			}
			return { data: null, isError: false, isLoading: false, error: null };
		});

		mockedUseSession.mockReturnValue({
			currentUser: { uuid: "user-uuid-1" },
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(async () => undefined),
			refreshSession: vi.fn(async () => null),
		} as never);

		render(<ApplicationInfoDetailPage />);

		expect(screen.getByRole("heading", { name: /application information - benefits portal/i })).toBeTruthy();
		expect(screen.getByRole("button", { name: /back to workspace/i })).toBeTruthy();
		expect(screen.getByRole("button", { name: /manage contacts/i })).toBeTruthy();
		expect(screen.getByRole("heading", { name: /^about the application$/i })).toBeTruthy();
		expect(screen.getByRole("heading", { name: /^technology$/i })).toBeTruthy();
		expect(screen.getByRole("heading", { name: /^security$/i })).toBeTruthy();
		expect(screen.getByRole("heading", { name: /^usage$/i })).toBeTruthy();
		expect(screen.getByRole("heading", { name: /for transitioning applications/i })).toBeTruthy();
		const departmentLabel = screen.getAllByText(/^department$/i)[0];
		expect(departmentLabel?.nextElementSibling?.textContent).toBe(
			"Health Canada"
		);
		expect(screen.getByText(/benefits service/i)).toBeTruthy();
		expect(screen.getByText(/benefits access for citizens/i)).toBeTruthy();
		expect(screen.getByText(/both oidc and saml/i)).toBeTruthy();
		expect(screen.getByText(/signin canada/i)).toBeTruthy();
		expect(screen.getByText(/gckey, interac sign in/i)).toBeTruthy();
		expect(screen.getByText(/members of the public, organizations or businesses/i)).toBeTruthy();
			expect(screen.getByText(/benefits portal suite/i)).toBeTruthy();
			expect(screen.getByText(/fastapi \+ react/i)).toBeTruthy();
			expect(screen.queryByText(/manage application contacts on their dedicated page\./i)).toBeNull();
		expect(screen.getByRole("button", { name: /edit application information/i })).toBeTruthy();
		expect(screen.getByRole("button", { name: /delete application information/i })).toBeTruthy();

			fireEvent.click(screen.getByRole("button", { name: /manage contacts/i }));
		expect(mockNavigate).toHaveBeenCalledWith({
			params: { applicationInfoUuid: "application-info-uuid-1", workspaceUuid: "workspace-uuid-1" },
				to: "/workspaces/$workspaceUuid/application-info/$applicationInfoUuid/contacts",
		});

		fireEvent.click(screen.getByRole("button", { name: /delete application information/i }));
		const deleteButton = screen.getAllByRole("button", { name: /^delete$/i })[0];
		expect(deleteButton).toBeTruthy();
		fireEvent.click(deleteButton!);
		await waitFor(() => {
			expect(mockDeleteApplicationInfo).toHaveBeenCalledWith(
				"workspace-uuid-1",
				"application-info-uuid-1"
			);
		});
		expect(successToast).toHaveBeenCalledWith("Application information deleted");

		fireEvent.click(screen.getByRole("button", { name: /back to workspace/i }));
		expect(mockNavigate).toHaveBeenCalledWith({
			params: { workspaceUuid: "workspace-uuid-1" },
			to: "/workspaces/$workspaceUuid",
		});
	});

	it("shows a placeholder when the department lookup is unavailable", () => {
		mockedUseQuery.mockImplementation(({ queryKey }: { queryKey: Array<string> }) => {
			if (queryKey[0] === "workspace") {
				return {
					data: { departmentId: 7, name: "Health Workspace", uuid: "workspace-uuid-1" },
					isError: false,
					isLoading: false,
					error: null,
				};
			}
			if (queryKey[0] === "workspace-application-info") {
				return {
					data: [{
						aboutApplication: "Benefits service",
						applicationDescription: "Benefits access for citizens",
						applicationName: "Benefits Portal",
						applicationUrl: "https://benefits.example.gc.ca",
						authorityToCollectPersonalInformation: "Department act",
						authenticationProtocol: "BOTH_OIDC_AND_SAML",
						consolidatorUsed: "SIGNIN_CANADA",
						credentialAssuranceLevel: "2",
						currentMfaOptions: "MFAAS_3",
						currentSignInOptions: ["GC_KEY", "INTERAC_SIGN_IN"],
						hasAccessManagementLayer: true,
						hasAccountRecovery: true,
						hasPrivacyNotice: true,
						identityAssuranceLevel: "2",
						identityProofingMethod: "EXTERNAL_ID_PROVIDER",
						isCbas: true,
						monthlyActiveUsers: 12000,
						personalInformationCollected: ["EMAIL_ADDRESS"],
						plannedOidcImplementationDate: "2026-06-01",
						portalName: "Benefits Portal Suite",
						programLineOfBusiness: "Benefits",
						requestsProfileDataPushes: false,
						rollbackStrategy: "Blue-green rollback",
						techStack: "FastAPI + React",
						technology: "Web portal",
						userTypes: ["PUBLIC", "ORGANIZATIONS_AND_BUSINESSES"],
						usesCanadaloginMigration: true,
						uuid: "application-info-uuid-1",
					}],
					isError: false,
					isLoading: false,
					error: null,
				};
			}
			if (queryKey[0] === "workspace-members") {
				return { data: [], isError: false, isLoading: false, error: null };
			}
			if (queryKey[0] === "department") {
				return { data: null, isError: false, isLoading: false, error: null };
			}
			return { data: null, isError: false, isLoading: false, error: null };
		});

		mockedUseSession.mockReturnValue({
			currentUser: { uuid: "user-uuid-1" },
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(async () => undefined),
			refreshSession: vi.fn(async () => null),
		} as never);

		render(<ApplicationInfoDetailPage />);

		const departmentLabel = screen.getAllByText(/^department$/i)[0];
		expect(departmentLabel?.nextElementSibling?.textContent).toBe("-");
	});
});