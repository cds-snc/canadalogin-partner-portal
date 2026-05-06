import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RPApplicationDetailPage } from "@/features/workspaces/pages/RPApplicationDetailPage";
import { useSession } from "@/features/auth/hooks/use-session";

const mockNavigate = vi.fn();
const { mockedUseQuery } = vi.hoisted(() => ({
	mockedUseQuery: vi.fn(),
}));

vi.mock("react-i18next", () => ({
	useTranslation: (): {
		i18n: { language: string };
		t: (key: string, options?: Record<string, unknown>) => string;
	} => ({
		i18n: { language: "en" },
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"common.save": "Save",
				"common.cancel": "Cancel",
				"nav.home": "Home",
				"workspaces.applicationUsageAction": "View usage",
				"workspaces.applicationClientAction": "Client",
				"workspaces.applicationClientTypeConfidentialOption": "Confidential",
				"workspaces.applicationClientTypeLabel": "Client type",
				"workspaces.applicationClientTypePublicOption": "Public",
				"workspaces.applicationCompanyNameLabel": "Company name",
				"workspaces.applicationDeletedSuccess": "Application deleted successfully",
				"workspaces.applicationDescriptionLabel": "Description",
				"workspaces.applicationId": "IBM application ID",
				"workspaces.applicationManagementTitle": `RP Application - ${options?.["name"] ?? ""}`,
				"workspaces.applicationNameLabel": "Application Name",
				"workspaces.applicationPkceDisabledOption": "PKCE disabled",
				"workspaces.applicationPkceEnabledOption": "PKCE enabled",
				"workspaces.applicationPkceLabel": "PKCE requirement",
				"workspaces.applicationRedirectUrisLabel": "Redirect URIs",
				"workspaces.applicationStatus": "Status",
				"workspaces.applicationSummary": "Manage RP application settings and client credentials.",
				"workspaces.applicationUrlLabel": "Application URL",
				"workspaces.applications": "RP Applications",
				"workspaces.department": "Department",
				"workspaces.workspaceName": "Workspace name",
				"workspaces.backToWorkspace": "Back to Workspace",
				"workspaces.clientCredentials": "Client Secret",
				"workspaces.delete": "Delete",
				"workspaces.deleteApplication": "Delete application",
				"workspaces.deleteApplicationConfirmBody": `Delete ${options?.["name"] ?? ""}`,
				"workspaces.deleteApplicationConfirmTitle": "Delete application",
				"workspaces.edit": "Edit",
				"workspaces.editApplication": "Edit application",
				"workspaces.inviteDeveloper": "Invite developer",
				"workspaces.inviteDeveloperBody": "Invite a developer to this RP application.",
				"workspaces.inviteDeveloperEmailLabel": "Developer email",
				"workspaces.inviteDeveloperModalTitle": "Invite RP application developer",
				"workspaces.inviteDeveloperSuccess": "Invitation sent",
				"workspaces.errorLoadingApplications": "Unable to load applications",
				"workspaces.errorLoading": "Unable to load workspaces",
				"workspaces.loading": "Loading workspace",
				"workspaces.loadingApplications": "Loading applications",
				"workspaces.workspaceTitle": `Workspace - ${options?.["name"] ?? ""}`,
				"workspaces.manageDeveloperInvitations": "Manage developer invitations",
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-query", () => ({
	useQuery: mockedUseQuery,
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: vi.fn(() => mockNavigate),
	useParams: vi.fn(() => ({
		rpApplicationUuid: "application-uuid-1",
		workspaceUuid: "workspace-uuid-1",
	})),
}));

vi.mock("@/components/layout", () => ({
	Breadcrumbs: (): ReactElement => <nav>Breadcrumbs</nav>,
	CenteredPageLayout: ({ children }: PropsWithChildren): ReactElement => (
		<div>{children}</div>
	),
}));

vi.mock("@/components/ui", () => ({
	Button: ({ buttonRole, children, onGcdsClick }: PropsWithChildren<{ buttonRole?: string; onGcdsClick?: () => void }>): ReactElement => (
		<button data-button-role={buttonRole} type="button" onClick={onGcdsClick}>
			{children}
		</button>
	),
	ConfirmDialog: ({
		confirmLabel,
		description,
		isOpen,
		title,
		onConfirm,
	}: {
		confirmLabel: string;
		description: string;
		isOpen: boolean;
		title: string;
		onConfirm: () => void;
	}): ReactElement | null =>
		isOpen ? (
			<section>
				<h2>{title}</h2>
				<p>{description}</p>
				<button type="button" onClick={onConfirm}>
					{confirmLabel}
				</button>
			</section>
		) : null,
	Heading: ({ children }: PropsWithChildren): ReactElement => <h1>{children}</h1>,
	Input: ({ label, onInput, value }: { label: string; onInput?: (event: { target: { value: string } }) => void; value?: string }): ReactElement => (
		<label>
			<span>{label}</span>
			<input
				aria-label={label}
				value={value ?? ""}
				onInput={(event) => {
					onInput?.({
						target: { value: (event.target as HTMLInputElement).value },
					});
				}}
			/>
		</label>
	),
	Modal: ({ children, footer, isOpen, title }: PropsWithChildren<{ footer?: ReactElement; isOpen: boolean; title: string }>): ReactElement | null =>
		isOpen ? (
			<section>
				<h2>{title}</h2>
				{children}
				{footer}
			</section>
		) : null,
	Notice: ({ children }: PropsWithChildren): ReactElement => <section>{children}</section>,
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/components/ui/Toast", () => ({
	useToast: () => ({
		error: vi.fn(),
		success: vi.fn(),
	}),
}));

vi.mock("@/features/workspaces/components/WorkspaceApplicationModal", () => ({
	WorkspaceApplicationModal: ({
		application,
		isOpen,
		mode,
	}: {
		application: { name: string } | null;
		isOpen: boolean;
		mode: string | null;
	}): ReactElement | null =>
		isOpen ? <section>{`${mode}:${application?.name ?? ""}`}</section> : null,
}));

vi.mock("@/features/workspaces/components/WorkspaceClientCredentialsModal", () => ({
	WorkspaceClientCredentialsModal: ({
		application,
		isOpen,
	}: {
		application: { name: string } | null;
		isOpen: boolean;
	}): ReactElement | null =>
		isOpen ? <section>{`client:${application?.name ?? ""}`}</section> : null,
}));

vi.mock("@/fetch/workspaces", () => ({
	deleteRPApplication: vi.fn(async () => undefined),
	getCurrentUserWorkspaces: vi.fn(async () => []),
	getRPApplications: vi.fn(async () => []),
	getWorkspaceMembers: vi.fn(async () => []),
	getWorkspaces: vi.fn(async () => []),
}));

vi.mock("@/fetch/departments", () => ({
	getDepartmentById: vi.fn(async () => null),
}));

vi.mock("@/features/auth/hooks/use-session", () => ({
	useSession: vi.fn(),
}));

const mockedUseSession = vi.mocked(useSession);

describe("RPApplicationDetailPage", () => {
	it("shows editable RP application fields and routes to usage without a full page reload", () => {
		mockedUseQuery.mockImplementation(
			({ queryKey }: { queryKey: Array<string> }) => {
				if (queryKey[0] === "workspace") {
					return {
						data: {
							created_at: "2026-04-08T00:00:00Z",
							created_by: 1,
							departmentId: 7,
							description: null,
							id: 1,
							is_deleted: false,
							name: "Health Workspace",
							slug: "health-workspace",
							updated_at: null,
							uuid: "workspace-uuid-1",
						},
						error: null,
						isError: false,
						isLoading: false,
					};
				}

				if (queryKey[0] === "workspace-applications") {
					return {
						data: [
							{
								ibm_sv_application_id: "ibm-app-1",
								name: "Benefits Portal",
								settings: {
									application_url: "https://benefits.example.gc.ca",
									client_type: "confidential",
									company_name: "Service Canada",
									description: "Benefits access service",
									pkce_enabled: true,
									redirect_uris: [
										"https://benefits.example.gc.ca/callback",
										"https://benefits.example.gc.ca/return",
									],
								},
								status: "active",
								uuid: "application-uuid-1",
							},
						],
						error: null,
						isError: false,
						isLoading: false,
						refetch: vi.fn(async () => undefined),
					};
				}

				if (queryKey[0] === "workspace-members") {
					return {
						data: [
							{
								role: "workspace_admin",
								userUuid: "user-uuid-1",
							},
						],
						error: null,
						isError: false,
						isLoading: false,
					};
				}

				if (queryKey[0] === "department") {
					return {
						data: {
							id: 7,
							name: "Health Canada",
							nameFr: "Sante Canada",
						},
						error: null,
						isError: false,
						isLoading: false,
					};
				}

				return {
					data: null,
					error: null,
					isError: false,
					isLoading: false,
				};
			}
		);

		mockedUseSession.mockReturnValue({
			currentUser: {
				authProvider: "gc-sso",
				authSubject: "subject-123",
				departmentUuid: "department-uuid-1",
				email: "jane@example.com",
				name: "Jane Doe",
				profileImageUrl: null,
				roleUuids: ["role-uuid-1"],
				tierUuid: null,
				uuid: "user-uuid-1",
				username: "jdoe",
			},
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(async () => undefined),
			refreshSession: vi.fn(async () => null),
		});

		render(<RPApplicationDetailPage />);

		expect(screen.getByRole("heading", { name: /rp application - benefits portal/i })).toBeTruthy();
		expect(screen.getByRole("button", { name: /back to workspace/i })).toBeTruthy();
		expect(screen.getByRole("button", { name: /view usage/i })).toBeTruthy();
		expect(screen.getByText(/^workspace name$/i)).toBeTruthy();
		expect(screen.getByText(/^health workspace$/i)).toBeTruthy();
		expect(screen.getByText(/^department$/i)).toBeTruthy();
		expect(screen.getByText(/^health canada$/i)).toBeTruthy();
		expect(screen.getByText(/^status$/i)).toBeTruthy();
		expect(screen.getByText(/^active$/i)).toBeTruthy();
		expect(screen.getAllByText(/^application name$/i)[0]).toBeTruthy();
		expect(screen.getByText(/ibm application id/i)).toBeTruthy();
		expect(screen.getByText(/ibm-app-1/i)).toBeTruthy();
		expect(screen.getByText(/application url/i)).toBeTruthy();
		expect(
			screen.getByText(/^https:\/\/benefits\.example\.gc\.ca$/i)
		).toBeTruthy();
		expect(screen.getByText(/company name/i)).toBeTruthy();
		expect(screen.getByText(/service canada/i)).toBeTruthy();
		expect(screen.getByText(/description/i)).toBeTruthy();
		expect(screen.getByText(/benefits access service/i)).toBeTruthy();
		expect(screen.getByText(/client type/i)).toBeTruthy();
		expect(screen.getByText(/^confidential$/i)).toBeTruthy();
		expect(screen.getByText(/pkce requirement/i)).toBeTruthy();
		expect(screen.getByText(/pkce enabled/i)).toBeTruthy();
		expect(screen.getByRole("button", { name: /client secret/i })).toBeTruthy();
		expect(screen.getByText(/redirect uris/i)).toBeTruthy();
		expect(screen.getByText(/benefits\.example\.gc\.ca\/callback/i)).toBeTruthy();
		expect(screen.getByText(/benefits\.example\.gc\.ca\/return/i)).toBeTruthy();
		expect(screen.getByRole("button", { name: /edit application/i })).toBeTruthy();
		expect(screen.getByRole("button", { name: /delete application/i })).toBeTruthy();
		expect(screen.getAllByRole("button", { name: /back to workspace|view usage/i }).map((button) => button.textContent)).toEqual([
			"Back to Workspace",
			"View usage",
		]);
		expect(screen.getByRole("button", { name: /view usage/i }).getAttribute("data-button-role")).toBe("primary");

		fireEvent.click(screen.getByRole("button", { name: /client secret/i }));
		expect(screen.getByText("client:Benefits Portal")).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: /back to workspace/i }));
		expect(mockNavigate).toHaveBeenCalledWith({
			to: "/workspaces/$workspaceUuid",
			params: { workspaceUuid: "workspace-uuid-1" },
		});

		fireEvent.click(screen.getByRole("button", { name: /view usage/i }));
		expect(mockNavigate).toHaveBeenCalledWith({
			to: "/workspaces/$workspaceUuid/applications/$rpApplicationUuid/usage",
			params: {
				rpApplicationUuid: "application-uuid-1",
				workspaceUuid: "workspace-uuid-1",
			},
		});
	});

	it("navigates workspace admin to invitation management page", () => {
		mockedUseQuery.mockImplementation(
			({ queryKey }: { queryKey: Array<string> }) => {
				if (queryKey[0] === "workspace") {
					return {
						data: {
							departmentId: 7,
							id: 1,
							name: "Health Workspace",
							uuid: "workspace-uuid-1",
						},
						error: null,
						isError: false,
						isLoading: false,
					};
				}

				if (queryKey[0] === "workspace-applications") {
					return {
						data: [
							{
								name: "Benefits Portal",
								settings: { redirect_uris: [] },
								status: "active",
								uuid: "application-uuid-1",
							},
						],
						error: null,
						isError: false,
						isLoading: false,
						refetch: vi.fn(async () => undefined),
					};
				}

				if (queryKey[0] === "workspace-members") {
					return {
						data: [
							{ role: "workspace_admin", userUuid: "user-uuid-1" },
						],
						error: null,
						isError: false,
						isLoading: false,
					};
				}

				return {
					data: null,
					error: null,
					isError: false,
					isLoading: false,
				};
			}
		);

		mockedUseSession.mockReturnValue({
			currentUser: {
				email: "jane@example.com",
				name: "Jane Doe",
				uuid: "user-uuid-1",
			},
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(async () => undefined),
			refreshSession: vi.fn(async () => null),
		} as never);

		render(<RPApplicationDetailPage />);

		fireEvent.click(
			screen.getByRole("button", { name: /manage developer invitations/i })
		);

		expect(mockNavigate).toHaveBeenCalledWith({
			params: {
				rpApplicationUuid: "application-uuid-1",
				workspaceUuid: "workspace-uuid-1",
			},
			to: "/workspaces/$workspaceUuid/applications/$rpApplicationUuid/developers",
		});
	});
});