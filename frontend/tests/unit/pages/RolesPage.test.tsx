import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RolesPage } from "@/features/roles/pages/RolesPage";
import { useRoleManagement } from "@/hooks";

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string, options?: Record<string, string>) => string } => ({
		t: (key: string, options?: Record<string, string>): string => {
			const translations: Record<string, string> = {
				"roles.createAction": "Create role",
				"roles.createTitle": "Create role",
				"roles.description": `Description: ${options?.["value"] ?? ""}`,
				"roles.editTitle": "Edit role",
				"roles.manageAction": "Manage role",
				"roles.resultsSummary": `Showing ${options?.["count"] ?? "0"} roles on page ${options?.["page"] ?? "1"}`,
				"roles.summary": "Manage backend roles.",
				"roles.title": "Roles",
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@gcds-core/components-react", () => ({
	GcdsBreadcrumbs: ({ children }: PropsWithChildren): ReactElement => <nav>{children}</nav>,
	GcdsBreadcrumbsItem: ({ children }: PropsWithChildren): ReactElement => <span>{children}</span>,
	GcdsHeading: ({ children }: PropsWithChildren): ReactElement => <h1>{children}</h1>,
	GcdsNotice: ({ children, noticeTitle }: PropsWithChildren<{ noticeTitle?: string }>): ReactElement => (
		<section>
			{noticeTitle ? <h2>{noticeTitle}</h2> : null}
			{children}
		</section>
	),
	GcdsText: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: vi.fn(() => vi.fn()),
	useRouterState: ({ select }: { select: (state: { location: { pathname: string } }) => string }): string =>
		select({ location: { pathname: "/roles" } }),
}));

vi.mock("@/components/ui", () => ({
	Button: ({ children, onGcdsClick, type }: PropsWithChildren<{ onGcdsClick?: () => void; type?: "button" | "submit" }>): ReactElement => (
		<button type={type ?? "button"} onClick={onGcdsClick}>
			{children}
		</button>
	),
	ConfirmDialog: ({ isOpen, title }: { isOpen: boolean; title: string }): ReactElement | null => (isOpen ? <section><h2>{title}</h2></section> : null),
	DataTable: ({ action, pageNumber, primaryAction, title, rows, summary }: { action?: { buttonLabel: string; onAction: (row: { description: string; name: string; uuid: string }) => void }; pageNumber?: number; primaryAction?: { buttonLabel: string; onAction: () => void }; rows?: Array<{ description: string; name: string; uuid: string }>; title?: string; summary?: string }): ReactElement => (
		<section>
			{title ? <h2>{title}</h2> : null}
			<p>{summary ?? `Showing ${rows?.length ?? 0} roles on page ${pageNumber ?? 1}`}</p>
			{primaryAction ? <button onClick={primaryAction.onAction} type="button">{primaryAction.buttonLabel}</button> : null}
			{action && rows && rows[0] ? <button onClick={() => action.onAction(rows[0]!)} type="button">{action.buttonLabel}</button> : null}
		</section>
	),
	Pagination: ({ currentPage, totalPages }: { currentPage: number; totalPages: number }): ReactElement | null => (totalPages > 1 ? <p>{`Page ${currentPage} of ${totalPages}`}</p> : null),
	Input: ({ inputId, label, name, onInput, value }: { inputId: string; label: string; name: string; onInput?: (event: { target: { value: string } }) => void; value?: string }): ReactElement => (
		<label htmlFor={inputId}>
			<span>{label}</span>
			<input id={inputId} name={name} value={value} onInput={(event): void => onInput?.({ target: { value: (event.target as HTMLInputElement).value } })} />
		</label>
	),
	Heading: ({ children }: PropsWithChildren): ReactElement => <h1>{children}</h1>,
	Modal: ({ children, isOpen, title }: PropsWithChildren<{ isOpen: boolean; title: string }>): ReactElement | null => (isOpen ? <section><h2>{title}</h2>{children}</section> : null),
	Notice: ({ children, noticeTitle }: PropsWithChildren<{ noticeTitle?: string }>): ReactElement => <section>{noticeTitle ? <h2>{noticeTitle}</h2> : null}{children}</section>,
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/hooks", () => ({
	useAdminListState: vi.fn(() => ({
		page: 1,
		searchDraft: "",
		setPage: vi.fn(),
		setSearchDraft: vi.fn(),
	})),
	useRoleManagement: vi.fn(),
}));

describe("RolesPage", () => {
	it("supports modal-driven role management", () => {
		vi.mocked(useRoleManagement).mockReturnValue({
			createRole: vi.fn((): Promise<void> => Promise.resolve()),
			deleteRole: vi.fn((): Promise<void> => Promise.resolve()),
			error: null,
			isCreating: false,
			isDeleting: false,
			isLoading: false,
			isUpdating: false,
			itemsPerPage: 10,
			page: 1,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
			response: {
				data: [{ created_at: "2026-03-17T00:00:00Z", description: "Administrator role", name: "admin", uuid: "role-uuid-3" }],
				"has_more": false,
				"items_per_page": 10,
				page: 1,
				"total_count": 1,
			},
			roles: [{ created_at: "2026-03-17T00:00:00Z", description: "Administrator role", name: "admin", uuid: "role-uuid-3" }],
			updateRole: vi.fn((): Promise<void> => Promise.resolve()),
		});

		render(<RolesPage />);

		expect(screen.getAllByRole("heading", { name: /roles/i }).length).toBeGreaterThan(0);
		expect(screen.getByRole("button", { name: /create role/i })).toBeTruthy();
		expect(screen.getByText(/showing 1 roles on page 1/i)).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: /create role/i }));
		expect(screen.getByRole("heading", { name: /create role/i })).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: /manage role/i }));
		expect(screen.getByRole("heading", { name: /edit role/i })).toBeTruthy();
	});
});