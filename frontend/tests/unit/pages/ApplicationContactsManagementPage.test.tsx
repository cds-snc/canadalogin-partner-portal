import type { PropsWithChildren, ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApplicationContactsManagementPage } from "@/features/workspaces/pages/ApplicationContactsManagementPage";

const mockNavigate = vi.fn();
const successToast = vi.fn();
const errorToast = vi.fn();

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
				"workspaces.appInfoContacts": "Application contacts",
				"workspaces.appInfoApplicationNameLabel": "Application",
				"workspaces.appInfoContactDelete": "Delete contact",
				"workspaces.appInfoContactDeleteConfirmBody": `Delete ${options?.["name"] ?? ""}`,
				"workspaces.appInfoContactDeleteConfirmTitle": "Delete contact",
				"workspaces.appInfoContactDeletedSuccess": "Application contact deleted",
				"workspaces.appInfoContactEdit": "Edit contact",
				"workspaces.appInfoContactEmailLabel": "Email",
				"workspaces.appInfoContactFirstNameLabel": "First name",
				"workspaces.appInfoContactLastNameLabel": "Last name",
				"workspaces.appInfoContactsEmpty": "No application contacts yet",
				"workspaces.appInfoCreateContact": "Add contact",
				"workspaces.backToApplication": "Back to Application",
				"workspaces.department": "Department",
				"workspaces.delete": "Delete",
				"workspaces.errorLoadingApplicationInfo": "Unable to load application information",
				"workspaces.loadingApplicationInfo": "Loading application information",
				"workspaces.title": "Workspaces",
				"workspaces.workspaceName": "Workspace",
			};

			return translations[key] ?? key;
		},
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
	CenteredPageLayout: ({ children }: PropsWithChildren): ReactElement => (
		<div>{children}</div>
	),
}));

vi.mock("@/components/ui", () => ({
	Button: ({ children, onGcdsClick }: PropsWithChildren<{ onGcdsClick?: () => void }>): ReactElement => (
		<button type="button" onClick={onGcdsClick}>
			{children}
		</button>
	),
	ConfirmDialog: ({ isOpen }: { isOpen: boolean }): ReactElement | null =>
		isOpen ? <section>confirm</section> : null,
	DataTable: ({ action, rows, title }: {
		action?: Array<{ buttonLabel: string; onAction: (row: { uuid: string }) => void }>;
		rows?: Array<Record<string, unknown> & { uuid: string }>;
		title?: string;
	}): ReactElement => (
		<section>
			{title ? <h2>{title}</h2> : null}
			{rows?.map((row) => (
				<div key={row.uuid}>{String(row["email"] ?? "")}</div>
			))}
			{action?.map((item) =>
				rows?.[0] ? (
					<button
						key={item.buttonLabel}
						type="button"
						onClick={() => item.onAction(rows[0] as { uuid: string })}
					>
						{item.buttonLabel}
					</button>
				) : null
			)}
		</section>
	),
	Heading: ({ children }: PropsWithChildren): ReactElement => <h1>{children}</h1>,
	Notice: ({ children }: PropsWithChildren): ReactElement => <section>{children}</section>,
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/components/ui/Toast", () => ({
	useToast: (): { error: typeof errorToast; success: typeof successToast } => ({
		error: errorToast,
		success: successToast,
	}),
}));

vi.mock("@/features/workspaces/components/ApplicationContactModal", () => ({
	ApplicationContactModal: ({ isOpen }: { isOpen: boolean }): ReactElement | null =>
		isOpen ? <section>application-contact-modal</section> : null,
}));

vi.mock("@/fetch/application-info", () => ({
	applicationInfoContactsQueryKey: (
		workspaceUuid: string,
		applicationInfoUuid: string
	): readonly [string, string, string] => [
		"application-info-contacts",
		workspaceUuid,
		applicationInfoUuid,
	],
	deleteWorkspaceApplicationContact: vi.fn(async () => ({ message: "deleted" })),
	getWorkspaceApplicationContacts: vi.fn(async () => [
		{
			email: "alex@example.gc.ca",
			firstName: "Alex",
			lastName: "Martin",
			titleRole: "Product owner",
			uuid: "contact-uuid-1",
		},
	]),
	getWorkspaceApplicationInfos: vi.fn(async () => [
		{
			applicationName: "Benefits Portal",
			uuid: "application-info-uuid-1",
		},
	]),
}));

vi.mock("@/fetch/departments", () => ({
	getDepartmentById: vi.fn(async () => ({ name: "Health Canada", nameFr: "Sante Canada" })),
}));

vi.mock("@/fetch/workspaces", () => ({
	getWorkspaceMembers: vi.fn(async () => [
		{ role: "workspace_admin", userUuid: "user-uuid-1" },
	]),
	getWorkspaces: vi.fn(async () => [
		{ departmentId: 7, name: "Health Workspace", uuid: "workspace-uuid-1" },
	]),
}));

vi.mock("@/features/auth/hooks/use-session", () => ({
	useSession: vi.fn(() => ({
		currentUser: { uuid: "user-uuid-1" },
		isAuthenticated: true,
		isLoading: false,
		login: vi.fn(),
		logout: vi.fn(async () => undefined),
		refreshSession: vi.fn(async () => null),
	})),
}));

const renderPage = (): void => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});

	render(
		<QueryClientProvider client={queryClient}>
			<ApplicationContactsManagementPage />
		</QueryClientProvider>
	);
};

describe("ApplicationContactsManagementPage", () => {
	it("opens create contact in a modal and labels the back action for the application", async () => {
		renderPage();

		expect(await screen.findByText("alex@example.gc.ca")).toBeTruthy();
		expect(screen.getByText(/^workspace$/i)).toBeTruthy();
		expect(screen.getAllByText(/^health workspace$/i).length).toBeGreaterThan(0);
		expect(screen.getByText(/^application$/i)).toBeTruthy();
		expect(screen.getByText(/^benefits portal$/i)).toBeTruthy();
		expect(await screen.findByText(/^health canada$/i)).toBeTruthy();
		const backButton = screen.getByRole("button", {
			name: /back to application/i,
		});
		expect(backButton).toBeTruthy();

		fireEvent.click(backButton);
		expect(mockNavigate).toHaveBeenCalledWith({
			params: {
				applicationInfoUuid: "application-info-uuid-1",
				workspaceUuid: "workspace-uuid-1",
			},
			to: "/workspaces/$workspaceUuid/application-info/$applicationInfoUuid",
		});

		mockNavigate.mockClear();
		fireEvent.click(screen.getByRole("button", { name: /add contact/i }));

		await waitFor(() => {
			expect(screen.getByText("application-contact-modal")).toBeTruthy();
		});
		expect(mockNavigate).not.toHaveBeenCalled();
	});
});