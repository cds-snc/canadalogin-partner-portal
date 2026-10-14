import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { DepartmentSetupPage } from "@/features/your-applications/pages/DepartmentSetupPage";
import { HttpRequestError } from "@/fetch/errors";
import { assignCurrentUserRPApplicationDepartment } from "@/fetch/rp-applications";

const replaceMock = vi.fn();
const navigateMock = vi.hoisted(() => vi.fn());
const originalLocation = globalThis.location;

vi.mock("@tanstack/react-router", () => ({
	useParams: (): { applicationUuid: string } => ({
		applicationUuid: "application-uuid-1",
	}),
	useSearch: (): { redirect?: string } => ({}),
	useNavigate: (): typeof navigateMock => navigateMock,
}));

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string) => string } => ({
		t: (key: string): string => {
			const map: Record<string, string> = {
				"rpDepartmentSetup.chooseDepartment": "Choose a department",
				"rpDepartmentSetup.errorLoading": "Failed to load departments",
				"rpDepartmentSetup.errorSaving": "Failed to assign department",
				"rpDepartmentSetup.intro": "Select a department to continue.",
				"rpDepartmentSetup.loading": "Loading departments",
				"rpDepartmentSetup.noDepartments": "No departments available",
				"rpDepartmentSetup.save": "Assign department",
				"rpDepartmentSetup.departmentLabel": "Department",
				"rpDepartmentSetup.title": "Assign application department",
			};
			return map[key] ?? key;
		},
	}),
}));

vi.mock("@/features/departments/hooks/use-departments", () => ({
	useDepartments: vi.fn().mockReturnValue({
		departments: [
			{ uuid: "dept-uuid-1", name: "Agriculture Canada" },
			{ uuid: "dept-uuid-2", name: "Treasury Board" },
		],
		isLoading: false,
		error: null,
	}),
}));

vi.mock("@/fetch/rp-applications", async () => {
	const actual = await vi.importActual("@/fetch/rp-applications");
	return {
		...actual,
		assignCurrentUserRPApplicationDepartment: vi.fn(),
	};
});

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		onGcdsClick,
	}: PropsWithChildren<{ onGcdsClick?: () => void }>): ReactElement => (
		<button type="button" onClick={onGcdsClick}>
			{children}
		</button>
	),
	Heading: ({ children }: PropsWithChildren): ReactElement => <h1>{children}</h1>,
	Notice: ({
		children,
		noticeTitle,
	}: PropsWithChildren<{ noticeTitle: string }>): ReactElement => (
		<section>
			<h2>{noticeTitle}</h2>
			{children}
		</section>
	),
	Grid: ({ children }: PropsWithChildren): ReactElement => <div>{children}</div>,
	Select: ({
		children,
		value,
		onInput,
	}: PropsWithChildren<{
		value: string;
		onInput: React.FormEventHandler<HTMLSelectElement>;
	}>): ReactElement => (
		<select value={value} onInput={onInput}>
			{children}
		</select>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

const mockedAssignDepartment = vi.mocked(assignCurrentUserRPApplicationDepartment);

describe("YourApplicationsDepartmentSetupPage", () => {
	beforeAll(() => {
		Object.defineProperty(globalThis, "location", {
			configurable: true,
			value: {
				pathname:
					"/applications/application-uuid-1/department-setup",
				replace: replaceMock,
			} as Pick<Location, "pathname" | "replace">,
		});
	});

	afterEach(() => {
		replaceMock.mockReset();
		mockedAssignDepartment.mockReset();
		navigateMock.mockReset().mockResolvedValue(undefined);
	});

	afterAll(() => {
		Object.defineProperty(globalThis, "location", {
			configurable: true,
			value: originalLocation,
		});
	});

	it("renders the department picker without loading RP application context", async () => {
		render(<DepartmentSetupPage />);

		expect(
			await screen.findByRole("heading", {
				name: "Assign application department",
			})
		).toBeTruthy();
		await screen.findByText("Select a department to continue.");
	});

	it("shows setup instruction and department picker", async () => {
		render(<DepartmentSetupPage />);

		await screen.findByText("Select a department to continue.");
		expect(screen.getByText("Assign department")).toBeTruthy();
	});

	it("does not show a cancel or back button", async () => {
		render(<DepartmentSetupPage />);

		await screen.findByText("Assign department");

		const buttons = screen.getAllByRole("button");
		const cancelButton = buttons.find(
			(btn) =>
				btn.textContent?.toLowerCase().includes("cancel") ||
				btn.textContent?.toLowerCase().includes("back")
		);
		expect(cancelButton).toBeUndefined();
	});

	it("assigns the selected department and returns to the application", async () => {
		mockedAssignDepartment.mockResolvedValue({
			id: 10,
			uuid: "application-uuid-1",
			dnrAppName: "Benefits Portal",
			departmentId: 1,
		});
		render(<DepartmentSetupPage />);

		fireEvent.input(screen.getByRole("combobox"), {
			target: { value: "dept-uuid-1" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Assign department" }));

		await waitFor(() => {
			expect(mockedAssignDepartment).toHaveBeenCalledWith(
				"application-uuid-1",
				{ departmentUuid: "dept-uuid-1" }
			);
			expect(navigateMock).toHaveBeenCalledWith({
				to: "/applications/application-uuid-1",
				replace: true,
			});
		});
	});

	it("treats an already-assigned department as success", async () => {
		mockedAssignDepartment.mockRejectedValue(
			new HttpRequestError({ status: 409 })
		);
		render(<DepartmentSetupPage />);

		fireEvent.input(screen.getByRole("combobox"), {
			target: { value: "dept-uuid-1" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Assign department" }));

		await waitFor(() => {
			expect(navigateMock).toHaveBeenCalledWith({
				to: "/applications/$applicationUuid",
				params: { applicationUuid: "application-uuid-1" },
				replace: true,
			});
		});
	});

	it.each([
		{ status: 403, path: "/access-denied" },
		{ status: 404, path: "/404" },
	])(
		"redirects to $path when assignment returns $status",
		async ({ status, path }) => {
			mockedAssignDepartment.mockRejectedValue(
				new HttpRequestError({ status })
			);
			render(<DepartmentSetupPage />);

			fireEvent.input(screen.getByRole("combobox"), {
				target: { value: "dept-uuid-1" },
			});
			fireEvent.click(screen.getByRole("button", { name: "Assign department" }));

			await waitFor(() => {
				expect(replaceMock).toHaveBeenCalledWith(path);
			});
		}
	);
});
