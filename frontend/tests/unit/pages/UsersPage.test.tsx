import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UnauthorizedRequestError } from "@/fetch";
import { UsersPage } from "@/features/users/pages/UsersPage";
import { useDepartments, useRoles, useUserDepartment, useUserManagement, useUserRole } from "@/hooks";
import { ToastProvider } from "@/components/ui/Toast";

const navigate = vi.fn((options: { replace?: boolean; search?: Record<string, string>; to: string }): Promise<void> => {
	void options;

	return Promise.resolve();
});

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string, options?: Record<string, string>) => string } => ({
			t: (key: string, options?: Record<string, string>): string => {
				const translations: Record<string, string> = {
					"users.currentRoles": "Assigned roles",
					"users.department": `Department: ${options?.["value"] ?? ""}`,
					"users.departmentFilterLabel": "Filter departments",
					"users.departmentLabel": "Department",
					"users.departmentSaveAction": "Save department",
				"users.createAction": "Create user",
				"users.createTitle": "Create user",
					"users.loadingDepartmentBody": "Loading department assignment.",
				"users.editTitle": "Edit user",
				"users.email": `Email: ${options?.["value"] ?? ""}`,
				"users.loadingRoleBody": "Loading role assignment.",
					"users.manageDepartmentTitle": "Assigned department",
				"users.manageAction": "Manage user",
				"users.manageRoleTitle": "Assigned roles",
					"users.noDepartment": "No department assigned",
					"users.noRole": "No roles assigned",
					"users.addRoleAction": "Add role",
					"users.addingRoleAction": "Adding role...",
					"users.selectRole": "Select a role to add...",
				"users.profileLink": "Open profile",
				"users.provider": `Provider: ${options?.["value"] ?? ""}`,
				"users.role": `Role: ${options?.["value"] ?? ""}`,
				"users.roleLabel": "Role",
				"users.resultsSummary": `Showing ${options?.["count"] ?? "0"} users on page ${options?.["page"] ?? "1"}`,
				"users.roleSaveAction": "Save role",
				"users.summary": "Protected list of backend users.",
				"users.title": "Users",
					"users.username": `Username: ${options?.["value"] ?? ""}`,
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@gcds-core/components-react", () => ({
	GcdsBreadcrumbs: ({ children }: PropsWithChildren): ReactElement => <nav>{children}</nav>,
	GcdsBreadcrumbsItem: ({ children }: PropsWithChildren): ReactElement => <span>{children}</span>,
	GcdsHeading: ({ children }: PropsWithChildren): ReactElement => <h1>{children}</h1>,
	GcdsLink: ({ children, ...properties }: PropsWithChildren<Record<string, unknown>>): ReactElement => <a {...properties}>{children}</a>,
	GcdsNotice: ({ children, noticeTitle }: PropsWithChildren<{ noticeTitle?: string }>): ReactElement => (
		<section>
			{noticeTitle ? <h2>{noticeTitle}</h2> : null}
			{children}
		</section>
	),
	GcdsText: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/components/ui", () => ({
	Button: ({ children, onGcdsClick, type }: PropsWithChildren<{ onGcdsClick?: () => void; type?: "button" | "submit" }>): ReactElement => (
		<button type={type ?? "button"} onClick={onGcdsClick}>
			{children}
		</button>
	),
	ConfirmDialog: ({ isOpen, title }: { isOpen: boolean; title: string }): ReactElement | null => (isOpen ? <section><h2>{title}</h2></section> : null),
	DataTable: ({ action, pageNumber, primaryAction, rows, title, summary }: { action?: any; pageNumber?: number; primaryAction?: { buttonLabel: string; onAction: () => void }; rows?: Array<{ email: string; name: string; provider: string; roleName: string; uuid: string }>; title?: string; summary?: string }): ReactElement => (
    <section>
        {title ? <h2>{title}</h2> : null}
        <p>{summary ?? `Showing ${rows?.length ?? 0} users on page ${pageNumber ?? 1}`}</p>
        {primaryAction ? <button onClick={primaryAction.onAction} type="button">{primaryAction.buttonLabel}</button> : null}
        {action && rows && rows[0] ? (
            Array.isArray(action) ? (
                action.map((a: any, i: number) => (
                    <button key={i} onClick={() => a.onAction(rows[0]!)} type="button">{a.buttonLabel}</button>
                ))
            ) : (
                <button onClick={() => action.onAction(rows[0]!)} type="button">{action.buttonLabel}</button>
            )
        ) : null}
    </section>
),
	Pagination: ({ currentPage, totalPages }: { currentPage: number; totalPages: number }): ReactElement | null => (totalPages > 1 ? <p>{`Page ${currentPage} of ${totalPages}`}</p> : null),
	Input: ({ inputId, label, name, onInput, type, value }: { inputId: string; label: string; name: string; onInput?: (event: { target: { value: string } }) => void; type?: string; value?: string }): ReactElement => (
		<label htmlFor={inputId}>
			<span>{label}</span>
			<input id={inputId} name={name} type={type} value={value} onInput={(event): void => onInput?.({ target: { value: (event.target as HTMLInputElement).value } })} />
		</label>
	),
	Heading: ({ children }: PropsWithChildren): ReactElement => <h1>{children}</h1>,
	Notice: ({ children, noticeTitle }: PropsWithChildren<{ noticeTitle?: string }>): ReactElement => <section>{noticeTitle ? <h2>{noticeTitle}</h2> : null}{children}</section>,
	Select: ({ children, label, name, onInput, selectId, value }: PropsWithChildren<{ label: string; name: string; onInput?: (event: { target: { value: string } }) => void; selectId: string; value?: string }>): ReactElement => (
		<label htmlFor={selectId}>
			<span>{label}</span>
			<select id={selectId} name={name} value={value} onInput={(event): void => onInput?.({ target: { value: (event.target as HTMLSelectElement).value } })}>
				{children}
			</select>
		</label>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
	Modal: ({ children, isOpen, title }: PropsWithChildren<{ isOpen: boolean; title: string }>): ReactElement | null => (isOpen ? <section><h2>{title}</h2>{children}</section> : null),
	ToastProvider: ({ children }: PropsWithChildren): ReactElement => <>{children}</>,
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: (): typeof navigate => navigate,
	useRouterState: ({ select }: { select: (state: { location: { pathname: string } }) => string }): string =>
		select({ location: { pathname: "/users" } }),
}));

vi.mock("@/hooks", () => ({
	useAdminListState: vi.fn(() => ({
		page: 1,
		searchDraft: "",
		setPage: vi.fn(),
		setSearchDraft: vi.fn(),
	})),
	useRoles: vi.fn(),
	useDepartments: vi.fn(),
	useUserManagement: vi.fn(),
	useUserDepartment: vi.fn(),
	useUserRole: vi.fn(),
}));

describe("UsersPage", () => {
	it("supports modal-driven user management with inline role assignment", () => {
		vi.mocked(useUserManagement).mockReturnValue({
			error: null,
			createUser: vi.fn((): Promise<void> => Promise.resolve()),
			deleteUser: vi.fn((): Promise<void> => Promise.resolve()),
			isCreating: false,
			isDeleting: false,
			isLoading: false,
			isUpdating: false,
			itemsPerPage: 10,
			page: 1,
			response: {
				data: [
					{
							"authProvider": "gc-sso",
							"authSubject": "subject-123",
							"departmentAbbreviation": "AAFC",
						email: "jane@example.com",
						name: "Jane Doe",
					"profileImageUrl": "https://example.com/jane.png",
					"departmentUuid": "department-uuid-1",
					"roleUuids": ["role-uuid-3"],
					"tierUuid": "tier-uuid-3",
						uuid: "user-uuid-7",
					},
				],
				"has_more": false,
				"items_per_page": 10,
				page: 1,
				"total_count": 1,
			},
			users: [
				{
							"authProvider": "gc-sso",
							"authSubject": "subject-123",
							"departmentAbbreviation": "AAFC",
					email: "jane@example.com",
					name: "Jane Doe",
					"profileImageUrl": "https://example.com/jane.png",
					"departmentUuid": "department-uuid-1",
					"roleUuids": ["role-uuid-3"],
					"tierUuid": "tier-uuid-3",
					uuid: "user-uuid-7",
				},
			],
			updateUser: vi.fn((): Promise<void> => Promise.resolve()),
		});
		vi.mocked(useRoles).mockReturnValue({
			error: null,
			isLoading: false,
			itemsPerPage: 10,
			page: 1,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
			response: {
				data: [
					{ created_at: "2026-03-17T00:00:00Z", description: "Administrator role", name: "admin", uuid: "role-uuid-3" },
					{ created_at: "2026-03-17T00:00:00Z", description: "Editor role", name: "editor", uuid: "role-uuid-4" },
				],
				"has_more": false,
				"items_per_page": 10,
				page: 1,
				"total_count": 2,
			},
			roles: [
				{ created_at: "2026-03-17T00:00:00Z", description: "Administrator role", name: "admin", uuid: "role-uuid-3" },
				{ created_at: "2026-03-17T00:00:00Z", description: "Editor role", name: "editor", uuid: "role-uuid-4" },
			],
		});
		const department = {
			abbreviation: "AAFC",
			abbreviationFr: "AAC",
			createdAt: "2026-03-23T00:00:00Z",
			gcOrgId: 42,
			leadDepartmentName: "Agriculture and Agri-Food Canada",
			leadDepartmentNameFr: "Agriculture et Agroalimentaire Canada",
			name: "Engineering",
			nameFr: "Ingenierie",
			uuid: "department-uuid-1",
		};
		const secondDepartment = {
			abbreviation: "FIN",
			abbreviationFr: "FIN",
			createdAt: "2026-03-23T00:00:00Z",
			gcOrgId: 108,
			leadDepartmentName: "Department of Finance Canada",
			leadDepartmentNameFr: "Ministere des Finances Canada",
			name: "Finance",
			nameFr: "Finances",
			uuid: "department-uuid-2",
		};
		vi.mocked(useDepartments).mockReturnValue({
			error: null,
			isLoading: false,
			itemsPerPage: 200,
			page: 1,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
			response: {
				data: [department, secondDepartment],
				has_more: false,
				items_per_page: 200,
				page: 1,
				total_count: 2,
			},
			departments: [department, secondDepartment],
		});
		vi.mocked(useUserDepartment).mockReturnValue({
			department,
			error: null,
			isLoading: false,
			isUpdating: false,
			updateUserDepartment: vi.fn((): Promise<void> => Promise.resolve()),
		});
		vi.mocked(useUserRole).mockReturnValue({
			addRole: vi.fn((): Promise<void> => Promise.resolve()),
			error: null,
			isAdding: false,
			isLoading: false,
			isRemoving: false,
			removeRole: vi.fn((): Promise<void> => Promise.resolve()),
			role: { created_at: "2026-03-17T00:00:00Z", description: "Administrator role", name: "admin", uuid: "role-uuid-3" },
		});

		render(
			<ToastProvider>
				<UsersPage />
			</ToastProvider>,
		);

		expect(screen.getAllByRole("heading", { name: /users/i }).length).toBeGreaterThan(0);
		expect(screen.getByRole("button", { name: /create user/i })).toBeTruthy();
		expect(screen.getByText(/showing 1 users on page 1/i)).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: /create user/i }));
		expect(screen.getByRole("heading", { name: /create user/i })).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: /manage user/i }));
		expect(useDepartments).toHaveBeenCalledWith(1, 200);
		expect(screen.getByRole("heading", { name: /edit user/i })).toBeTruthy();
		expect(screen.getByRole("heading", { name: /assigned department/i })).toBeTruthy();
		expect(screen.getByLabelText(/filter departments/i)).toBeTruthy();
		expect(screen.getByRole("option", { name: /engineering/i })).toBeTruthy();
		expect(screen.getByRole("option", { name: /finance/i })).toBeTruthy();
		fireEvent.input(screen.getByLabelText(/filter departments/i), { target: { value: "fin" } });
		expect(screen.queryByRole("option", { name: /engineering/i })).toBeNull();
		expect(screen.getByRole("option", { name: /finance/i })).toBeTruthy();
		expect(screen.getByRole("button", { name: /save department/i })).toBeTruthy();
		fireEvent.input(screen.getByLabelText(/^department$/i), { target: { value: "FIN" } });
		fireEvent.click(screen.getByRole("button", { name: /save department/i }));
		expect(vi.mocked(useUserDepartment).mock.results[0]?.value.updateUserDepartment).toHaveBeenCalledWith("user-uuid-7", { departmentAbbreviation: "FIN" });
	});

	it("does not render a generic error notice for unauthorized hook errors", () => {
		vi.mocked(useUserManagement).mockReturnValue({
			error: new UnauthorizedRequestError(),
			createUser: vi.fn((): Promise<void> => Promise.resolve()),
			deleteUser: vi.fn((): Promise<void> => Promise.resolve()),
			isCreating: false,
			isDeleting: false,
			isLoading: false,
			isUpdating: false,
			itemsPerPage: 10,
			page: 1,
			response: null,
			updateUser: vi.fn((): Promise<void> => Promise.resolve()),
			users: [],
		});
		vi.mocked(useRoles).mockReturnValue({
			error: null,
			isLoading: false,
			itemsPerPage: 10,
			page: 1,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
			response: null,
			roles: [],
		});
		vi.mocked(useDepartments).mockReturnValue({
			error: null,
			isLoading: false,
			itemsPerPage: 10,
			page: 1,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
			response: null,
			departments: [],
		});
		vi.mocked(useUserDepartment).mockReturnValue({
			department: null,
			error: null,
			isLoading: false,
			isUpdating: false,
			updateUserDepartment: vi.fn((): Promise<void> => Promise.resolve()),
		});
		vi.mocked(useUserRole).mockReturnValue({
			error: null,
			isAdding: false,
			isLoading: false,
			isRemoving: false,
			role: null,
			addRole: vi.fn((): Promise<void> => Promise.resolve()),
			removeRole: vi.fn((): Promise<void> => Promise.resolve()),
		});

		render(
			<ToastProvider>
				<UsersPage />
			</ToastProvider>,
		);

		expect(navigate).not.toHaveBeenCalled();
		expect(screen.queryByText(/users.errorTitle/i)).toBeNull();
	});
});
