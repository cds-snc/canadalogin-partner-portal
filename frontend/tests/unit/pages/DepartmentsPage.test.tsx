import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DepartmentsPage } from "@/features/departments/pages/DepartmentsPage";
import { useDepartmentManagement } from "@/hooks";

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string) => string } => ({
		t: (key: string): string => {
			const translations: Record<string, string> = {
				"departments.abbreviationFrLabel": "French abbreviation",
				"departments.abbreviationLabel": "Abbreviation",
				"departments.createdAtLabel": "Created",
				"departments.createAction": "Create department",
				"departments.createTitle": "Create department",
				"departments.editTitle": "Edit department",
				"departments.gcOrgIdLabel": "GC org ID",
				"departments.leadDepartmentNameFrLabel": "Lead department (FR)",
				"departments.leadDepartmentNameLabel": "Lead department",
				"departments.manageAction": "Manage department",
				"departments.nameFrLabel": "French department name",
				"departments.nameLabel": "Department name",
				"departments.summary": "Manage backend departments.",
				"departments.title": "Departments",
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@/components/layout", () => ({
	Breadcrumbs: ({ items }: { items: Array<{ href: string; label: string }> }): ReactElement => <nav>{items.map((i) => i.label).join(" > ")}</nav>,
}));

vi.mock("@/components/ui", () => ({
	Button: ({ children, onGcdsClick }: PropsWithChildren<{ onGcdsClick?: () => void }>): ReactElement => <button onClick={onGcdsClick} type="button">{children}</button>,
	ConfirmDialog: ({ isOpen, title }: { isOpen: boolean; title: string }): ReactElement | null => (isOpen ? <section><h2>{title}</h2></section> : null),
	DataTable: ({ action, columns, primaryAction, rows, title }: { action?: { buttonLabel: string; onAction: (row: { abbreviation: string; createdAt: string; name: string; uuid: string }) => void }; columns?: Array<{ headerName: string }>; primaryAction?: { buttonLabel: string; onAction: () => void }; rows?: Array<{ abbreviation: string; createdAt: string; name: string; uuid: string }>; title?: string }): ReactElement => (
		<section>
			{title ? <h2>{title}</h2> : null}
			{columns?.map((column) => <span key={column.headerName}>{column.headerName}</span>)}
			{primaryAction ? <button onClick={primaryAction.onAction} type="button">{primaryAction.buttonLabel}</button> : null}
			{action && rows && rows[0] ? <button onClick={() => action.onAction(rows[0]!)} type="button">{action.buttonLabel}</button> : null}
		</section>
	),
	Heading: ({ children }: PropsWithChildren): ReactElement => <h1>{children}</h1>,
	Input: ({ inputId, label, onInput, value }: { inputId: string; label: string; onInput?: (event: { target: { value: string } }) => void; value?: string }): ReactElement => (
		<label htmlFor={inputId}>
			<span>{label}</span>
			<input id={inputId} value={value} onInput={(event): void => onInput?.({ target: { value: (event.target as HTMLInputElement).value } })} />
		</label>
	),
	Modal: ({ children, footer, isOpen, title }: PropsWithChildren<{ footer?: ReactElement; isOpen: boolean; title: string }>): ReactElement | null => (isOpen ? <section><h2>{title}</h2>{children}{footer}</section> : null),
	Notice: ({ children }: PropsWithChildren): ReactElement => <section>{children}</section>,
	Pagination: (): ReactElement | null => null,
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/hooks", () => ({
	useAdminListState: vi.fn(() => ({
		page: 1,
		searchDraft: "",
		setPage: vi.fn(),
		setSearchDraft: vi.fn(),
	})),
	useDepartmentManagement: vi.fn(),
}));

describe("DepartmentsPage", () => {
	it("supports modal-driven department management", () => {
			const department = {
				abbreviation: "ENG",
				abbreviationFr: "ING",
				createdAt: "2026-03-23T00:00:00Z",
				gcOrgId: 42,
				leadDepartmentName: "Treasury Board of Canada Secretariat",
				leadDepartmentNameFr: "Secretariat du Conseil du Tresor du Canada",
				name: "Engineering",
				nameFr: "Ingenierie",
				uuid: "department-uuid-1",
			};

		vi.mocked(useDepartmentManagement).mockReturnValue({
			createDepartment: vi.fn((): Promise<void> => Promise.resolve()),
			deleteDepartment: vi.fn((): Promise<void> => Promise.resolve()),
			error: null,
			isCreating: false,
			isDeleting: false,
			isLoading: false,
			isUpdating: false,
			itemsPerPage: 10,
			page: 1,
			response: {
					data: [department],
				"has_more": false,
				"items_per_page": 10,
				page: 1,
				"total_count": 1,
			},
				departments: [department],
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
			updateDepartment: vi.fn((): Promise<void> => Promise.resolve()),
		});

		render(<DepartmentsPage />);

		expect(screen.getAllByRole("heading", { name: /departments/i }).length).toBeGreaterThan(0);
		expect(screen.getAllByText(/abbreviation|department name|created/i).map((node) => node.textContent)).toEqual([
			"Abbreviation",
			"Department name",
		]);
		fireEvent.click(screen.getByRole("button", { name: /create department/i }));
		expect(screen.getByRole("heading", { name: /create department/i })).toBeTruthy();
		fireEvent.click(screen.getByRole("button", { name: /manage department/i }));
		expect(screen.getByRole("heading", { name: /edit department/i })).toBeTruthy();
		expect(screen.getByLabelText(/^abbreviation$/i)).toBeTruthy();
		expect(screen.getByLabelText(/^french abbreviation$/i)).toBeTruthy();
		expect(screen.getByLabelText(/^gc org id$/i)).toBeTruthy();
		expect(screen.getByLabelText(/^french department name$/i)).toBeTruthy();
		expect(screen.getByLabelText(/^lead department$/i)).toBeTruthy();
		expect(screen.getByLabelText(/lead department \(fr\)/i)).toBeTruthy();
		expect(screen.queryByLabelText(/faa \/ lgfp/i)).toBeNull();
		expect(screen.queryByLabelText(/status/i)).toBeNull();
	});
});